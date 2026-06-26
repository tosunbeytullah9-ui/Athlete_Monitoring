# AthleteIQ — Athlete Monitoring SaaS Platform
## CLAUDE.md — Agent Command Center

> Bu dosya projenin tek kaynak of truth'udur. Tüm agent'lar her görev öncesi bu dosyayı okur.
> Hiçbir agent bu dosyadaki kararları sormadan değiştirmez. Çakışma varsa bu dosya kazanır.

---

## 0. PROJE TANIMI

**Ürün adı:** AthleteIQ  
**Tip:** Multi-tenant B2B SaaS — Sporcu İzleme ve Antrenman Yönetim Platformu  
**Hedef kullanıcı:**
- **Super Admin** → Platform sahibi (sen). Tüm organizasyonlara erişir.
- **Org Admin** → Bir federasyon/kulüp yöneticisi. Kendi organizasyonunu yönetir.
- **Coach** → Belirli bir takımın antrenörü. Sadece kendi takımını görür.
- **Athlete** → Sporcu. Sadece kendi programını ve verilerini görür.

**Temel özellikler (MVP):**
1. Multi-tenant organizasyon yapısı (federasyon → takım → sporcu)
2. Antrenman programı oluşturma ve sporcuya/takıma atama
3. ACWR (Acute:Chronic Workload Ratio) takibi
4. Yarışma takvimi ve sonuçları
5. Test sonuçları (CMJ, sprint, kuvvet testleri)
6. Gerçek zamanlı program senkronizasyonu (sporcu anlık görür)
7. Sporcu davet sistemi (e-posta ile)

