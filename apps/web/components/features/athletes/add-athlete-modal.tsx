"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { Input } from "@athleteiq/ui/components/input";
import { Label } from "@athleteiq/ui/components/label";
import { createClient } from "@/lib/supabase/client";
import { createAthleteSchema, type CreateAthleteInput } from "@athleteiq/validators/athlete";
import { createAthlete } from "@athleteiq/db/queries/athletes";

interface Props {
  teams: { id: string; name: string }[];
  orgId: string;
  onSuccess: () => void;
}

export function AddAthleteModal({ teams, orgId, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAthleteInput>({
    resolver: zodResolver(createAthleteSchema),
  });

  async function onSubmit(data: CreateAthleteInput) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = createClient();
      await createAthlete(supabase, {
        ...data,
        org_id: orgId,
        height_cm: data.height_cm ?? null,
        weight_kg: data.weight_kg ?? null,
      });
      reset();
      setOpen(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sporcu eklenirken bir hata oluştu.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitError(null); }}>
      <Dialog.Trigger asChild>
        <Button>Sporcu Ekle</Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold">
              Yeni Sporcu Ekle
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Ad Soyad *</Label>
              <Input id="full_name" {...register("full_name")} placeholder="Ahmet Yılmaz" />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

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
              {errors.team_id && (
                <p className="text-xs text-destructive">{errors.team_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="birth_date">Doğum Tarihi</Label>
                <Input id="birth_date" type="date" {...register("birth_date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Cinsiyet</Label>
                <select
                  id="gender"
                  {...register("gender")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Seçin</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="height_cm">Boy (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  step="0.1"
                  {...register("height_cm", { valueAsNumber: true })}
                  placeholder="170"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight_kg">Kilo (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  {...register("weight_kg", { valueAsNumber: true })}
                  placeholder="65"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="position">Pozisyon / Branş</Label>
              <Input id="position" {...register("position")} placeholder="Artistik Jimnastik" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notlar</Label>
              <textarea
                id="notes"
                {...register("notes")}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="İsteğe bağlı notlar..."
              />
            </div>

            {submitError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  İptal
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
