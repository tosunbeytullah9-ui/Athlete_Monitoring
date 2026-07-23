"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check, AlertTriangle, Copy } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { Input } from "@athleteiq/ui/components/input";
import { Label } from "@athleteiq/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@athleteiq/ui/components/card";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@athleteiq/db/types";
import type {
  PlatformExercise,
  OrgExercise,
  OrgExerciseCategory,
  Athlete1RMRecord,
} from "@athleteiq/db/queries/exercises";
import { ExerciseList, exerciseSchema } from "@/components/features/program-builder/exercise-list";
import type { ExerciseSetFormValues } from "@/components/features/program-builder/exercise-list";
import { buildSessionsPayload, mapRpcError } from "@/lib/program-rpc";

type ProgramRow = Tables<"training_programs"> & {
  training_sessions: (Tables<"training_sessions"> & {
    exercises: (Tables<"exercises"> & { exercise_sets?: Tables<"exercise_sets">[] })[];
  })[];
};

// exercise_sets tablosunda ayrı bir load_type kolonu yok — hangi kolonun dolu
// olduğundan türetilir (bkz. new-program-client.tsx'teki simetrik yorum).
function deriveLoadType(row: Tables<"exercise_sets">): ExerciseSetFormValues["load_type"] {
  if (row.band_resistance) return "band";
  if (row.is_bodyweight) return "bodyweight";
  if (row.percent_1rm != null) return "percent_1rm";
  return "kg";
}

