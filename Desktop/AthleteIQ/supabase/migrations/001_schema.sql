-- =============================================
-- 001_schema.sql — Temel tablolar
-- =============================================

-- ORGANIZASYONLAR
create table organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  plan         text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  logo_url     text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_organizations_slug on organizations(slug);

-- TAKIMLAR
create table teams (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references organizations(id) on delete cascade not null,
  name         text not null,
  discipline   text,
  created_at   timestamptz default now()
);

create index idx_teams_org_id on teams(org_id);

-- ÜYELİKLER
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

create index idx_memberships_user_id on memberships(user_id);
create index idx_memberships_org_id on memberships(org_id);
create index idx_memberships_team_id on memberships(team_id);

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

create index idx_athletes_org_id on athletes(org_id);
create index idx_athletes_team_id on athletes(team_id);
create index idx_athletes_user_id on athletes(user_id);

-- ANTRENMAN PROGRAMLARI
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
  phase        text,
  notes        text,
  is_published boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  constraint program_scope_check check (
    (team_id is not null and athlete_id is null) or
    (athlete_id is not null and team_id is null)
  )
);

create index idx_programs_org_id on training_programs(org_id);
create index idx_programs_team_id on training_programs(team_id);
create index idx_programs_athlete_id on training_programs(athlete_id);

-- ANTRENMAN SEANSLARİ
create table training_sessions (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid references training_programs(id) on delete cascade not null,
  day_of_week  int check (day_of_week between 1 and 7),
  session_type text,
  title        text,
  description  text,
  duration_min int,
  order_index  int default 0
);

create index idx_sessions_program_id on training_sessions(program_id);

-- EGZERSİZLER
create table exercises (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references training_sessions(id) on delete cascade not null,
  name         text not null,
  category     text,
  sets         int,
  reps         int,
  duration_sec int,
  load_kg      numeric,
  load_percent numeric,
  rest_sec     int,
  unit         text default 'kg' check (unit in ('kg', 'lb', '%', 'bodyweight')),
  notes        text,
  order_index  int default 0
);

create index idx_exercises_session_id on exercises(session_id);

-- ACWR KAYITLARI
create table acwr_logs (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  log_date      date not null,
  session_rpe   numeric check (session_rpe between 0 and 10),
  duration_min  int,
  session_load  numeric generated always as (session_rpe * duration_min) stored,
  acute_load    numeric,
  chronic_load  numeric,
  acwr_ratio    numeric generated always as (
    case when chronic_load > 0 then acute_load / chronic_load else null end
  ) stored,
  notes         text,
  created_at    timestamptz default now(),
  unique (athlete_id, log_date)
);

create index idx_acwr_athlete_id on acwr_logs(athlete_id);
create index idx_acwr_log_date on acwr_logs(log_date);

-- YARIŞMALAR
create table competitions (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid references organizations(id) on delete cascade not null,
  team_id          uuid references teams(id) on delete set null,
  name             text not null,
  competition_date date,
  location         text,
  level            text,
  notes            text
);

create index idx_competitions_org_id on competitions(org_id);

-- YARIŞMA SONUÇLARI
create table competition_results (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade not null,
  athlete_id     uuid references athletes(id) on delete cascade not null,
  event          text,
  score          numeric,
  rank           int,
  notes          text
);

create index idx_comp_results_competition_id on competition_results(competition_id);
create index idx_comp_results_athlete_id on competition_results(athlete_id);

-- TEST SONUÇLARI
create table test_results (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid references athletes(id) on delete cascade not null,
  test_date   date not null,
  test_type   text not null,
  value       numeric,
  unit        text,
  notes       text,
  created_at  timestamptz default now()
);

create index idx_test_results_athlete_id on test_results(athlete_id);
create index idx_test_results_test_date on test_results(test_date);

-- updated_at trigger fonksiyonu
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

create trigger athletes_updated_at
  before update on athletes
  for each row execute function update_updated_at();

create trigger programs_updated_at
  before update on training_programs
  for each row execute function update_updated_at();
