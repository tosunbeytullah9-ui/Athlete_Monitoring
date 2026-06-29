import MarketingLayout from "@/app/(marketing)/layout";

export function LandingPage() {
  return (
    <MarketingLayout>
      <LandingContent />
    </MarketingLayout>
  );
}

function LandingContent() {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground mb-6">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Türkiye Cimnastik Federasyonu AthleteIQ kullanıyor
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Sporcularını İzle.
          <br />
          <span className="text-primary">Programlarını Yönet.</span>
          <br />
          Performansı Artır.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Profesyonel sporcular için tasarlanmış antrenman yönetim platformu.
          Koçlar program oluşturur, sporcular anlık olarak görür.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/signup"
            className="rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            14 Gün Ücretsiz Dene
          </a>
          <a
            href="/demo"
            className="rounded-md border px-8 py-3 text-base font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Demo İste
          </a>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Kart bilgisi gerekmez. 14 gün ücretsiz.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6">
        <h2 className="mb-12 text-center text-2xl font-bold">
          Her şey tek platformda
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <FeatureCard
            icon="🏋️"
            title="Program Builder"
            desc="Haftalık antrenman programlarını oluştur, sporcularına anlık ilet. Süperset sistemi, egzersiz kütüphanesi ve gerçek zamanlı senkronizasyon."
          />
          <FeatureCard
            icon="📊"
            title="ACWR Takibi"
            desc="Akut:Kronik yük oranını izle, sakatlanma riskini minimize et. sRPE tabanlı yük hesaplama ile bilimsel antrenman yönetimi."
          />
          <FeatureCard
            icon="⌚"
            title="Wearable Entegrasyonu"
            desc="WHOOP ve Polar verilerini tek platformda topla. Recovery skoru, HRV ve uyku kalitesini sporcunun performansıyla ilişkilendir."
          />
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-8">
            Güvenilen markalar
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="rounded-lg border bg-background px-6 py-3 text-sm font-semibold text-muted-foreground">
              Türkiye Cimnastik Federasyonu
            </div>
            <div className="rounded-lg border bg-background px-6 py-3 text-sm font-semibold text-muted-foreground">
              Galatasaray SK
            </div>
            <div className="rounded-lg border bg-background px-6 py-3 text-sm font-semibold text-muted-foreground">
              BJK Atletizm
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6">
        <h2 className="mb-4 text-center text-2xl font-bold">Fiyatlandırma</h2>
        <p className="mb-12 text-center text-muted-foreground">
          Her ölçekteki takım için uygun plan.
        </p>

        <div className="grid gap-8 sm:grid-cols-3">
          <PricingCard
            name="Starter"
            price="$29"
            period="/ay"
            desc="Küçük kulüpler ve bireysel koçlar için"
            features={["1 takım", "15 sporcu", "Program builder", "ACWR takibi"]}
            cta="Başla"
            href="/signup"
          />
          <PricingCard
            name="Pro"
            price="$79"
            period="/ay"
            desc="Büyüyen kulüpler için ideal başlangıç"
            features={[
              "3 takım",
              "50 sporcu",
              "Wearable entegrasyonu",
              "Gelişmiş raporlar",
              "Öncelikli destek",
            ]}
            cta="Pro'yu Dene"
            href="/signup"
            highlighted
          />
          <PricingCard
            name="Club"
            price="$199"
            period="/ay"
            desc="Federasyon ve büyük kulüpler için"
            features={[
              "10 takım",
              "200 sporcu",
              "Tüm özellikler",
              "API erişimi",
              "Özel onboarding",
            ]}
            cta="Demo İste"
            href="/demo"
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Daha büyük federasyon?{" "}
          <a href="/demo" className="text-primary underline-offset-4 hover:underline">
            Özel fiyat için demo isteyin
          </a>
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold">Bugün başlayın</h2>
        <p className="mt-3 text-muted-foreground">
          14 günlük ücretsiz denemeyle tüm özellikleri keşfedin.
          Kart bilgisi gerekmez.
        </p>
        <a
          href="/signup"
          className="mt-8 inline-flex rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          Ücretsiz Hesap Oluştur
        </a>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <div className="text-3xl">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  desc,
  features,
  cta,
  href,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 space-y-6 ${
        highlighted
          ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
          : "bg-card"
      }`}
    >
      {highlighted && (
        <div className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          En Popüler ⭐
        </div>
      )}
      <div>
        <p className="text-lg font-bold">{name}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <span className="text-green-500">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={href}
        className={`block w-full rounded-md px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
          highlighted
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border hover:bg-muted"
        }`}
      >
        {cta}
      </a>
    </div>
  );
}
