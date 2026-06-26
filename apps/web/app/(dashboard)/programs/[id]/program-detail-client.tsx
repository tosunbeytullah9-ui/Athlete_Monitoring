"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Users, User, Send } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { Badge } from "@athleteiq/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@athleteiq/ui/components/card";
import { createClient } from "@/lib/supabase/client";
import { publishProgram } from "@athleteiq/db/queries/programs";
import type { Tables } from "@athleteiq/db/types";

type Program = Tables<"training_programs"> & {
  training_sessions: (Tables<"training_sessions"> & {
    exercises: Tables<"exercises">[];
  })[];
};

interface Props {
  program: Program;
  athlete: { id: string; full_name: string } | null;
  team: { id: string; name: string } | null;
}

const DAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const SESSION_TYPE_LABELS: Record<string, string> = {
  strength: "Kuvvet",
  conditioning: "Kondisyon",
  technical: "Teknik",
  recovery: "Toparlanma",
  competition: "Müsabaka",
};

const PHASE_LABELS: Record<string, string> = {
  preparation: "Hazırlık",
  competition: "Müsabaka",
  transition: "Geçiş",
  peak: "Zirve",
};

export function ProgramDetailClient({ program, athlete, team }: Props) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(program.is_published ?? false);

  async function handlePublish() {
    setIsPublishing(true);
    try {
      const supabase = createClient();
      await publishProgram(supabase, program.id);
      setIsPublished(true);
    } finally {
      setIsPublishing(false);
    }
  }

  const sessionsByDay = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    label: DAY_LABELS[i]!,
    sessions: program.training_sessions
      .filter((s) => s.day_of_week === i + 1)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
  })).filter((d) => d.sessions.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/programs")}>
          <ArrowLeft className="h-4 w-4" />
          Programlar
        </Button>
      </div>

      {/* Başlık kartı */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{program.title}</h1>
                <Badge variant={isPublished ? "default" : "secondary"}>
                  {isPublished ? "Yayında" : "Taslak"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {team ? (
                    <>
                      <Users className="h-3.5 w-3.5" />
                      <Link href="#" className="hover:text-foreground transition-colors">
                        {team.name}
                      </Link>
                    </>
                  ) : athlete ? (
                    <>
                      <User className="h-3.5 w-3.5" />
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {athlete.full_name}
                      </Link>
                    </>
                  ) : null}
                </div>
                {program.phase && (
                  <span>{PHASE_LABELS[program.phase] ?? program.phase}</span>
                )}
                {program.week_number && <span>Hafta {program.week_number}</span>}
                {program.start_date && (
                  <span>
                    {new Date(program.start_date).toLocaleDateString("tr-TR")}
                    {program.end_date &&
                      ` — ${new Date(program.end_date).toLocaleDateString("tr-TR")}`}
                  </span>
                )}
                <span>{program.training_sessions.length} seans</span>
              </div>

              {program.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{program.notes}</p>
              )}
            </div>

            {!isPublished && (
              <Button onClick={handlePublish} disabled={isPublishing} className="shrink-0">
                {isPublishing ? (
                  <>Yayınlanıyor...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Yayınla
                  </>
                )}
              </Button>
            )}

            {isPublished && (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Yayında
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seanslar */}
      {sessionsByDay.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Clock className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Bu programda henüz seans eklenmemiş.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessionsByDay.map(({ day, label, sessions }) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {label}
              </h2>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {session.session_type && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {SESSION_TYPE_LABELS[session.session_type] ?? session.session_type}
                          </span>
                        )}
                        <CardTitle className="text-base">
                          {session.title || SESSION_TYPE_LABELS[session.session_type ?? ""] || "Seans"}
                        </CardTitle>
                        {session.duration_min && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {session.duration_min} dk
                          </span>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                      )}
                    </CardHeader>

                    {session.exercises.length > 0 && (
                      <CardContent>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground text-xs">
                                Egzersiz
                              </th>
                              <th className="text-center py-1.5 px-2 font-medium text-muted-foreground text-xs">
                                Set
                              </th>
                              <th className="text-center py-1.5 px-2 font-medium text-muted-foreground text-xs">
                                Tekrar
                              </th>
                              <th className="text-center py-1.5 px-2 font-medium text-muted-foreground text-xs">
                                Yük
                              </th>
                              <th className="text-center py-1.5 px-2 font-medium text-muted-foreground text-xs">
                                Dinlenme
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.exercises
                              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                              .map((exercise) => (
                                <tr key={exercise.id} className="border-b last:border-0">
                                  <td className="py-2 pr-4">
                                    <p className="font-medium">{exercise.name}</p>
                                    {exercise.notes && (
                                      <p className="text-xs text-muted-foreground">{exercise.notes}</p>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">{exercise.sets ?? "—"}</td>
                                  <td className="py-2 px-2 text-center">{exercise.reps ?? "—"}</td>
                                  <td className="py-2 px-2 text-center">
                                    {exercise.load_kg
                                      ? `${exercise.load_kg} ${exercise.unit ?? "kg"}`
                                      : exercise.load_percent
                                      ? `%${exercise.load_percent}`
                                      : "—"}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {exercise.rest_sec ? `${exercise.rest_sec}s` : "—"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
