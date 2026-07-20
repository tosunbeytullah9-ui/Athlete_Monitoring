"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { Input } from "@athleteiq/ui/components/input";
import { Label } from "@athleteiq/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@athleteiq/ui/components/card";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@athleteiq/db/types";
import type {
  PlatformExercise,
  OrgExercise,
  OrgExerciseCategory,
  Athlete1RMRecord,
} from "@athleteiq/db/queries/exercises";
import { ExerciseList, exerciseSchema } from "@/components/features/program-builder/exercise-list";
import type { ExerciseSetFormValues } from "@/components/features/program-builder/exercise-list";

type ProgramRow = Database["public"]["Tables"]["training_programs"]["Row"];
type SessionRow = Database["public"]["Tables"]["training_sessions"]["Row"];
type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

// Set bazlı yük tipini exercise_sets kolonlarına çevirir — yalnızca seçili
// tipin kolonu dolar, diğerleri null (temiz veri, çakışma riski yok).
function setToInsertColumns(set: ExerciseSetFormValues) {
  return {
    load_kg: set.load_type === "kg" ? set.load_kg ?? null : null,
    percent_1rm: set.load_type === "percent_1rm" ? set.percent_1rm ?? null : null,
    is_bodyweight: set.load_type === "bodyweight",
    band_resistance: set.load_type === "band" ? set.band_resistance ?? null : null,
    rpe: set.rpe ?? null,
  };
}

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const SESSION_TYPES = [
  { value: "strength", label: "Kuvvet" },
  { value: "conditioning", label: "Kondisyon" },
  { value: "technical", label: "Teknik" },
  { value: "recovery", label: "Toparlanma" },
  { value: "competition", label: "Müsabaka" },
] as const;

const PHASES = [
  { value: "preparation", label: "Hazırlık" },
  { value: "competition", label: "Müsabaka" },
  { value: "transition", label: "Geçiş" },
  { value: "peak", label: "Zirve" },
] as const;

const sessionSchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  session_type: z.enum(["strength", "conditioning", "technical", "recovery", "competition"]).optional(),
  title: z.string().optional(),
  duration_min: z.number().int().positive().optional().or(z.literal(undefined)),
  exercises: z.array(exerciseSchema).default([]),
});

const programSchema = z.object({
  title: z.string().min(1, "Program başlığı gerekli"),
  scope: z.enum(["team", "athlete"]),
  team_id: z.string().optional(),
  athlete_id: z.string().optional(),
  week_number: z.number().int().min(1).max(52).optional().or(z.literal(undefined)),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  phase: z.enum(["preparation", "competition", "transition", "peak"]).optional(),
  notes: z.string().optional(),
  sessions: z.array(sessionSchema).default([]),
});

type ProgramForm = z.infer<typeof programSchema>;

interface Props {
  orgId: string;
  teams: { id: string; name: string }[];
  athletes: { id: string; full_name: string; team_id: string }[];
  platformExercises?: PlatformExercise[];
  orgExercises?: OrgExercise[];
  categories?: OrgExerciseCategory[];
  athleteMaxes?: Athlete1RMRecord[];
}

const STEPS = ["Temel Bilgiler", "Seanslar", "Özet"];

