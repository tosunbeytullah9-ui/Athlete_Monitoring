-- =============================================
-- 004_wearables.sql — Wearable tabloları
-- =============================================

-- WEARABLE BAĞLANTI TOKENLAR
create table wearable_connections (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references athletes(id) on delete cascade not null,
  provider         text check (provider in ('whoop', 'polar')) not null,
  access_token     text not null,
  refresh_token    text,
  token_expires_at timestamptz,
  provider_user_id text,
  scopes           text[],
  last_synced_at   timestamptz,
  is_active        boolean default true,
  created_at       timestamptz default now(),
  unique (athlete_id, provider)
);

create index idx_wearable_connections_athlete_id on wearable_connections(athlete_id);

-- NORMALIZE EDİLMİŞ WEARABLE VERİSİ
create table wearable_daily_metrics (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references athletes(id) on delete cascade not null,
  provider         text check (provider in ('whoop', 'polar')) not null,
  metric_date      date not null,
  recovery_score   numeric,
  hrv_rmssd        numeric,
  resting_hr       numeric,
  spo2             numeric,
  sleep_score      numeric,
  total_sleep_min  int,
  deep_sleep_min   int,
  rem_sleep_min    int,
  sleep_efficiency numeric,
  strain_score     numeric,
  muscle_load      numeric,
  active_calories  int,
  raw_data         jsonb,
  created_at       timestamptz default now(),
  unique (athlete_id, provider, metric_date)
);

create index idx_wearable_metrics_athlete_id on wearable_daily_metrics(athlete_id);
create index idx_wearable_metrics_metric_date on wearable_daily_metrics(metric_date);

-- WHOOP CYCLE KAYITLARI
create table whoop_cycles (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid references athletes(id) on delete cascade not null,
  whoop_cycle_id  text unique not null,
  cycle_start     timestamptz,
  cycle_end       timestamptz,
  strain_score    numeric,
  avg_hr          int,
  max_hr          int,
  kilojoules      numeric,
  raw_data        jsonb,
  synced_at       timestamptz default now()
);

create index idx_whoop_cycles_athlete_id on whoop_cycles(athlete_id);

-- POLAR SYNC STATE
create table polar_sync_state (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid references athletes(id) on delete cascade not null,
  resource_type   text,
  last_tx_id      text,
  last_synced_at  timestamptz,
  unique (athlete_id, resource_type)
);

-- ATHLETE PUSH TOKENS (Expo push notifications)
create table athlete_push_tokens (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid references athletes(id) on delete cascade not null,
  token       text not null,
  platform    text check (platform in ('ios', 'android')),
  created_at  timestamptz default now(),
  unique (athlete_id, token)
);

-- RLS
alter table wearable_connections enable row level security;
alter table wearable_daily_metrics enable row level security;
alter table whoop_cycles enable row level security;
alter table polar_sync_state enable row level security;
alter table athlete_push_tokens enable row level security;

create policy "wearable_own" on wearable_connections for all using (
  exists (select 1 from athletes a where a.id = athlete_id and a.user_id = auth.uid())
  or is_super_admin()
  or exists (
    select 1 from athletes a
    where a.id = athlete_id
    and (my_role(a.org_id) = 'admin' or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id)))
  )
);

create policy "wearable_metrics_select" on wearable_daily_metrics for select using (
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

create policy "wearable_metrics_insert" on wearable_daily_metrics for insert with check (
  is_super_admin()
);

create policy "push_tokens_own" on athlete_push_tokens for all using (
  exists (select 1 from athletes a where a.id = athlete_id and a.user_id = auth.uid())
  or is_super_admin()
);
