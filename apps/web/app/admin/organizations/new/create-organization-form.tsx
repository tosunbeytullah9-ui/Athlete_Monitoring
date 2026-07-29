"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
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
  const [createdOrg, setCreatedOrg] = useState<{ id: string; name: string } | null>(null);

  // İlk admini davet et (org oluşturulduktan sonraki mini-adım)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStep, setInviteStep] = useState<"pending" | "sent" | "skipped">("pending");

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
      setCreatedOrg({ id: org.id, name: org.name });
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

  async function onSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!createdOrg) return;
    setInviteError(null);

    if (!inviteEmail) {
      setInviteError("Email adresi zorunludur.");
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: "admin",
          org_id: createdOrg.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Davet gönderilemedi.");
      }
      setInviteStep("sent");
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Davet gönderilemedi.");
    } finally {
      setIsInviting(false);
    }
  }

  function handleSkip() {
    setInviteStep("skipped");
  }

  if (createdOrg) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 space-y-4">
        <p className="text-sm font-medium">
          ✅ &quot;{createdOrg.name}&quot; oluşturuldu.
        </p>

        {inviteStep === "pending" && (
          <form onSubmit={onSendInvite} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">İlk Adminini Davet Et</p>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email Adresi *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            {inviteError && (
              <p className="text-xs text-destructive">{inviteError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isInviting} size="sm">
                {isInviting ? "Gönderiliyor..." : "Davet Gönder"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleSkip}>
                Şimdilik atla, sonra davet ederim
              </Button>
            </div>
          </form>
        )}

        {inviteStep === "sent" && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 border-t pt-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {inviteEmail} adresine davet gönderildi.
          </p>
        )}

        {inviteStep === "skipped" && (
          <p className="text-sm text-muted-foreground border-t pt-4">
            İlk admin daveti atlandı. Organizasyon davetsiz oluşturuldu.
          </p>
        )}
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