**Gelecek özellikler (agent'lar şu an altyapı hazırlar):**
- WHOOP v2 entegrasyonu (recovery, sleep, strain, HRV)
- Polar AccessLink v4 entegrasyonu (nightly recharge, training load, exercises)
- Stripe abonelik sistemi
- AI-destekli yük analizi

---

## 1. TEKNOLOJİ STACK'İ

### Monorepo
```
Turborepo + pnpm workspaces
Node.js >= 20
TypeScript 5.x (strict mode — zorunlu)
```

### Web (Koç & Admin Paneli)
```
Next.js 15 (App Router — pages router YASAK)
React 19
TailwindCSS 4.x
shadcn/ui (Radix UI tabanlı)
TanStack Query v5 (server state)
Zustand (client state — sadece UI state için)
React Hook Form + Zod (form validation)
Recharts (grafikler)
```

### Mobile (Sporcu Uygulaması)
```
Expo SDK 53
React Native
Expo Router (file-based routing)
NativeWind (Tailwind for RN)
Expo Notifications (push)
Expo SecureStore (token storage)
```

### Backend
```
Supabase (primary backend):
  - PostgreSQL 15 (veritabanı)
  - Supabase Auth (JWT + magic link + OAuth)
  - Supabase Realtime (WebSocket — program senkronizasyonu)
  - Supabase Edge Functions (Deno — webhook handler'lar)
  - Row Level Security (veri izolasyonu)
  - Supabase Storage (profil fotoğrafları)

Resend (transactional email — davet, bildirim)
```

### Wearable Entegrasyonları (Altyapı Şimdi, Aktif Sonra)
```
WHOOP Developer Platform v2 API
  - Base: https://api.prod.whoop.com/developer/v2/
  - Auth: OAuth 2.0 + rotating refresh tokens
  - Webhooks: sleep.updated, workout.updated, recovery.created

Polar AccessLink Dynamic API v4
  - Base: https://www.polaraccesslink.com/v4/
  - Auth: OAuth 2.0 (long-lived tokens)
  - Model: Transaction-based (exercise) + Direct (sleep, nightly recharge)
  - Admin: https://admin.polaraccesslink.com
```

### Deploy
```
Vercel (Next.js web app)
Expo EAS (iOS + Android build)
Supabase (managed PostgreSQL + Edge Functions)
```

### Kalite
```
ESLint + Prettier (zorunlu — CI kırar)
Vitest (unit testler)
Playwright (E2E testler)
```

---

## 2. MONOREPO KLASÖR YAPISI

```
athleteiq/
├── CLAUDE.md                        ← Bu dosya — hiç silinmez
├── package.json                     ← pnpm workspace root
├── turbo.json                       ← Turborepo pipeline
├── .env.example                     ← Tüm env variable şablonu
│
├── apps/
│   ├── web/                         ← Next.js 15 — Koç & Admin paneli
│   │   ├── app/
│   │   │   ├── (auth)/             ← Login, register, invite-accept
│   │   │   ├── (dashboard)/        ← Protected routes
│   │   │   │   ├── athletes/       ← Sporcu listesi + detay
│   │   │   │   ├── programs/       ← Program oluştur + listele
│   │   │   │   ├── competitions/   ← Yarışma takvimi
│   │   │   │   ├── tests/          ← Test sonuçları
│   │   │   │   ├── acwr/           ← ACWR dashboard
│   │   │   │   ├── wearables/      ← Wearable bağlantı yönetimi
│   │   │   │   └── settings/       ← Org + takım ayarları
│   │   │   └── admin/              ← Super admin panel
│   │   ├── components/
│   │   │   ├── ui/                 ← shadcn components (dokunulma)
│   │   │   ├── features/           ← Feature-specific components
│   │   │   └── shared/             ← Header, sidebar, layout
│   │   ├── lib/
│   │   │   ├── supabase/           ← server.ts, client.ts, middleware.ts
│   │   │   ├── hooks/              ← useUserContext, useRealtime vb.
│   │   │   └── utils/              ← acwr.ts, date.ts, format.ts
│   │   └── middleware.ts            ← Auth + tenant routing
│   │
│   └── mobile/                      ← Expo — Sporcu uygulaması
│       ├── app/
│       │   ├── (auth)/             ← Login
│       │   └── (tabs)/             ← Ana tab navigator
│       │       ├── program/        ← Günlük/haftalık program
│       │       ├── recovery/       ← WHOOP/Polar verileri
│       │       ├── competitions/   ← Yaklaşan yarışmalar
│       │       └── profile/        ← Profil + wearable bağlantı
│       ├── components/
│       ├── lib/
│       │   ├── supabase.ts
│       │   └── notifications.ts
│       └── app.json
│
├── packages/
│   ├── db/                          ← Supabase tip tanımları
│   │   ├── types.ts                ← Otomatik üretilen DB tipleri
│   │   └── queries/                ← Paylaşılan query fonksiyonları
│   ├── ui/                          ← Paylaşılan UI bileşenleri (web+mobile ortak)
│   ├── validators/                  ← Zod şemaları (web+mobile paylaşır)
│   └── integrations/                ← Wearable adaptörleri
│       ├── whoop/
│       │   ├── client.ts           ← WHOOP v2 API client
│       │   ├── oauth.ts            ← Token yönetimi
│       │   ├── types.ts            ← WHOOP veri tipleri
│       │   └── normalize.ts        ← WHOOP → ortak şema dönüşümü
│       └── polar/
│           ├── client.ts           ← Polar AccessLink v4 client
│           ├── oauth.ts            ← Token yönetimi
│           ├── transaction.ts      ← Transaction-based fetch mantığı
│           ├── types.ts            ← Polar veri tipleri
│           └── normalize.ts        ← Polar → ortak şema dönüşümü
│
└── supabase/
    ├── migrations/
    │   ├── 001_schema.sql          ← Temel tablolar
    │   ├── 002_rls.sql             ← Row Level Security politikaları
    │   ├── 003_functions.sql       ← Helper fonksiyonlar
    │   └── 004_wearables.sql       ← Wearable token tabloları
    ├── functions/
    │   ├── whoop-webhook/          ← WHOOP event handler
    │   ├── polar-sync/             ← Polar transaction poller
    │   └── invite-member/          ← Davet email sender
    └── seed.sql                    ← Geliştirme test verisi
```

---

## 3. VERİTABANI ŞEMASİ (TAM)

### 3.1 Core Tablolar

```sql
-- =============================================
-- 001_schema.sql
-- =============================================

-- ORGANIZASYONLAR (Her müşteri = bir tenant)
create table organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,  -- URL prefix: app.athleteiq.com/tgf
  plan         text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  logo_url     text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- TAKIMLAR
create table teams (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references organizations(id) on delete cascade not null,
  name         text not null,
  discipline   text,  -- 'artistic', 'rhythmic', 'trampoline', 'diving', vb.
  created_at   timestamptz default now()
);

-- ÜYELİKLER (Kullanıcı-Org-Takım-Rol ilişkisi)
create table memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  org_id       uuid references organizations(id) on delete cascade not null,
  team_id      uuid references teams(id) on delete set null,
  role         text check (role in ('admin', 'coach', 'athlete')) not null,
  invited_by   uuid references auth.users(id),
  joined_at    timestamptz default now(),
  unique (user_id, org_id)
);

-- SPORCULAR
create table athletes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null unique,
  org_id       uuid references organizations(id) on delete cascade not null,
  team_id      uuid references teams(id) on delete set null not null,
  full_name    text not null,
  birth_date   date,
  gender       text check (gender in ('male', 'female', 'other')),
  height_cm    numeric,
  weight_kg    numeric,
  position     text,
  avatar_url   text,
  notes        text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ANTRENMAN PROGRAMLARI
-- Kural: team_id XOR athlete_id (ikisi aynı anda dolu olamaz)
create table training_programs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references organizations(id) on delete cascade not null,
  team_id      uuid references teams(id) on delete cascade,
  athlete_id   uuid references athletes(id) on delete cascade,
  created_by   uuid references auth.users(id),
  title        text not null,
  week_number  int check (week_number between 1 and 52),
  start_date   date,
  end_date     date,
  phase        text,  -- 'preparation', 'competition', 'transition', 'peak'
  notes        text,
  is_published boolean default false,  -- false iken sporcu görmez
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  constraint program_scope_check check (
    (team_id is not null and athlete_id is null) or
    (athlete_id is not null and team_id is null)
  )
);

-- ANTRENMAN SEANSLARİ
create table training_sessions (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid references training_programs(id) on delete cascade not null,
  day_of_week  int check (day_of_week between 1 and 7),  -- 1=Pazartesi
  session_type text,  -- 'strength', 'conditioning', 'technical', 'recovery', 'competition'
  title        text,
  description  text,
  duration_min int,
  order_index  int default 0
);

-- EGZERSİZLER
create table exercises (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references training_sessions(id) on delete cascade not null,
  name         text not null,
  category     text,  -- 'squat', 'push', 'pull', 'hinge', 'carry', 'skill'
  sets         int,
  reps         int,
  duration_sec int,   -- reps yerine süre bazlı egzersizler için
  load_kg      numeric,
  load_percent numeric, -- 1RM yüzdesi
  rest_sec     int,
  unit         text default 'kg' check (unit in ('kg', 'lb', '%', 'bodyweight')),
  notes        text,
  order_index  int default 0
);

-- ACWR KAYITLARI (sRPE yöntemi)
create table acwr_logs (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  log_date      date not null,
  session_rpe   numeric check (session_rpe between 0 and 10),
  duration_min  int,
  session_load  numeric generated always as (session_rpe * duration_min) stored,
  acute_load    numeric,   -- 7 günlük ortalama
  chronic_load  numeric,   -- 28 günlük ortalama
  acwr_ratio    numeric generated always as (
    case when chronic_load > 0 then acute_load / chronic_load else null end
  ) stored,
  notes         text,
  created_at    timestamptz default now(),
  unique (athlete_id, log_date)
);

-- YARIŞMALAR
create table competitions (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid references organizations(id) on delete cascade not null,
  team_id          uuid references teams(id) on delete set null,  -- null = bireysel
  name             text not null,
  competition_date date,
  location         text,
  level            text,  -- 'international', 'national', 'regional', 'local'
  notes            text
);

-- YARIŞMA SONUÇLARI
create table competition_results (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade not null,
  athlete_id     uuid references athletes(id) on delete cascade not null,
  event          text,    -- yarışma disiplini (örn: "Floor Exercise")
  score          numeric,
  rank           int,
  notes          text
);

-- TEST SONUÇLARI
create table test_results (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid references athletes(id) on delete cascade not null,
  test_date   date not null,
  test_type   text not null,  -- 'CMJ', 'SJ', 'sprint_30m', '1RM_squat', 'FMS', vb.
  value       numeric,
  unit        text,           -- 'cm', 'kg', 's', 'score'
  notes       text,
  created_at  timestamptz default now()
);
```

### 3.2 Wearable Tabloları

```sql
-- =============================================
-- 004_wearables.sql
-- =============================================

-- WEARABLE BAĞLANTI TOKENLAR (şifreli saklanır)
create table wearable_connections (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid references athletes(id) on delete cascade not null,
  provider        text check (provider in ('whoop', 'polar')) not null,
  access_token    text not null,   -- pgcrypto ile şifrele
  refresh_token   text,
  token_expires_at timestamptz,
  provider_user_id text,           -- WHOOP user_id veya Polar user_id
  scopes          text[],
  last_synced_at  timestamptz,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  unique (athlete_id, provider)
);

-- NORMALIZE EDİLMİŞ WEARABLE VERİSİ (ortak şema)
create table wearable_daily_metrics (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid references athletes(id) on delete cascade not null,
  provider          text check (provider in ('whoop', 'polar')) not null,
  metric_date       date not null,

  -- Recovery
  recovery_score    numeric,       -- WHOOP: 0-100%, Polar: ANS charge
  hrv_rmssd        numeric,       -- ms
  resting_hr        numeric,       -- bpm
  spo2              numeric,       -- %

  -- Sleep
  sleep_score       numeric,
  total_sleep_min   int,
  deep_sleep_min    int,
  rem_sleep_min     int,
  sleep_efficiency  numeric,       -- %

  -- Load/Strain
  strain_score      numeric,       -- WHOOP: 0-21, Polar: cardio load
  muscle_load       numeric,       -- Polar Training Load Pro
  active_calories   int,

  -- Raw provider response (debug için)
  raw_data          jsonb,

  created_at        timestamptz default now(),
  unique (athlete_id, provider, metric_date)
);

-- WHOOP spesifik — cycle bazlı model
create table whoop_cycles (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid references athletes(id) on delete cascade not null,
  whoop_cycle_id  text unique not null,  -- v2 UUID
  cycle_start     timestamptz,
  cycle_end       timestamptz,
  strain_score    numeric,
  avg_hr          int,
  max_hr          int,
  kilojoules      numeric,
  raw_data        jsonb,
  synced_at       timestamptz default now()
);

-- POLAR spesifik — transaction tracking
create table polar_sync_state (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid references athletes(id) on delete cascade not null,
  resource_type   text,  -- 'exercises', 'sleep', 'activity'
  last_tx_id      text,  -- Son commit edilen transaction ID
  last_synced_at  timestamptz,
  unique (athlete_id, resource_type)
);
```

---

## 4. ROW LEVEL SECURITY (TAM)

```sql
-- =============================================
-- 002_rls.sql
-- =============================================

-- Helper fonksiyonlar
create or replace function my_role(org uuid)
returns text language sql security definer stable as $$
  select role from memberships
  where user_id = auth.uid() and org_id = org limit 1;
$$;

create or replace function my_team_id(org uuid)
returns uuid language sql security definer stable as $$
  select team_id from memberships
  where user_id = auth.uid() and org_id = org limit 1;
$$;

create or replace function is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
    and raw_user_meta_data->>'platform_role' = 'super_admin'
  );
$$;

-- RLS'yi her tablo için aç
alter table organizations enable row level security;
alter table teams enable row level security;
alter table memberships enable row level security;
alter table athletes enable row level security;
alter table training_programs enable row level security;
alter table training_sessions enable row level security;
alter table exercises enable row level security;
alter table acwr_logs enable row level security;
alter table competitions enable row level security;
alter table competition_results enable row level security;
alter table test_results enable row level security;
alter table wearable_connections enable row level security;
alter table wearable_daily_metrics enable row level security;

-- ATHLETES: select
create policy "athletes_select" on athletes for select using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or (my_role(org_id) = 'coach' and team_id = my_team_id(org_id))
  or user_id = auth.uid()
);

-- ATHLETES: insert/update (sadece admin ve coach)
create policy "athletes_write" on athletes for insert with check (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or (my_role(org_id) = 'coach' and team_id = my_team_id(org_id))
);

-- TRAINING_PROGRAMS: select
-- Sporcu: sadece is_published=true olanları görür
create policy "programs_select" on training_programs for select using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or my_role(org_id) = 'coach'
  or (
    exists (select 1 from athletes a where a.user_id = auth.uid()
            and (a.id = athlete_id or a.team_id = training_programs.team_id))
    and is_published = true
  )
);

-- TRAINING_PROGRAMS: write (admin ve coach)
create policy "programs_write" on training_programs for all using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or my_role(org_id) = 'coach'
);

-- ACWR_LOGS: sporcu kendi logu ekler, koç/admin okur
create policy "acwr_select" on acwr_logs for select using (
  is_super_admin()
  or exists (
    select 1 from athletes a
    where a.id = athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) = 'admin'
      or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
    )
  )
);

-- WEARABLE_CONNECTIONS: sadece sporcu kendi bağlantısını görür
create policy "wearable_own" on wearable_connections for all using (
  exists (select 1 from athletes a
          where a.id = athlete_id and a.user_id = auth.uid())
  or is_super_admin()
);

-- SESSION ve EXERCISE tabloları program'a kaskad eder
-- (Ayrı politika yazılmaz — program'a erişim varsa session/exercise'e de var)
create policy "sessions_select" on training_sessions for select using (
  exists (
    select 1 from training_programs p
    where p.id = program_id
    and (
      is_super_admin()
      or my_role(p.org_id) = 'admin'
      or my_role(p.org_id) = 'coach'
      or (exists (select 1 from athletes a where a.user_id = auth.uid()
                  and (a.id = p.athlete_id or a.team_id = p.team_id))
          and p.is_published = true)
    )
  )
);

create policy "exercises_select" on exercises for select using (
  exists (
    select 1 from training_sessions s
    join training_programs p on p.id = s.program_id
    where s.id = session_id
    and (
      is_super_admin()
      or my_role(p.org_id) = 'admin'
      or my_role(p.org_id) = 'coach'
      or (exists (select 1 from athletes a where a.user_id = auth.uid()
                  and (a.id = p.athlete_id or a.team_id = p.team_id))
          and p.is_published = true)
    )
  )
);
```

---

## 5. WEARABLE ENTEGRASYONLARİ — TEKNİK DETAY

### 5.1 WHOOP v2 API

```
Base URL: https://api.prod.whoop.com/developer/v2/
Auth: OAuth 2.0 Authorization Code Flow
Token: Rotating refresh tokens (her saat yenile)
Scopes: offline read:cycles read:sleep read:recovery read:workout read:body_measurement read:profile

Temel endpoint'ler:
GET /v2/activity/sleep          → Uyku kayıtları (UUID bazlı)
GET /v2/activity/sleep/{id}     → Tek uyku detayı
GET /v2/activity/workout        → Antrenman kayıtları
GET /v2/activity/workout/{id}   → Tek antrenman detayı
GET /v2/cycle                   → Recovery cycle'ları
GET /v2/cycle/{id}              → Tek cycle (strain + recovery)
GET /v2/user/measurement/body   → Vücut ölçümleri
GET /v2/user/profile/basic      → Kullanıcı profili

Webhook events (v2 — UUID ID'ler):
  workout.updated
  sleep.updated
  recovery.created

KRİTİK: v1 webhook'lar kaldırıldı. Sadece v2 kullan.
Token refresh: Her exchange'de yeni refresh token gelir — eski geçersiz olur.
Rate limit: Varsayılan ~120 req/gün/kullanıcı (polling). Webhook ile bu düşer.

WHOOP Cycle Modeli (anla):
  1. Sleep cycle açılır (sporcu uyur)
  2. Sleep cycle kapanır (sporcu uyanır)
  3. Recovery cycle oluşur (sleep kapandıktan sonra)
  → Recovery sabah metriği. Gün içi sorgulanaMAZ.
```

```typescript
// packages/integrations/whoop/client.ts şablonu
export class WHOOPClient {
  private baseUrl = 'https://api.prod.whoop.com/developer/v2'

  async getRecovery(accessToken: string, params: { start: string; end: string }) {
    // Her request'te token geçerliliği kontrol edilir
    // 401 alınırsa refresh edilir, yeni token DB'ye yazılır
  }

  async refreshToken(refreshToken: string): Promise<WHOOPTokens> {
    // POST https://api.prod.whoop.com/oauth/oauth2/token
    // grant_type: refresh_token
    // DÖNEN YENİ refresh_token DB'ye kaydedilir — eski geçersiz!
  }
}
```

### 5.2 Polar AccessLink v4

```
Base URL: https://www.polaraccesslink.com/v4/
Admin: https://admin.polaraccesslink.com
Auth: OAuth 2.0 (erişim token'ı SONA ERME YOK — uzun ömürlü)
Kayıt: Kullanıcı OAuth sonrası POST /v4/users ile kayıt edilmeli!

Scopes: activity:read sleep:read nightly_recharge:read
         training_sessions:read continuous_samples:read

Temel endpoint'ler:
GET /v4/data/nightly-recharge-results  → ANS charge + HRV + sleep charge
GET /v4/data/sleep-results             → Uyku kalite + safhalar
GET /v4/data/continuous-samples        → Sürekli kalp atışı (30 gün maks)
POST /v4/users/{userId}/exercise-transactions  → Transaction aç (ZORUNLU)
GET /v4/users/{userId}/exercise-transactions/{txId}  → Antrenmanları listele
PUT /v4/users/{userId}/exercise-transactions/{txId}  → COMMIT (veriyi işaretle)

KRİTİK — Transaction Modeli:
  1. POST transaction aç → transaction_id al
  2. GET içindeki antrenmanları çek
  3. Her antremanı işle + DB'ye kaydet
  4. PUT ile commit et → Polar "teslim edildi" işaretler
  → Commit edilmezse aynı veri tekrar gelir (at-least-once garantisi)
  → Commit sonrası veri bir daha gelmez — önce işle, sonra commit!

Rate limit: Per-client dynamic scaling (kullanıcı sayısına göre)
```

### 5.3 Normalize Edilmiş Ortak Şema

Her iki provider verisi `wearable_daily_metrics` tablosunda birleşir:

```typescript
// packages/integrations/normalize.ts
interface DailyMetrics {
  athleteId: string
  provider: 'whoop' | 'polar'
  metricDate: string      // YYYY-MM-DD
  recoveryScore: number   // 0-100 (WHOOP doğrudan, Polar ANS charge normalize)
  hrvRmssd: number        // ms
  restingHr: number       // bpm
  sleepScore: number      // 0-100
  totalSleepMin: number
  deepSleepMin: number
  remSleepMin: number
  strainScore: number     // 0-21 scale'e normalize edilir
  muscleLoad?: number     // Sadece Polar
}
```

---

## 6. AGENT TANIMI VE GÖREVLERİ

Aşağıdaki agent'ların her biri bir uzman gibi davranır. Görev başlamadan önce:
1. Bu CLAUDE.md dosyasının ilgili bölümünü okur
2. Mevcut dosya yapısını inceler
3. Çakışma varsa sormadan önce kendi çözümünü üretmez

---

### AGENT 1: DB Agent (Veritabanı Uzmanı)

**Sorumluluk:** Tüm Supabase şeması, migration'lar, RLS politikaları, helper fonksiyonlar

**Uzmanlık seviyesi:** Kıdemli PostgreSQL DBA + Supabase uzmanı

**Görev listesi:**
```
[ ] supabase/migrations/001_schema.sql → Bölüm 3.1 tabloları tam oluştur
[ ] supabase/migrations/002_rls.sql → Bölüm 4 politikaları tam oluştur
[ ] supabase/migrations/003_functions.sql → my_role(), my_team_id(), is_super_admin()
[ ] supabase/migrations/004_wearables.sql → Bölüm 3.2 tabloları tam oluştur
[ ] supabase/seed.sql → 1 org, 2 takım, 5 sporcu, 3 koç test verisi
[ ] packages/db/types.ts → supabase gen types komutu çalıştır
[ ] packages/db/queries/ → Her tablo için type-safe query fonksiyonları
```

**Kurallar:**
- Her migration tek başına rollback edilebilir olmalı
- Enum yerine check constraint kullan (migration kolaylığı)
- Index: org_id, team_id, athlete_id, log_date sütunlarına ekle
- `updated_at` alanları için trigger oluştur

**Test kriteri:** `supabase db diff` temiz çıkmalı, seed.sql hatasız çalışmalı

---

### AGENT 2: Auth Agent (Kimlik Doğrulama Uzmanı)

**Sorumluluk:** Supabase Auth kurulumu, middleware, davet akışı, rol yönetimi

**Uzmanlık seviyesi:** Kıdemli güvenlik + auth mühendisi

**Görev listesi:**
```
[ ] apps/web/middleware.ts → Route koruması + tenant context cookie
[ ] apps/web/lib/supabase/server.ts → Server component client
[ ] apps/web/lib/supabase/client.ts → Client component client
[ ] apps/web/lib/hooks/useUserContext.ts → Role + org + team bilgisi hook
[ ] apps/web/app/(auth)/login/page.tsx → Magic link + email/password login
[ ] apps/web/app/(auth)/invite/[token]/page.tsx → Davet kabul sayfası
[ ] supabase/functions/invite-member/ → Edge Function: davet emaili gönder
[ ] packages/validators/auth.ts → Login, davet Zod şemaları
```

**Middleware mantığı:**
```typescript
// Middleware sırası (değiştirme):
// 1. Session kontrolü → yoksa /login
// 2. membership tablosundan role + org_id + team_id çek
// 3. Cookie'ye yaz (her request'te DB sorgusu yapma)
// 4. /admin routes → sadece super_admin
// 5. /settings → sadece admin role
```

**Davet akışı:**
```
Admin email girer → Edge Function çağrılır →
Supabase auth.admin.inviteUserByEmail() → metadata'ya org_id+role+team_id →
Kullanıcı linke tıklar → invite/[token] sayfası → membership kaydı oluşur
```

**Test kriteri:** Coach A'nın cookie'si Coach B'nin takım verisini döndürmemeli

---

### AGENT 3: Web Agent (Koç Paneli Uzmanı)

**Sorumluluk:** Next.js 15 web uygulaması — tüm koç ve admin arayüzleri

**Uzmanlık seviyesi:** Kıdemli Next.js + React uzmanı

**Görev listesi:**
```
[ ] apps/web/app/(dashboard)/layout.tsx → Sidebar + header layout
[ ] apps/web/app/(dashboard)/athletes/page.tsx → Sporcu listesi (filtreli, aranabilir)
[ ] apps/web/app/(dashboard)/athletes/[id]/page.tsx → Sporcu detay
[ ] apps/web/app/(dashboard)/programs/page.tsx → Program listesi
[ ] apps/web/app/(dashboard)/programs/new/page.tsx → Program oluşturma wizard'ı
[ ] apps/web/app/(dashboard)/programs/[id]/page.tsx → Program detay + edit
[ ] apps/web/app/(dashboard)/acwr/page.tsx → ACWR dashboard (Recharts grafikler)
[ ] apps/web/app/(dashboard)/competitions/page.tsx → Takvim görünümü
[ ] apps/web/app/(dashboard)/tests/page.tsx → Test sonuçları tablosu
[ ] apps/web/app/(dashboard)/wearables/page.tsx → Wearable bağlantı durumu
[ ] apps/web/app/admin/page.tsx → Super admin: org listesi
[ ] apps/web/components/features/program-builder/ → Drag-drop haftalık program
[ ] apps/web/components/features/acwr-chart/ → Recharts ACWR trend grafiği
```

**UI kuralları:**
- shadcn/ui komponentleri kullan, özel tasarım yapma
- TanStack Query: server'da prefetch, client'da hydrate (Supajump pattern)
- Supabase Realtime: program publish edilince toast notification
- Mobile-first responsive (koçlar tablet kullanabilir)
- Loading state'ler: skeleton komponentleri (shadcn Skeleton)

**Realtime aboneliği:**
```typescript
// Program publish edilince sporcular anlık görür
supabase.channel('program-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'training_programs',
    filter: `is_published=eq.true`
  }, (payload) => {
    queryClient.invalidateQueries(['programs'])
  })
  .subscribe()
```

**Test kriteri:**
- Coach yeni program oluşturur → publish → sporcu 2 saniye içinde görür
- Admin tüm takımları görür, Coach sadece kendi takımını görür

---

### AGENT 4: Mobile Agent (Sporcu Uygulaması Uzmanı)

**Sorumluluk:** Expo React Native sporcu uygulaması

**Uzmanlık seviyesi:** Kıdemli React Native + Expo uzmanı

**Görev listesi:**
```
[ ] apps/mobile/app.json → Expo config (bundle ID: com.athleteiq.app)
[ ] apps/mobile/app/(auth)/login.tsx → Email/password + magic link
[ ] apps/mobile/app/(tabs)/_layout.tsx → Bottom tab navigator
[ ] apps/mobile/app/(tabs)/program/index.tsx → Haftalık program görünümü
[ ] apps/mobile/app/(tabs)/program/[day].tsx → Günlük egzersiz detayı
[ ] apps/mobile/app/(tabs)/recovery/index.tsx → WHOOP/Polar recovery özeti
[ ] apps/mobile/app/(tabs)/competitions/index.tsx → Yaklaşan yarışmalar
[ ] apps/mobile/app/(tabs)/profile/index.tsx → Profil + wearable bağlantı
[ ] apps/mobile/lib/supabase.ts → Expo uyumlu Supabase client (AsyncStorage)
[ ] apps/mobile/lib/notifications.ts → Push notification kurulumu
[ ] apps/mobile/components/ProgramDay.tsx → Günlük program kartı
[ ] apps/mobile/components/ExerciseCard.tsx → Egzersiz kartı (set/rep/load)
[ ] apps/mobile/components/RecoveryScore.tsx → Dairesel recovery göstergesi
```

**Teknik kısıtlar:**
- SecureStore: JWT token sakla, AsyncStorage YASAK (güvenlik)
- Realtime: training_programs tablosunu subscribe et, yeni program push notification
- Offline: Son program cache'le (AsyncStorage'da JSON olarak)
- NativeWind: Tailwind class'ları kullan, StyleSheet KULLANMA

