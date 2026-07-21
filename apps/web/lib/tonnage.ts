import type { Tables } from "@athleteiq/db/types";
import type { Athlete1RMRecord } from "@athleteiq/db/queries/exercises";

type ExerciseSetRow = Tables<"exercise_sets">;
type ExerciseWithSets = Tables<"exercises"> & { exercise_sets: ExerciseSetRow[] };
type SessionWithExercises = Tables<"training_sessions"> & { exercises: ExerciseWithSets[] };

export interface TonnageSummary {
  /** Kg tipi ve çözülebilen %1RM setlerinin toplamı (reps × kg). */
  totalKg: number;
  /** %1RM seti var ama sporcunun bu egzersiz için 1RM kaydı yok — tonaja dahil edilemedi. */
  excludedSetCount: number;
  /** Vücut ağırlığı/direnç bandı setlerinin tekrar toplamı (kg değil, ayrı sayılır). */
  bodyweightRepCount: number;
}

const EMPTY: TonnageSummary = { totalKg: 0, excludedSetCount: 0, bodyweightRepCount: 0 };

function sumTonnage(a: TonnageSummary, b: TonnageSummary): TonnageSummary {
  return {
    totalKg: a.totalKg + b.totalKg,
    excludedSetCount: a.excludedSetCount + b.excludedSetCount,
    bodyweightRepCount: a.bodyweightRepCount + b.bodyweightRepCount,
  };
}

/** Her egzersiz adı için en güncel 1RM kaydına hızlı erişim. */
export function buildMaxLookup(athleteMaxes: Athlete1RMRecord[]): Map<string, number> {
  const lookup = new Map<string, number>();
  for (const record of athleteMaxes) {
    if (!lookup.has(record.exercise_name)) {
      lookup.set(record.exercise_name, record.weight_kg);
    }
  }
  return lookup;
}

function calculateSetTonnage(
  set: ExerciseSetRow,
  exerciseName: string,
  maxLookup: Map<string, number>
): TonnageSummary {
  const reps = set.reps ?? 0;

  if (set.is_bodyweight || set.band_resistance) {
    return { ...EMPTY, bodyweightRepCount: reps };
  }
  if (set.load_kg != null) {
    return { ...EMPTY, totalKg: reps * set.load_kg };
  }
  if (set.percent_1rm != null) {
    const oneRm = maxLookup.get(exerciseName);
    if (oneRm == null) {
      return { ...EMPTY, excludedSetCount: 1 };
    }
    return { ...EMPTY, totalKg: reps * (set.percent_1rm / 100) * oneRm };
  }
  return EMPTY;
}

export function calculateExerciseTonnage(
  exercise: ExerciseWithSets,
  maxLookup: Map<string, number>
): TonnageSummary {
  return (exercise.exercise_sets ?? []).reduce(
    (acc, set) => sumTonnage(acc, calculateSetTonnage(set, exercise.name, maxLookup)),
    EMPTY
  );
}

export function calculateSessionTonnage(
  session: SessionWithExercises,
  maxLookup: Map<string, number>
): TonnageSummary {
  return (session.exercises ?? []).reduce(
    (acc, exercise) => sumTonnage(acc, calculateExerciseTonnage(exercise, maxLookup)),
    EMPTY
  );
}

export function calculateProgramTonnage(
  sessions: SessionWithExercises[],
  maxLookup: Map<string, number>
): TonnageSummary {
  return sessions.reduce((acc, session) => sumTonnage(acc, calculateSessionTonnage(session, maxLookup)), EMPTY);
}
