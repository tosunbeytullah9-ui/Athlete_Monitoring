"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, magicLinkSchema } from "@athleteiq/validators";
import type { LoginInput, MagicLinkInput } from "@athleteiq/validators";

type Tab = "password" | "magic";

export function LoginForm() {
  const [tab, setTab] = useState<Tab>("magic");
  const [magicSent, setMagicSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/athletes";
  const errorParam = searchParams.get("error");

  const supabase = createClient();

  const passwordForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const magicForm = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
  });

  async function onPasswordLogin(values: LoginInput) {
    setServerError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setIsSubmitting(false);
    if (error) {
      console.error("[Login] signInWithPassword error:", error.message, error.status, error);
      setServerError(`Hata: ${error.message}`);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function onMagicLink(values: MagicLinkInput) {
    setServerError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setIsSubmitting(false);
    if (error) {
      console.error("[Login] signInWithOtp error:", error.message, error.status, error);
      setServerError(error.message);
      return;
    }
    setMagicSent(true);
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
      {/* Logo + Başlık */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">AthleteIQ</h1>
        <p className="text-sm text-muted-foreground">Hesabınıza giriş yapın</p>
      </div>

      {/* Üyelik hatası */}
      {errorParam === "no_membership" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Bu hesaba bağlı bir üyelik bulunamadı. Lütfen yöneticinizle iletişime geçin.
        </div>
      )}

      {/* Tab seçimi */}
      <div className="flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => { setTab("magic"); setServerError(null); setMagicSent(false); }}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
            tab === "magic"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => { setTab("password"); setServerError(null); }}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
            tab === "password"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Şifre ile Giriş
        </button>
      </div>

      {/* Magic Link Formu */}
      {tab === "magic" && (
        <>
          {magicSent ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-4 text-center text-sm text-green-800">
              <p className="font-medium">E-posta gönderildi!</p>
              <p className="mt-1 text-green-700">
                Gelen kutunuzu kontrol edin ve giriş linkine tıklayın.
              </p>
            </div>
          ) : (
            <form
              onSubmit={magicForm.handleSubmit(onMagicLink)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="magic-email"
                  className="text-sm font-medium leading-none"
                >
                  E-posta
                </label>
                <input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  placeholder="koç@kulubu.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  {...magicForm.register("email")}
                />
                {magicForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {magicForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-xs text-destructive">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? "Gönderiliyor…" : "Giriş Linki Gönder"}
              </button>
            </form>
          )}
        </>
      )}

      {/* Şifre Formu */}
      {tab === "password" && (
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordLogin)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="pw-email"
              className="text-sm font-medium leading-none"
            >
              E-posta
            </label>
            <input
              id="pw-email"
              type="email"
              autoComplete="email"
              placeholder="koç@kulubu.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              {...passwordForm.register("email")}
            />
            {passwordForm.formState.errors.email && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="pw-password"
              className="text-sm font-medium leading-none"
            >
              Şifre
            </label>
            <input
              id="pw-password"
              type="password"
              autoComplete="current-password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              {...passwordForm.register("password")}
            />
            {passwordForm.formState.errors.password && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-xs text-destructive">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      )}
    </div>
  );
}
