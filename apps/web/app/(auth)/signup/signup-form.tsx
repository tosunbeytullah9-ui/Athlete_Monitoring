"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;

const SPORTS = [
  "Jimnastik",
  "Yüzme",
  "Atletizm",
  "Futbol",
  "Basketbol",
  "Voleybol",
  "Dövüş Sporları",
  "Diğer",
] as const;

const COUNTRIES = [
  "Türkiye",
  "Almanya",
  "Fransa",
  "İngiltere",
  "ABD",
  "Diğer",
] as const;

const STEP_FEATURES = [
  {
    icon: "🏋️",
    title: "Program Builder",
    desc: "Haftalık antrenman programlarını oluştur, sporcularına anlık ilet.",
  },
  {
    icon: "🏢",
    title: "Organizasyon Yönetimi",
    desc: "Takımlarını oluştur, sporcuları davet et, koçları ata.",
  },
  {
    icon: "📊",
    title: "ACWR Takibi",
    desc: "Akut:Kronik yük oranını izle, sakatlanma riskini minimize et.",
  },
  {
    icon: "🎉",
    title: "Hazırsın!",
    desc: "14 günlük ücretsiz denemenle AthleteIQ'yu keşfetmeye başla.",
  },
];

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

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Step 1 state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Step 2 state
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [sport, setSport] = useState("");
  const [country, setCountry] = useState("Türkiye");
  const [orgId, setOrgId] = useState<string | null>(null);

  // Step 3 state
  const [teamName, setTeamName] = useState("");
  const [teamDiscipline, setTeamDiscipline] = useState("");

  async function handleAccountCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (!fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.user && data.session) {
      setAccessToken(data.session.access_token);
      setStep(2);
    } else if (data.user) {
      // email confirmation açıksa session hemen gelmez — getSession ile al
      const { data: sessionData } = await supabase.auth.getSession();
      setAccessToken(sessionData.session?.access_token ?? null);
      setStep(2);
    }
  }

  async function handleOrgCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orgName.trim()) { setError("Organizasyon adı zorunludur."); return; }
    if (!slug.trim()) { setError("Slug zorunludur."); return; }
    if (!sport) { setError("Spor dalı seçiniz."); return; }

    setLoading(true);
    const res = await fetch("/api/signup/create-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgName, slug, sport, country, accessToken }),
    });
    const json = await res.json() as { orgId?: string; error?: string };
    setLoading(false);

    if (!res.ok || !json.orgId) {
      setError(json.error ?? "Organizasyon oluşturulamadı.");
      return;
    }

    setOrgId(json.orgId);
    setStep(3);
  }

  async function handleTeamCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!teamName.trim() || !orgId) { setStep(4); return; }

    setLoading(true);
    await fetch("/api/signup/create-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, teamName, discipline: teamDiscipline, accessToken }),
    });
    setLoading(false);
    setStep(4);
  }

  function handleSkipTeam() {
    setStep(4);
  }

  const feature = STEP_FEATURES[step - 1]!;

  return (
    <div className="flex min-h-screen">
      {/* Sol: Form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">AthleteIQ</span>
          </Link>

          {/* Adım göstergesi */}
          <div className="mb-8 flex items-center gap-2">
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-px w-8 transition-colors ${s < step ? "bg-primary/40" : "bg-muted"}`}
                  />
                )}
              </div>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {step}/4
            </span>
          </div>

          {/* ADIM 1: Hesap bilgileri */}
          {step === 1 && (
            <form onSubmit={handleAccountCreate} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Hesabını oluştur</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  14 gün ücretsiz, kart gerekmez.
                </p>
              </div>

              <Field label="Ad Soyad">
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Ahmet Yılmaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>

              <Field label="E-posta">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="ahmet@kulubu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>

              <Field label="Şifre (min. 8 karakter)">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputCls}
                />
              </Field>

              <Field label="Şifre Tekrar">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>

              {error && <ErrorMsg msg={error} />}

              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Zaten hesabın var mı?{" "}
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                  Giriş yap
                </Link>
              </p>
            </form>
          )}

          {/* ADIM 2: Organizasyon */}
          {step === 2 && (
            <form onSubmit={handleOrgCreate} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Organizasyonunu tanıt</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kulübünü veya federasyonunu ekle.
                </p>
              </div>

              <Field label="Organizasyon Adı">
                <input
                  type="text"
                  placeholder="Türkiye Cimnastik Federasyonu"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                  required
                  className={inputCls}
                />
              </Field>

              <Field label="Slug (URL'de görünür)">
                <div className="flex items-center rounded-md border border-input bg-background text-sm">
                  <span className="px-3 py-2 text-muted-foreground border-r border-input">
                    app/
                  </span>
                  <input
                    type="text"
                    placeholder="turkiye-cimnastik"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    required
                    className="flex-1 bg-transparent px-3 py-2 focus:outline-none"
                  />
                </div>
              </Field>

              <Field label="Spor Dalı">
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Seçiniz…</option>
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ülke">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputCls}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              {error && <ErrorMsg msg={error} />}

              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? "Kaydediliyor…" : "Devam"}
              </button>
            </form>
          )}

          {/* ADIM 3: İlk takım */}
          {step === 3 && (
            <form onSubmit={handleTeamCreate} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">İlk takımını oluştur</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Daha sonra istediğin kadar takım ekleyebilirsin.
                </p>
              </div>

              <Field label="Takım Adı">
                <input
                  type="text"
                  placeholder="Artistik Takım"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Branş (opsiyonel)">
                <input
                  type="text"
                  placeholder="Artistik jimnastik"
                  value={teamDiscipline}
                  onChange={(e) => setTeamDiscipline(e.target.value)}
                  className={inputCls}
                />
              </Field>

              {error && <ErrorMsg msg={error} />}

              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? "Oluşturuluyor…" : "Takım Oluştur"}
              </button>

              <button
                type="button"
                onClick={handleSkipTeam}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Şimdi Atla
              </button>
            </form>
          )}

          {/* ADIM 4: Tebrikler */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="text-5xl">🎉</div>
              <div>
                <h2 className="text-2xl font-bold">Organizasyonun hazır!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  14 günlük ücretsiz denemen başladı. Kart bilgisi gerekmez.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/40 px-6 py-4 text-sm text-left space-y-2">
                <p className="font-medium">Sırada neler var?</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Sporcu ekle veya davet et</li>
                  <li>Antrenman programı oluştur ve yayınla</li>
                  <li>ACWR takibini başlat</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => router.push("/athletes")}
                className={btnCls}
              >
                Dashboard&apos;a Git
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sağ: Feature highlight */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center bg-primary/5 border-l px-12">
        <div className="max-w-sm space-y-4 text-center">
          <div className="text-6xl">{feature.icon}</div>
          <h3 className="text-xl font-bold">{feature.title}</h3>
          <p className="text-muted-foreground">{feature.desc}</p>
        </div>
      </div>
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

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {msg}
    </div>
  );
}

const inputCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const btnCls =
  "inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50";
