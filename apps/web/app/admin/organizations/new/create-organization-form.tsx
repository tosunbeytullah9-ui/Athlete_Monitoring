"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@athleteiq/ui/components/button";
import { Input } from "@athleteiq/ui/components/input";
import { Label } from "@athleteiq/ui/components/label";
import { createClient } from "@/lib/supabase/client";
import { createOrgSchema, type CreateOrgInput } from "@athleteiq/validators/organization";
import { createOrganization } from "@athleteiq/db/queries/organizations";

function slugify(str: string) {
  return str
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function CreateOrganizationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrg, setCreatedOrg] = useState<{ name: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
  });

  async function onSubmit(data: CreateOrgInput) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = createClient();
      const org = await createOrganization(supabase, {
        name: data.name.trim(),
        slug: slugify(data.name),
      });
      setCreatedOrg({ name: org.name });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") {
        setSubmitError(
          "Bu isimde (veya çok benzer) bir organizasyon zaten var, farklı bir ad deneyin."
        );
      } else {
        setSubmitError(
          err instanceof Error ? err.message : "Organizasyon oluşturulamadı."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdOrg) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium">
          ✅ &quot;{createdOrg.name}&quot; oluşturuldu.
        </p>
        <p className="text-sm text-muted-foreground">
          Bu organizasyonun ilk adminini eklemek için mevcut davet ekranını
          kullanın.
        </p>
        <Link href="/settings" className="text-sm text-primary underline-offset-4 hover:underline">
          Davet ekranına git
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Organizasyon Adı *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Türkiye Cimnastik Federasyonu"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {submitError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Oluşturuluyor..." : "Organizasyon Oluştur"}
      </Button>
    </form>
  );
}
