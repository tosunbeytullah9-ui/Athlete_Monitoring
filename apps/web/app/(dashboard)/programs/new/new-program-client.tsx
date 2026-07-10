"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check, BookOpen } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { Input } from "@athleteiq/ui/components/input";
import { Label } from "@athleteiq/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@athleteiq/ui/components/card";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@athleteiq/db/types";
import { ExercisePickerModal } from "@/components/features/exercises/exercise-picker-modal";
import type { PlatformExercise, OrgExercise, OrgExerciseCategory } from "@athleteiq/db/queries/exercises";

type ProgramRow = Database["public"]["Tables"]["training_programs"]["Row"];
type SessionRow = Database["public"]["Tables"]["training_sessions"]["Row"];

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

const SUPERSET_GROUPS = ["", "A", "B", "C", "D", "E", "F", "G"] as const;

const SUPERSET_COLORS: Record<string, string> = {
  A: "border-l-violet-500",
  B: "border-l-emerald-500",
  C: "border-l-blue-500",
  D: "border-l-orange-500",
  E: "border-l-pink-500",
  F: "border-l-cyan-500",
  G: "border-l-yellow-500",
};

const LOAD_TYPES = [
  { value: "absolute_kg", label: "kg", inputLabel: "Yük (kg)" },
  { value: "percentage_1rm", label: "%1RM", inputLabel: "1RM %" },
  { value: "rpe", label: "RPE", inputLabel: "RPE" },
] as const;

const exerciseSchema = z.object({
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
}

const STEPS = ["Temel Bilgiler", "Seanslar", "Özet"];

export function NewProgramClient({
  orgId,
  teams,
  athletes,
  platformExercises = [],
  orgExercises = [],
  categories = [],
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
  const watchedSessions = watch("sessions");

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

        if (session.exercises.length > 0) {
          const { error: exError } = (await db
            .from("exercises")
            .insert(
              session.exercises.map((ex, idx) => ({
                session_id: dbSession.id,
                name: ex.name,
                category: ex.category ?? null,
                sets: ex.sets ?? null,
                reps: ex.reps ?? null,
                load_type: ex.load_type ?? "absolute_kg",
                load_kg: ex.load_type === "absolute_kg" ? (ex.load_kg ?? null) : null,
                load_percent_1rm:
                  ex.load_type === "percentage_1rm" ? (ex.load_percent_1rm ?? null) : null,
                rpe_target: ex.load_type === "rpe" ? (ex.rpe_target ?? null) : null,
                rest_sec: ex.rest_sec ?? null,
                unit: ex.unit,
                notes: ex.notes ?? null,
                order_index: idx,
                superset_group: ex.superset_group ?? null,
                superset_order: ex.superset_order ?? 0,
              }))
            )) as { error: { message: string } | null };
          if (exError) throw new Error(exError.message);
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

      <form onSubmit={handleSubmit(onSubmit)}>
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

// Egzersiz listesi alt bileşeni
import type { UseFormRegister, Control, UseFormWatch, UseFormSetValue, FieldValues } from "react-hook-form";

function ExerciseList({
  sessionIdx,
  register,
  control,
  watch,
  setValue,
  platformExercises,
  orgExercises,
  categories,
}: {
  sessionIdx: number;
  register: UseFormRegister<ProgramForm>;
  control: Control<ProgramForm>;
  watch: UseFormWatch<ProgramForm>;
  setValue: UseFormSetValue<ProgramForm>;
  platformExercises: PlatformExercise[];
  orgExercises: OrgExercise[];
  categories: OrgExerciseCategory[];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sessions.${sessionIdx}.exercises`,
  });

  const [pickerOpen, setPickerOpen] = useState(false);

  const exercises = watch(`sessions.${sessionIdx}.exercises`) ?? [];

  function getGroupCount(group: string): number {
    return exercises.filter((e) => e.superset_group === group && group !== "").length;
  }

  function getNextGroupOrder(group: string): number {
    if (!group) return 0;
    return getGroupCount(group);
  }

  function handleGroupChange(exIdx: number, group: string) {
    if (group && getGroupCount(group) >= 10) return;
    setValue(`sessions.${sessionIdx}.exercises.${exIdx}.superset_group`, group || undefined);
    setValue(`sessions.${sessionIdx}.exercises.${exIdx}.superset_order`, group ? getNextGroupOrder(group) : 0);
  }

  // Group exercises by superset for display
  const groupedLabels: Record<number, string | null> = {};
  const groupStartIndices = new Set<number>();
  const groupCounts: Record<string, number> = {};

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
              })
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
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.name`)}
                        placeholder="Egzersiz adı (örn: Back Squat)"
                        className="text-sm"
                      />
                    </div>
                    <select
                      {...register(`sessions.${sessionIdx}.exercises.${exIdx}.load_type`)}
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
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.sets`, {
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
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.reps`, {
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
                            `sessions.${sessionIdx}.exercises.${exIdx}.load_percent_1rm`,
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
                          {...register(`sessions.${sessionIdx}.exercises.${exIdx}.rpe_target`, {
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
                          {...register(`sessions.${sessionIdx}.exercises.${exIdx}.load_kg`, {
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
                        {...register(`sessions.${sessionIdx}.exercises.${exIdx}.rest_sec`, {
                          valueAsNumber: true,
                        })}
                        placeholder="120"
                        className="text-sm h-8"
                      />
                    </div>
                  </div>

                  <Input
                    {...register(`sessions.${sessionIdx}.exercises.${exIdx}.notes`)}
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
            });
          }}
        />
      )}
    </div>
  );
}
