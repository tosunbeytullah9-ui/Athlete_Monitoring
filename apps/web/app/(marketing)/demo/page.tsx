"use client";

import { useState } from "react";
import Link from "next/link";

const ATHLETE_COUNTS = [
  "1-10",
  "11-30",
  "31-100",
  "101-300",
  "300+",
] as const;

export default function DemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [count, setCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, org, count }),
      });

      if (!res.ok) throw new Error("Gönderim başarısız.");
      setSent(true);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">Demo İste</h1>
        <p className="mt-3 text-muted-foreground">
          Size özel bir demo ayarları. 24 saat içinde dönüş yaparız.
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-semibold">Talebiniz alındı!</h2>
          <p className="text-muted-foreground text-sm">
            En kısa sürede <strong>{email}</strong> adresinize dönüş yapacağız.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-md border px-6 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-8 space-y-5"
        >
          <Field label="Ad Soyad">
            <input
              type="text"
              placeholder="Ahmet Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <Field label="E-posta">
            <input
              type="email"
              placeholder="ahmet@federasyon.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <Field label="Organizasyon Adı">
            <input
              type="text"
              placeholder="Türkiye Cimnastik Federasyonu"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <Field label="Sporcu Sayısı">
            <select
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Seçiniz…</option>
              {ATHLETE_COUNTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Gönderiliyor…" : "Demo İste"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