**Push notification:**
```typescript
// Koç program publish edince sporculara bildirim
// Expo Push Notification Token → Supabase'de sakla (athlete_push_tokens tablosu)
// Edge Function tetikler → Expo Push API'ye gönderir
```

**Test kriteri:**
- Sporcu login → programı görür → Koç değiştirince 5 sn içinde güncellenir
- iOS + Android aynı davranış

---

### AGENT 5: Integration Agent (Wearable Entegrasyon Uzmanı)

**Sorumluluk:** WHOOP v2 ve Polar v4 API entegrasyonları, token yönetimi, veri senkronizasyonu

**Uzmanlık seviyesi:** Kıdemli API entegrasyon + OAuth uzmanı

**Görev listesi:**
```
[ ] packages/integrations/whoop/client.ts → v2 REST client (retry + rate limit)
[ ] packages/integrations/whoop/oauth.ts → Auth code flow + rotating token refresh
[ ] packages/integrations/whoop/types.ts → v2 Zod şemaları (Cycle, Sleep, Recovery, Workout)
[ ] packages/integrations/whoop/normalize.ts → WHOOPRecovery → DailyMetrics
[ ] packages/integrations/polar/client.ts → v4 REST client
[ ] packages/integrations/polar/oauth.ts → Auth code flow (long-lived token)
[ ] packages/integrations/polar/transaction.ts → Transaction lifecycle manager
[ ] packages/integrations/polar/types.ts → v4 Zod şemaları
[ ] packages/integrations/polar/normalize.ts → PolarNightlyRecharge → DailyMetrics
[ ] supabase/functions/whoop-webhook/ → Webhook receiver + signature validation
[ ] supabase/functions/polar-sync/ → Cron: her saat Polar transaction çek
[ ] apps/web/app/(dashboard)/wearables/whoop-connect/route.ts → OAuth callback
[ ] apps/web/app/(dashboard)/wearables/polar-connect/route.ts → OAuth callback
[ ] apps/mobile/app/(tabs)/profile/connect-whoop.tsx → Sporcu WHOOP bağlantı
[ ] apps/mobile/app/(tabs)/profile/connect-polar.tsx → Sporcu Polar bağlantı
```

