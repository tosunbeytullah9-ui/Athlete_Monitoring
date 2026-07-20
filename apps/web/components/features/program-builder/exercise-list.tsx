"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import type {
  ArrayPath,
  Control,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { Input } from "@athleteiq/ui/components/input";
import { Label } from "@athleteiq/ui/components/label";
import { ExercisePickerModal } from "@/components/features/exercises/exercise-picker-modal";
import type {
  PlatformExercise,
  OrgExercise,
  OrgExerciseCategory,
} from "@athleteiq/db/queries/exercises";

export const SUPERSET_GROUPS = ["", "A", "B", "C", "D", "E", "F", "G"] as const;

export const SUPERSET_COLORS: Record<string, string> = {
  A: "border-l-violet-500",
  B: "border-l-emerald-500",
  C: "border-l-blue-500",
  D: "border-l-orange-500",
  E: "border-l-pink-500",
  F: "border-l-cyan-500",
  G: "border-l-yellow-500",
};

export const LOAD_TYPES = [
  { value: "absolute_kg", label: "kg", inputLabel: "Yük (kg)" },
  { value: "percentage_1rm", label: "%1RM", inputLabel: "1RM %" },
  { value: "rpe", label: "RPE", inputLabel: "RPE" },
] as const;

export const exerciseSchema = z.object({
  name: z.string().min(1, "Egzersiz adı gerekli"),
  category: z.string().optional(),
  sets: z.number().int().positive().optional().or(z.literal(undefined)),
  reps: z.number().int().positive().optional().or(z.literal(undefined)),
  load_type: z.enum(["absolute_kg", "percentage_1rm", "rpe"]).default("absolute_kg"),
  load_kg: z.number().positive().optional().or(z.literal(undefined)),
  load_percent_1rm: z.number().positive().max(100).optional().or(z.literal(undefined)),
  rpe_target: z.number().min(0).max(10).optional().or(z.literal(undefined)),
  rest_sec: z.number().int().positive().optional().or(z.literal(undefined)),
  unit: z.enum(["kg", "lb", "%", "bodyweight"]).default("kg"),
  notes: z.string().optional(),
  superset_group: z.string().optional(),
  superset_order: z.number().int().default(0),
});

export type ExerciseFormValues = z.infer<typeof exerciseSchema>;

// ExerciseList sadece "sessions.N.exercises" alanına ihtiyaç duyar — çağıran
// dosyanın tam ProgramForm tipi (title/scope/team_id/vb.) burada önemli değil.
export interface ProgramFormShape extends FieldValues {
  sessions: { exercises: ExerciseFormValues[] }[];
}

interface ExerciseListProps<TFieldValues extends ProgramFormShape> {
  sessionIdx: number;
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  platformExercises: PlatformExercise[];
  orgExercises: OrgExercise[];
  categories: OrgExerciseCategory[];
}