// start_date + 6 gün = end_date — new-program-client.tsx'in wizard'ının
// (create_program_with_weeks RPC'si üzerinden) kullandığı AYNI türetme
// mantığı. update_program_week RPC'si p_end_date'i parametre olarak alıyor
// (018'in aksine, imza böyle tanımlandı) ama UI bunu hiç göstermiyor/
// düzenletmiyor — new-program-client'taki gibi otomatik hesaplanıyor.
function deriveEndDate(startDate: string): string {
  const d = new Date(startDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
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

// scope/team_id/athlete_id BİLEREK yok — update_program_week RPC'si (020)
// program kapsamını (hangi takım/sporcu) DEĞİŞTİRMEZ, imzasında bu
// parametreler yok (bkz. 020_update_program_week.sql). Kapsam, program
// oluşturulduğunda (create_program_with_weeks) sabitlenir; bu form yalnızca
// içeriği (başlık/faz/not/tarih/seans ağacı) düzenler. Eski davranış
// (kapsamı burada da değiştirebilme) kaldırıldı — RPC'nin desteklemediği
// bir alanı editable bırakmak, değişikliğin sessizce kaydedilmemesi
// riskini taşırdı (BUGS.md'nin tekrar tekrar bulduğu "sessiz" bug sınıfı).
const programSchema = z.object({
  title: z.string().min(1, "Program başlığı gerekli"),
  // RPC'nin p_start_date'i için zorunlu — new-program-client.tsx ile aynı
  // kural (BUGS.md'deki start_date/end_date Postgres reddi bug'ının bu
  // dosya için açık kalan kısmı, bu partiyle kapanıyor).
  start_date: z.string().min(1, "Başlangıç tarihi gerekli"),
  phase: z.enum(["preparation", "competition", "transition", "peak"]).optional(),
  notes: z.string().optional(),
  sessions: z.array(sessionSchema).default([]),
});

type ProgramForm = z.infer<typeof programSchema>;

interface Props {
  program: ProgramRow;
  orgId: string;
  teams: { id: string; name: string }[];
  athletes: { id: string; full_name: string; team_id: string }[];
  platformExercises?: PlatformExercise[];
  orgExercises?: OrgExercise[];
  categories?: OrgExerciseCategory[];
  athleteMaxes?: Athlete1RMRecord[];
}

const STEPS = ["Temel Bilgiler", "Seanslar", "Özet"];

export function EditProgramClient({
  program,
  orgId: _orgId,
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<number | null>(null);

  // "Sonraki Haftalara Uygula" — yalnızca program bir bloğun parçasıysa VE
  // aynı blokta kendisinden sonraki en az bir hafta varsa anlamlı. futureWeeks
  // null iken sorgu henüz sonuçlanmadı (buton gizli kalır, yanlışlıkla erken
  // tıklamayı önler); [] iken sorgu bitti ama sonraki hafta yok/blok yok.
  const [futureWeeks, setFutureWeeks] = useState<
    { id: string; week_index_in_block: number | null }[] | null
  >(null);
  const [showPropagateConfirm, setShowPropagateConfirm] = useState(false);
  const [isPropagating, setIsPropagating] = useState(false);
  const [propagateError, setPropagateError] = useState<string | null>(null);
  const [propagateSuccess, setPropagateSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!program.block_id) {
      setFutureWeeks([]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("training_programs")
      .select("id, week_index_in_block")
      .eq("block_id", program.block_id)
      .gt("week_index_in_block", program.week_index_in_block ?? 0)
      .order("week_index_in_block", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Sonraki hafta sorgusu hatası:", error);
          setFutureWeeks([]);
          return;
        }
        setFutureWeeks(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [program.block_id, program.week_index_in_block]);

  // Program kapsamı sabit — yalnızca gösterim için (bkz. programSchema
  // üzerindeki yorum). scope/team/athlete adı program.team_id/athlete_id'den
  // türetiliyor, bir form alanı değil.
  const scope: "team" | "athlete" = program.team_id ? "team" : "athlete";
  const scopeTeamName = teams.find((t) => t.id === program.team_id)?.name;
  const scopeAthleteName = athletes.find((a) => a.id === program.athlete_id)?.full_name;

  const defaultSessions = program.training_sessions
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((s) => ({
      day_of_week: s.day_of_week ?? 1,
      session_type: (s.session_type as ProgramForm["sessions"][number]["session_type"]) ?? undefined,
      title: s.title ?? undefined,
      duration_min: s.duration_min ?? undefined,
      exercises: s.exercises
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((e) => {
          const ex = e as typeof e & {
            superset_group?: string | null;
            superset_order?: number | null;
          };
          const dbSets = (ex.exercise_sets ?? [])
            .slice()
            .sort((a, b) => a.set_number - b.set_number);
          const isDurationBased = dbSets.some((row) => row.duration_sec != null);
          return {
            name: ex.name,
            category: ex.category ?? undefined,
            is_duration_based: isDurationBased,
            rest_sec: ex.rest_sec ?? undefined,
            notes: ex.notes ?? undefined,
            superset_group: ex.superset_group ?? undefined,
            superset_order: ex.superset_order ?? 0,
            exercise_sets:
              dbSets.length > 0
                ? dbSets.map((row) => ({
                    reps: row.reps ?? undefined,
                    duration_sec: row.duration_sec ?? undefined,
                    load_type: deriveLoadType(row),
                    load_kg: row.load_kg ?? undefined,
                    percent_1rm: row.percent_1rm ?? undefined,
                    band_resistance:
                      (row.band_resistance as ExerciseSetFormValues["band_resistance"]) ?? undefined,
                    rpe: row.rpe ?? undefined,
                    notes: row.notes ?? undefined,
                  }))
                : [{ load_type: "kg" as const }],
          };
        }),
    }));

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
      title: program.title,
      start_date: program.start_date ?? undefined,
      phase: (program.phase as ProgramForm["phase"]) ?? undefined,
      notes: program.notes ?? undefined,
      sessions: defaultSessions,
    },
  });

  const { fields: sessionFields, append: appendSession, remove: removeSession } = useFieldArray({
    control,
    name: "sessions",
  });

  const watchedSessions = watch("sessions");

  // "Son max" rozeti yalnızca bireysel (athlete) programlarda anlamlı —
  // takım programının tek bir sporcusu yok, bu yüzden team scope'ta boş kalır.
  const pickerAthleteMaxes = useMemo(
    () =>
      scope === "athlete" && program.athlete_id
        ? athleteMaxes.filter((m) => m.athlete_id === program.athlete_id)
        : [],
    [athleteMaxes, scope, program.athlete_id]
  );

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
    setSubmitError(null);
    try {
      const supabase = createClient();

      // update_program_week (020_update_program_week.sql) p_phase/p_notes'u
      // nullable kabul ediyor, ama `supabase gen types` bunu Args'ta yansıtmıyor
      // (bilinen gen-types kısıtı, bkz. new-program-client.tsx'teki aynı not) —
      // `as string` yalnızca bu 2 parametre için dar bir düzeltme.
      const { error } = await supabase.rpc("update_program_week", {
        p_program_id: program.id,
        p_title: data.title,
        p_phase: (data.phase ?? null) as string,
        p_notes: (data.notes ?? null) as string,
        p_start_date: data.start_date,
        p_end_date: deriveEndDate(data.start_date),
        p_sessions: buildSessionsPayload(data.sessions),
      });

      if (error) throw new Error(mapRpcError(error.message));

      router.push(`/programs/${program.id}`);
    } catch (error) {
      console.error("Program güncelleme hatası:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Program güncellenirken bir hata oluştu."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // "Kaydet"ten AYRI bir aksiyon — bilerek birleştirilmedi. propagate_week_to_future
  // RPC'si kaynağın DB'deki (en son kaydedilmiş) haline göre kopyalar, formun
  // o anki (henüz kaydedilmemiş) state'ine göre değil — bu yüzden onay
  // penceresinde kullanıcıya bunu hatırlatan bir not var (aşağıda).
  async function handlePropagateConfirm() {
    setIsPropagating(true);
    setPropagateError(null);
    try {
      const supabase = createClient();

      const { error } = await supabase.rpc("propagate_week_to_future", {
        p_source_program_id: program.id,
      });

      if (error) throw new Error(mapRpcError(error.message));

      setShowPropagateConfirm(false);
      setPropagateSuccess(
        `Değişiklikler ${futureWeeks?.length ?? 0} sonraki haftaya uygulandı.`
      );
    } catch (error) {
      console.error("Hafta yayma hatası:", error);
      setPropagateError(
        error instanceof Error ? error.message : "Yayma işlemi sırasında bir hata oluştu."
      );
    } finally {
      setIsPropagating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/programs/${program.id}`)}>
          <ArrowLeft className="h-4 w-4" />
          Programa Dön
        </Button>
        <h1 className="text-2xl font-bold">Programı Düzenle</h1>
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
                <Label>Program Kapsamı</Label>
                <p className="text-sm text-muted-foreground">
                  {scope === "team"
                    ? `Takım — ${scopeTeamName ?? "—"}`
                    : `Sporcu — ${scopeAthleteName ?? "—"}`}
                  {" "}
                  <span className="text-xs">(düzenlerken değiştirilemez)</span>
                </p>
              </div>

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
                  <Label htmlFor="start_date">Başlangıç Tarihi *</Label>
                  <Input id="start_date" type="date" {...register("start_date")} />
                  {errors.start_date && (
                    <p className="text-xs text-destructive">{errors.start_date.message}</p>
                  )}
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
              <CardTitle>Değişiklikleri Kaydet</CardTitle>
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
                        <p className="text-xs text-muted-foreground">Başlangıç Tarihi</p>
                        <p className="font-medium">{data.start_date || "—"}</p>
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

                    {program.is_published && (
                      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p className="text-xs">
                          Bu program yayında. Kaydedilince yayında kalacak — sporcular
                          güncellenmiş halini hemen görecek.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {submitError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Geri
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </div>

              {/* "Sonraki Haftalara Uygula" — Kaydet'ten AYRI bir aksiyon, bilerek
                  birleştirilmedi (aynı anda ikisini yapmak kafa karıştırır). Yalnızca
                  program bir bloğun parçasıysa VE son hafta değilse görünür. */}
              {program.block_id && futureWeeks && futureWeeks.length > 0 && (
                <div className="flex flex-col items-end gap-2 border-t pt-4 mt-2">
                  {propagateSuccess && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {propagateSuccess}
                    </p>
                  )}
                  {propagateError && (
                    <p className="text-xs text-destructive">{propagateError}</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPropagateError(null);
                      setPropagateSuccess(null);
                      setShowPropagateConfirm(true);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Sonraki Haftalara Uygula
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </form>

      {showPropagateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isPropagating && setShowPropagateConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-lg mx-4">
            <h2 className="text-lg font-semibold mb-2">Sonraki Haftalara Uygula</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Bu değişiklik şu haftalara uygulanacak:{" "}
              <span className="font-medium text-foreground">
                {futureWeeks?.map((w) => `Hafta ${w.week_index_in_block}`).join(", ")}
              </span>
              {" — "}devam edilsin mi?
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Yalnızca bu programın en son <strong>kaydedilmiş</strong> hali kopyalanır —
              henüz kaydetmediğiniz değişiklikleriniz varsa önce &quot;Değişiklikleri
              Kaydet&quot;i kullanın.
            </p>
            {propagateError && (
              <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {propagateError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPropagateConfirm(false)}
                disabled={isPropagating}
              >
                İptal
              </Button>
              <Button type="button" onClick={handlePropagateConfirm} disabled={isPropagating}>
                {isPropagating ? "Uygulanıyor..." : "Devam Et"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