**WHOOP Token Yönetimi (kritik):**
```typescript
// Her API çağrısında:
// 1. Token süresini kontrol et (expires_at - 5 dakika)
// 2. Süresi dolmuşsa refresh et
// 3. YENİ access + refresh token'ı DB'ye yaz (eski geçersiz)
// 4. Asla eski refresh token'ı tekrar kullanma
```

**Polar Transaction (kritik):**
```typescript
// SIRA ZORUNLU:
// 1. POST transaction → tx_id al
// 2. Antrenmanları çek + işle + DB'ye kaydet
// 3. Hata yoksa PUT commit et
// 4. polar_sync_state tablosuna last_tx_id yaz
// ASLA önce commit, sonra işleme yapma!
```

**Normalize etme:**
```typescript
// WHOOP strain 0-21 → DailyMetrics.strainScore doğrudan
// Polar ANS charge (scale farklı) → 0-100 normalize et
// Her iki provider recovery → wearable_daily_metrics'e yaz
```

**Test kriteri:**
- WHOOP: Token expire → otomatik refresh → API çağrısı başarılı
- Polar: Transaction aç → antrenmanları çek → commit → tekrar aynı veri gelmesin

---

### AGENT 6: Test Agent (Kalite Güvence Uzmanı)

**Sorumluluk:** RLS testleri, API entegrasyon testleri, E2E senaryolar

