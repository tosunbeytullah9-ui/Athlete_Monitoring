"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trophy, MapPin, Calendar, X } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { Input } from "@athleteiq/ui/components/input";
import { Label } from "@athleteiq/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@athleteiq/ui/components/card";
import { Badge } from "@athleteiq/ui/components/badge";
import { createClient } from "@/lib/supabase/client";
import { createCompetition } from "@athleteiq/db/queries/competitions";
import type { Tables } from "@athleteiq/db/types";

type Competition = Tables<"competitions"> & {
  competition_results: (Tables<"competition_results"> & {
    athletes: { full_name: string; avatar_url: string | null } | null;
  })[];
};
type Team = { id: string; name: string };

interface Props {
  orgId: string;
  competitions: Competition[];
  teams: Team[];
}

const competitionSchema = z.object({
  name: z.string().min(2, "Yarışma adı en az 2 karakter olmalı"),
  competition_date: z.string().min(1, "Tarih zorunludur"),
  location: z.string().optional(),
  level: z.enum(["international", "national", "regional", "local"]).optional(),
  team_id: z.string().optional(),
  notes: z.string().optional(),
});

type CompetitionForm = z.infer<typeof competitionSchema>;

const LEVEL_LABELS: Record<string, string> = {
  international: "Uluslararası",
  national: "Ulusal",
  regional: "Bölgesel",
  local: "Yerel",
};

const LEVEL_COLORS: Record<string, string> = {
  international: "bg-purple-100 text-purple-700",
  national: "bg-blue-100 text-blue-700",
  regional: "bg-green-100 text-green-700",
  local: "bg-gray-100 text-gray-700",
};

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

export function CompetitionsClient({ orgId, competitions: initialCompetitions, teams }: Props) {
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompetitionForm>({
    resolver: zodResolver(competitionSchema),
  });

  async function onSubmit(data: CompetitionForm) {
    setSubmitError(null);
    try {
      const supabase = createClient();
      const newComp = await createCompetition(supabase, {
        org_id: orgId,
        name: data.name,
        competition_date: data.competition_date,
        location: data.location ?? null,
        level: data.level ?? null,
        team_id: data.team_id || null,
        notes: data.notes ?? null,
      });
      // Fetch with results joined — competitions query returns base row, add empty results
      const compWithResults = { ...newComp, competition_results: [] };
      setCompetitions((prev) =>
        [...prev, compWithResults as Competition].sort((a, b) =>
          (a.competition_date ?? "") < (b.competition_date ?? "") ? -1 : 1
        )
      );
      reset();
      setShowForm(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Yarışma eklenirken hata oluştu.");
    }
  }

  const filtered = competitions.filter((c) => {
    if (filter === "upcoming") return isUpcoming(c.competition_date);
    if (filter === "past") return !isUpcoming(c.competition_date);
    return true;
  });

  const upcomingCount = competitions.filter((c) => isUpcoming(c.competition_date)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yarışma Takvimi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {competitions.length} yarışma — {upcomingCount} yaklaşan
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "İptal" : "Yarışma Ekle"}
        </Button>
      </div>

      {/* Ekleme formu */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yeni Yarışma</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label htmlFor="comp-name">Yarışma Adı *</Label>
                  <Input
                    id="comp-name"
                    {...register("name")}
                    placeholder="Örn: Türkiye Jimnastik Şampiyonası 2026"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-date">Tarih *</Label>
                  <Input id="comp-date" type="date" {...register("competition_date")} />
                  {errors.competition_date && (
                    <p className="text-xs text-destructive">{errors.competition_date.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-location">Konum</Label>
                  <Input
                    id="comp-location"
                    {...register("location")}
                    placeholder="Şehir / Salon"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-level">Kademe</Label>
                  <select
                    id="comp-level"
                    {...register("level")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Seçin</option>
                    <option value="international">Uluslararası</option>
                    <option value="national">Ulusal</option>
                    <option value="regional">Bölgesel</option>
                    <option value="local">Yerel</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-team">Takım</Label>
                  <select
                    id="comp-team"
                    {...register("team_id")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Tüm takımlar / Bireysel</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="comp-notes">Notlar</Label>
                  <Input
                    id="comp-notes"
                    {...register("notes")}
                    placeholder="İsteğe bağlı notlar..."
                  />
                </div>
              </div>

              {submitError && (
                <p className="text-xs text-destructive">{submitError}</p>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Kaydediliyor..." : "Yarışmayı Ekle"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtreler */}
      <div className="flex gap-2">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f === "upcoming" ? "Yaklaşan" : f === "past" ? "Geçmiş" : "Tümü"}
          </button>
        ))}
      </div>

      {/* Yarışma listesi */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "upcoming"
              ? "Yaklaşan yarışma bulunmuyor."
              : filter === "past"
              ? "Geçmiş yarışma bulunmuyor."
              : "Henüz yarışma eklenmemiş."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowForm(true)}>
            Yarışma Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((comp) => {
            const upcoming = isUpcoming(comp.competition_date);
            return (
              <Card key={comp.id} className={upcoming ? "border-primary/30" : ""}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                        upcoming ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {comp.competition_date ? (
                        <>
                          <span className="text-xs font-medium">
                            {new Date(comp.competition_date).toLocaleDateString("tr-TR", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {new Date(comp.competition_date).getDate()}
                          </span>
                        </>
                      ) : (
                        <Calendar className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{comp.name}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {upcoming && (
                            <Badge variant="default" className="text-xs">
                              Yaklaşan
                            </Badge>
                          )}
                          {comp.level && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                LEVEL_COLORS[comp.level] ?? "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {LEVEL_LABELS[comp.level] ?? comp.level}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                        {comp.competition_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(comp.competition_date).toLocaleDateString("tr-TR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {comp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {comp.location}
                          </span>
                        )}
                      </div>

                      {comp.notes && (
                        <p className="mt-1.5 text-xs text-muted-foreground">{comp.notes}</p>
                      )}

                      {comp.competition_results.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {comp.competition_results.slice(0, 5).map((r) => (
                            <span
                              key={r.id}
                              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                            >
                              {r.athletes?.full_name ?? "—"}
                              {r.rank ? ` #${r.rank}` : ""}
                              {r.score ? ` (${r.score})` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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