export function NewProgramClient({
  orgId,
  teams,
  athletes,
  platformExercises = [],
  orgExercises = [],
  categories = [],
  athleteMaxes = [],
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSession, setActiveSession] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      scope: "team",
      sessions: [],
    },
  });

  const { fields: sessionFields, append: appendSession, remove: removeSession } = useFieldArray({
    control,
    name: "sessions",
  });

  const scope = watch("scope");
  const selectedTeamId = watch("team_id");
  const selectedAthleteId = watch("athlete_id");
  const watchedSessions = watch("sessions");

  // "Son max" rozeti yalnızca bireysel (athlete) programlarda anlamlı —
  // takım programının tek bir sporcusu yok, bu yüzden team scope'ta boş kalır.
  const pickerAthleteMaxes = useMemo(
    () =>
      scope === "athlete" && selectedAthleteId
        ? athleteMaxes.filter((m) => m.athlete_id === selectedAthleteId)
        : [],
    [athleteMaxes, scope, selectedAthleteId]
  );

  const filteredAthletes =
    scope === "team" && selectedTeamId
      ? athletes.filter((a) => a.team_id === selectedTeamId)
      : athletes;

  function addSession(dayOfWeek: number) {
    appendSession({
      day_of_week: dayOfWeek,
      session_type: "strength",
      title: "",
      exercises: [],
    });
    setActiveSession(sessionFields.length);
  }

  function onInvalid(formErrors: FieldErrors<ProgramForm>) {
    console.error("Form validasyon hatası:", formErrors);
    alert("Formda eksik veya hatalı alanlar var. Kırmızı işaretli/boş bırakılan alanları kontrol edin.");
  }

  async function onSubmit(data: ProgramForm) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: program, error: programError } = (await db
        .from("training_programs")
        .insert({
          org_id: orgId,
          title: data.title,
          team_id: data.scope === "team" ? (data.team_id ?? null) : null,
          athlete_id: data.scope === "athlete" ? (data.athlete_id ?? null) : null,
          week_number: data.week_number ?? null,
          start_date: data.start_date ?? null,
          end_date: data.end_date ?? null,
          phase: data.phase ?? null,
          notes: data.notes ?? null,
          is_published: false,
        })
        .select()
        .single()) as { data: ProgramRow | null; error: { message: string } | null };

      if (programError) throw new Error(programError.message);
      if (!program) throw new Error("Program oluşturulamadı");

      for (let i = 0; i < data.sessions.length; i++) {
        const session = data.sessions[i]!;

        const { data: dbSession, error: sessionError } = (await db
          .from("training_sessions")
          .insert({
            program_id: program.id,
            day_of_week: session.day_of_week,
            session_type: session.session_type ?? null,
            title: session.title ?? null,
            duration_min: session.duration_min ?? null,
            order_index: i,
          })
          .select()
          .single()) as { data: SessionRow | null; error: { message: string } | null };

        if (sessionError) throw new Error(sessionError.message);
        if (!dbSession) throw new Error("Seans oluşturulamadı");

        for (let exIdx = 0; exIdx < session.exercises.length; exIdx++) {
          const ex = session.exercises[exIdx]!;

          const { data: dbExercise, error: exError } = (await db
            .from("exercises")
            .insert({
              session_id: dbSession.id,
              name: ex.name,
              category: ex.category ?? null,
              rest_sec: ex.rest_sec ?? null,
              notes: ex.notes ?? null,
              order_index: exIdx,
              superset_group: ex.superset_group ?? null,
              superset_order: ex.superset_order ?? 0,
            })
            .select()
            .single()) as { data: ExerciseRow | null; error: { message: string } | null };
          if (exError) throw new Error(exError.message);
          if (!dbExercise) throw new Error("Egzersiz oluşturulamadı");

          const setsPayload = ex.exercise_sets.map((set, setIdx) => ({
            exercise_id: dbExercise.id,
            set_number: setIdx + 1,
            reps: ex.is_duration_based ? null : set.reps ?? null,
            duration_sec: ex.is_duration_based ? set.duration_sec ?? null : null,
            notes: set.notes ?? null,
            ...setToInsertColumns(set),
          }));

          const { error: setsError } = (await db
            .from("exercise_sets")
            .insert(setsPayload)) as { error: { message: string } | null };
          if (setsError) throw new Error(setsError.message);
        }
      }

      router.push(`/programs/${program.id}`);
    } catch (error) {
      console.error("Program kayıt hatası:", error);
      alert(`Hata: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/programs")}>
          <ArrowLeft className="h-4 w-4" />
          Programlar
        </Button>
        <h1 className="text-2xl font-bold">Yeni Program Oluştur</h1>
      </div>

      {/* Adım göstergesi */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "border-2 border-primary text-primary"
                  : "border border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i === step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* ADIM 1: Temel Bilgiler */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Program Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Program Başlığı *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Örn: Hazırlık Dönemi — Hafta 1"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Program Kapsamı *</Label>
                <div className="flex gap-3">
                  {(["team", "athlete"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={s}
                        checked={scope === s}
                        onChange={() => {
                          setValue("scope", s);
                          setValue("team_id", undefined);
                          setValue("athlete_id", undefined);
                        }}
                        className="accent-primary"
                      />
                      <span className="text-sm">{s === "team" ? "Takım" : "Bireysel Sporcu"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {scope === "team" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="team_id">Takım *</Label>
                  <select
                    id="team_id"
                    {...register("team_id")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Takım seçin</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="athlete_id">Sporcu *</Label>
                  <select
                    id="athlete_id"
                    {...register("athlete_id")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Sporcu seçin</option>
                    {filteredAthletes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phase">Dönem</Label>
                  <select
                    id="phase"
                    {...register("phase")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Seçin</option>
                    {PHASES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="week_number">Hafta No</Label>
                  <Input
                    id="week_number"
                    type="number"
                    min={1}
                    max={52}
                    {...register("week_number", { valueAsNumber: true })}
                    placeholder="1–52"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                  <Input id="start_date" type="date" {...register("start_date")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_date">Bitiş Tarihi</Label>
                  <Input id="end_date" type="date" {...register("end_date")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notlar</Label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Program hakkında ek notlar..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => setStep(1)}>
                  Devam
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ADIM 2: Seanslar */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Haftalık Seanslar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {DAY_LABELS.map((day, i) => {
                    const dayNum = i + 1;
                    const hasSessions = sessionFields.some(
                      (s) => watchedSessions[sessionFields.indexOf(s)]?.day_of_week === dayNum
                    );
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => addSession(dayNum)}
                        className={`rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors hover:bg-accent ${
                          hasSessions ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="text-xs text-muted-foreground">{day}</div>
                        <div className="mt-1">
                          {hasSessions ? (
                            <span className="text-primary">+</span>
                          ) : (
                            <Plus className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Seans eklemek için güne tıklayın
                </p>
              </CardContent>
            </Card>

            {sessionFields.map((field, sessionIdx) => {
              const session = watchedSessions[sessionIdx];
              const dayLabel = DAY_LABELS[(session?.day_of_week ?? 1) - 1];
              const isOpen = activeSession === sessionIdx;

              return (
                <Card key={field.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left flex-1"
                        onClick={() => setActiveSession(isOpen ? null : sessionIdx)}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {dayLabel}
                        </span>
                        <div>
                          <p className="font-medium text-sm">
                            {session?.title || SESSION_TYPES.find((t) => t.value === session?.session_type)?.label || "Seans"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session?.exercises?.length ?? 0} egzersiz
                          </p>
                        </div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeSession(sessionIdx);
                          setActiveSession(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>

                  {isOpen && (
                    <CardContent className="space-y-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Seans Türü</Label>
                          <select
                            {...register(`sessions.${sessionIdx}.session_type`)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {SESSION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Başlık</Label>
                          <Input
                            {...register(`sessions.${sessionIdx}.title`)}
                            placeholder="İsteğe bağlı"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Süre (dakika)</Label>
                        <Input
                          type="number"
                          {...register(`sessions.${sessionIdx}.duration_min`, { valueAsNumber: true })}
                          placeholder="60"
                          className="w-32"
                        />
                      </div>

                      <ExerciseList
                        sessionIdx={sessionIdx}
                        register={register}
                        control={control}
                        watch={watch}
                        setValue={setValue}
                        platformExercises={platformExercises}
                        orgExercises={orgExercises}
                        categories={categories}
                        athleteMaxes={pickerAthleteMaxes}
                      />
                    </CardContent>
                  )}
                </Card>
              );
            })}

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4" />
                Geri
              </Button>
              <Button type="button" onClick={() => setStep(2)}>
                Devam
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ADIM 3: Özet */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Program Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const data = watch();
                return (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Başlık</p>
                        <p className="font-medium">{data.title || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dönem</p>
                        <p className="font-medium">
                          {PHASES.find((p) => p.value === data.phase)?.label ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Hafta</p>
                        <p className="font-medium">{data.week_number ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Seans Sayısı</p>
                        <p className="font-medium">{data.sessions?.length ?? 0}</p>
                      </div>
                    </div>

                    {data.sessions?.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Seanslar:</p>
                        <ul className="space-y-1">
                          {data.sessions.map((s, i) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <span className="text-muted-foreground w-6">
                                  {DAY_LABELS[(s.day_of_week ?? 1) - 1]}
                                </span>
                                {s.title ||
                                  SESSION_TYPES.find((t) => t.value === s.session_type)?.label ||
                                  "Seans"}
                              </span>
                              <span className="text-muted-foreground">
                                {s.exercises?.length ?? 0} egzersiz
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground border-t pt-3">
                      Program taslak olarak kaydedilecek. Sporcular görmesi için &quot;Yayınla&quot; butonuna basın.
                    </p>
                  </div>
                );
              })()}

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Geri
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Kaydediliyor..." : "Programı Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}