**Uzmanlık seviyesi:** Kıdemli QA + güvenlik test uzmanı

**Görev listesi:**
```
[ ] tests/rls/isolation.test.ts → Coach A'nın Coach B verisine erişemediğini doğrula
[ ] tests/rls/athlete-view.test.ts → Sporcu sadece kendi published programını görür
[ ] tests/rls/admin.test.ts → Org admin tüm takımları görür
[ ] tests/integration/whoop.test.ts → Mock WHOOP API → normalize → DB
[ ] tests/integration/polar.test.ts → Mock Polar API → transaction → normalize → DB
[ ] tests/e2e/coach-creates-program.spec.ts → Playwright: koç program oluşturur
[ ] tests/e2e/athlete-views-program.spec.ts → Playwright: sporcu görür + realtime
[ ] tests/e2e/invite-flow.spec.ts → Playwright: admin davet → sporcu kabul
```

**RLS Test Şablonu:**
```typescript
// Her test kendi Supabase service role client'ı ile test user oluşturur
// Test sonunda cleanup yapar
describe('Coach isolation', () => {
  it('Coach A cannot see Coach B athletes', async () => {
    // Arrange: 2 org, 2 coach, 2 athlete oluştur
    // Act: Coach A'nın client'ı ile Coach B'nin sporculara sor
    // Assert: 0 sonuç dön
  })
})
```