export function ExerciseList<TFieldValues extends ProgramFormShape>({
  sessionIdx,
  register,
  control,
  watch,
  setValue,
  platformExercises,
  orgExercises,
  categories,
}: ExerciseListProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sessions.${sessionIdx}.exercises` as ArrayPath<TFieldValues>,
  });

  const [pickerOpen, setPickerOpen] = useState(false);

  const exercises =
    (watch(`sessions.${sessionIdx}.exercises` as Path<TFieldValues>) as
      | ExerciseFormValues[]
      | undefined) ?? [];

  function getGroupCount(group: string): number {
    return exercises.filter((e) => e.superset_group === group && group !== "").length;
  }

  function getNextGroupOrder(group: string): number {
    if (!group) return 0;
    return getGroupCount(group);
  }

  function handleGroupChange(exIdx: number, group: string) {
    if (group && getGroupCount(group) >= 10) return;
    setValue(
      `sessions.${sessionIdx}.exercises.${exIdx}.superset_group` as Path<TFieldValues>,
      (group || undefined) as never
    );
    setValue(
      `sessions.${sessionIdx}.exercises.${exIdx}.superset_order` as Path<TFieldValues>,
      (group ? getNextGroupOrder(group) : 0) as never
    );
  }

  const groupCounts: Record<string, number> = {};
  const groupStartIndices = new Set<number>();

  for (const ex of exercises) {
    if (ex.superset_group) {
      groupCounts[ex.superset_group] = (groupCounts[ex.superset_group] ?? 0) + 1;
    }
  }

  let lastGroup: string | null = null;
  for (let i = 0; i < exercises.length; i++) {
    const g = exercises[i]?.superset_group ?? null;
    if (g && g !== lastGroup) {
      groupStartIndices.add(i);
    }
    lastGroup = g ?? null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Egzersizler</Label>
        <div className="flex gap-2">
          {(platformExercises.length > 0 || orgExercises.length > 0) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Kütüphaneden Seç
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                name: "",
                unit: "kg",
                load_type: "absolute_kg",
                superset_group: undefined,
                superset_order: 0,
              } as never)
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Egzersiz Ekle
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
          Henüz egzersiz eklenmedi.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, exIdx) => {
            const ex = exercises[exIdx];
            const group = ex?.superset_group ?? "";
            const isGroupStart = group && groupStartIndices.has(exIdx);
            const borderColor = group ? SUPERSET_COLORS[group] ?? "border-l-gray-400" : "";

            return (
              <div key={field.id}>
                {isGroupStart && (
                  <p className="text-xs font-semibold text-muted-foreground mb-1 pl-3">
                    {group} Grubu — Süperset ({groupCounts[group] ?? 0} egzersiz)
                  </p>
                )}
                <div
                  className={`rounded-md border p-3 space-y-2 ${
                    group ? `border-l-4 ${borderColor}` : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.name` as Path<TFieldValues>)}
                        placeholder="Egzersiz adı (örn: Back Squat)"
                        className="text-sm"
                      />
                    </div>
                    <select
                      {...register(`sessions.${sessionIdx}.exercises.${exIdx}.load_type` as Path<TFieldValues>)}
                      className="flex h-9 w-24 shrink-0 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      title="Yük tipi"
                    >
                      {LOAD_TYPES.map((lt) => (
                        <option key={lt.value} value={lt.value}>
                          {lt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={group}
                      onChange={(e) => handleGroupChange(exIdx, e.target.value)}
                      className="flex h-9 w-28 shrink-0 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      title="Süperset grubu"
                    >
                      {SUPERSET_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g ? `Grup ${g}` : "Grup Yok"}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => remove(exIdx)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Set</Label>
                      <Input
                        type="number"
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.sets` as Path<TFieldValues>, {
                          valueAsNumber: true,
                        })}
                        placeholder="3"
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tekrar</Label>
                      <Input
                        type="number"
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.reps` as Path<TFieldValues>, {
                          valueAsNumber: true,
                        })}
                        placeholder="8"
                        className="text-sm h-8"
                      />
                    </div>
                    {(ex?.load_type ?? "absolute_kg") === "percentage_1rm" ? (
                      <div>
                        <Label className="text-xs">1RM %</Label>
                        <Input
                          type="number"
                          step="1"
                          min={0}
                          max={100}
                          {...register(
                            `sessions.${sessionIdx}.exercises.${exIdx}.load_percent_1rm` as Path<TFieldValues>,
                            { valueAsNumber: true }
                          )}
                          placeholder="75"
                          className="text-sm h-8"
                        />
                      </div>
                    ) : (ex?.load_type ?? "absolute_kg") === "rpe" ? (
                      <div>
                        <Label className="text-xs">RPE</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min={0}
                          max={10}
                          {...register(`sessions.${sessionIdx}.exercises.${exIdx}.rpe_target` as Path<TFieldValues>, {
                            valueAsNumber: true,
                          })}
                          placeholder="8"
                          className="text-sm h-8"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs">Yük (kg)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          {...register(`sessions.${sessionIdx}.exercises.${exIdx}.load_kg` as Path<TFieldValues>, {
                            valueAsNumber: true,
                          })}
                          placeholder="80"
                          className="text-sm h-8"
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-xs">Dinlenme (s)</Label>
                      <Input
                        type="number"
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.rest_sec` as Path<TFieldValues>, {
                          valueAsNumber: true,
                        })}
                        placeholder="120"
                        className="text-sm h-8"
                      />
                    </div>
                  </div>

                  <Input
                    {...register(`sessions.${sessionIdx}.exercises.${exIdx}.notes` as Path<TFieldValues>)}
                    placeholder="Not (isteğe bağlı)"
                    className="text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && (
        <ExercisePickerModal
          platformExercises={platformExercises}
          orgExercises={orgExercises}
          categories={categories}
          onClose={() => setPickerOpen(false)}
          onPick={(picked) => {
            append({
              name: picked.name,
              category: picked.category,
              unit: "kg",
              load_type: "absolute_kg",
              superset_group: undefined,
              superset_order: 0,
            } as never);
          }}
        />
      )}
    </div>
  );
}
