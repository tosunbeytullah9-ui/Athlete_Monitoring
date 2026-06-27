"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2, Clock, Users, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@athleteiq/ui/components/button";
import { Badge } from "@athleteiq/ui/components/badge";
import { Card, CardContent } from "@athleteiq/ui/components/card";
import type { Tables } from "@athleteiq/db/types";

type Program = Tables<"training_programs"> & {
  training_sessions: (Tables<"training_sessions"> & {
    exercises: Tables<"exercises">[];
  })[];
};

interface Props {
  programs: Program[];
  teams: { id: string; name: string }[];
  athletes: { id: string; full_name: string; team_id: string }[];
}

const PHASE_LABELS: Record<string, string> = {
  preparation: "Hazırlık",
  competition: "Müsabaka",
  transition: "Geçiş",
  peak: "Zirve",
};

const PHASE_COLORS: Record<string, string> = {
  preparation: "bg-blue-100 text-blue-700",
  competition: "bg-red-100 text-red-700",
  transition: "bg-gray-100 text-gray-700",
  peak: "bg-purple-100 text-purple-700",
};

export function ProgramsClient({ programs, teams, athletes }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("program-updates-programs")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "training_programs",
          filter: "is_published=eq.true",
        },
        () => {
          router.refresh();
          toast({ title: "Yeni program yayınlandı" });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t.name])),
    [teams]
  );

  const athleteMap = useMemo(
    () => Object.fromEntries(athletes.map((a) => [a.id, a.full_name])),
    [athletes]
  );

  const filtered = useMemo(() => {
    if (filter === "published") return programs.filter((p) => p.is_published);
    if (filter === "draft") return programs.filter((p) => !p.is_published);
    return programs;
  }, [programs, filter]);

  const publishedCount = programs.filter((p) => p.is_published).length;
  const draftCount = programs.filter((p) => !p.is_published).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Antrenman Programları</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {programs.length} program — {publishedCount} yayında, {draftCount} taslak
          </p>
        </div>
        <Button asChild>
          <Link href="/programs/new">
            <Plus className="h-4 w-4" />
            Yeni Program
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "published", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f === "all" ? "Tümü" : f === "published" ? "Yayında" : "Taslak"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "Henüz program oluşturulmamış." : "Bu filtreye uygun program yok."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/programs/new">Program Oluştur</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((program) => {
            const sessionCount = program.training_sessions?.length ?? 0;
            const exerciseCount =
              program.training_sessions?.reduce(
                (sum, s) => sum + (s.exercises?.length ?? 0),
                0
              ) ?? 0;
            const isTeam = !!program.team_id;

            return (
              <Card
                key={program.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/programs/${program.id}`)}
              >
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold leading-tight">{program.title}</h3>
                    {program.is_published ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {program.phase && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          PHASE_COLORS[program.phase] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {PHASE_LABELS[program.phase] ?? program.phase}
                      </span>
                    )}
                    {program.week_number && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        Hafta {program.week_number}
                      </span>
                    )}
                    <Badge variant={program.is_published ? "default" : "secondary"} className="text-xs">
                      {program.is_published ? "Yayında" : "Taslak"}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5">
                      {isTeam ? (
                        <Users className="h-3.5 w-3.5" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isTeam
                          ? teamMap[program.team_id!] ?? "—"
                          : athleteMap[program.athlete_id!] ?? "—"}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span>{sessionCount} seans</span>
                      <span>{exerciseCount} egzersiz</span>
                    </div>
                    {program.start_date && (
                      <div>
                        {new Date(program.start_date).toLocaleDateString("tr-TR")}
                        {program.end_date &&
                          ` — ${new Date(program.end_date).toLocaleDateString("tr-TR")}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