**Test kriteri:** CI'da tüm testler yeşil olmadan merge yapılmaz

---

## 7. ENVIRONMENT VARIABLES

```bash
# .env.example — Tüm değerleri doldur, asla commit etme

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ASLA client'a göndermef
SUPABASE_JWT_SECRET=xxx

# WHOOP (developer.whoop.com'dan al)
WHOOP_CLIENT_ID=xxx
WHOOP_CLIENT_SECRET=xxx
WHOOP_REDIRECT_URI=http://localhost:3000/api/wearables/whoop/callback
WHOOP_WEBHOOK_SECRET=xxx  # Webhook signature validation için

# Polar (admin.polaraccesslink.com'dan al)
POLAR_CLIENT_ID=xxx
POLAR_CLIENT_SECRET=xxx
POLAR_REDIRECT_URI=http://localhost:3000/api/wearables/polar/callback

# Email
RESEND_API_KEY=re_xxx

# Uygulama
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 8. GELİŞTİRME KOMUTLARI

```bash
# Kurulum (bir kez)
pnpm install
supabase start
supabase db reset  # migrations + seed çalıştırır

# Geliştirme
pnpm dev                    # Tüm uygulamalar (Turborepo)
pnpm dev --filter=web       # Sadece web
pnpm dev --filter=mobile    # Sadece mobile (Expo)

# Veritabanı
supabase db diff            # Şema değişikliklerini gör
supabase db push            # Migration'ları uygula
pnpm db:gen:types           # TypeScript tipleri üret

# Test
pnpm test                   # Tüm testler
pnpm test:rls               # Sadece RLS testleri
pnpm test:e2e               # Playwright E2E

# Build
pnpm build                  # Production build
eas build --platform all    # Mobile build (EAS)
```

---

## 9. AGENT ÇALIŞMA PROTOKOLü

Her agent görev başlamadan önce şunu yap:

1. **Oku:** Bu CLAUDE.md dosyasının ilgili bölümünü (agent tanımı)
2. **Kontrol et:** Hedef dosyalar zaten var mı? Varsa üzerine yaz, yoksa oluştur
3. **Doğrula:** TypeScript strict mode'da hata var mı? `tsc --noEmit` çalıştır
4. **Test et:** Agent kendi test kriterini çalıştır
5. **Rapor et:** "Görev tamamlandı, [X] dosya oluşturuldu/güncellendi, testler geçti"

**Hiçbir agent:**
- Bu dosyadaki kararları sormadan değiştirmez
- `any` tipi kullanmaz (TypeScript strict)
- RLS bypass etmez (service role key sadece Edge Function'larda)
- Env variable'ları hardcode etmez

---

## 10. MVP TAMAMLANMA KRİTERLERİ

Proje, aşağıdakiler çalışır durumda olunca MVP sayılır:

```
✅ Org Admin kullanıcı oluşturabilir (web)
✅ Coach davet edilebilir (e-posta)
✅ Athlete davet edilebilir (e-posta)
✅ Coach sporcu ekleyebilir
✅ Coach antrenman programı oluşturabilir (takım veya bireysel)
✅ Coach programı publish edebilir
✅ Athlete mobilde programı görebilir (realtime)
✅ Athlete ACWR logu girebilir
✅ Coach ACWR dashboard'unu görebilir
✅ Yarışma eklenebilir
✅ Test sonucu eklenebilir
✅ RLS testleri yeşil (coach izolasyonu)
```

**Wearable entegrasyonu MVP'nin dışındadır.** Altyapı (tablolar, token saklama, normalize şema) hazır olur, aktif sync sonraki sprint'te açılır.

---

*Son güncelleme: Haziran 2026 — Beyto Tosun / AthleteIQ*
*Bu dosya CLAUDE.md'dir. Claude Code bu dosyayı okuyarak çalışır.*
