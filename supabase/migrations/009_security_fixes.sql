-- =============================================
-- 009_security_fixes.sql — Bug Temizleme PARTİ 1 (Güvenlik)
-- BUG 2: org_trial_status view RLS bypass (security_invoker)
-- BUG 3: whoop_cycles + polar_sync_state RLS policy'leri
-- BUG 4: helper fonksiyonlar search_path sertleştirme
-- =============================================

-- ---------------------------------------------
-- BUG 2 — org_trial_status view: security_invoker
-- (owner_id kolonu korunur — geriye dönük uyumlu)
-- ---------------------------------------------
drop view if exists org_trial_status;

create view org_trial_status
with (security_invoker = true) as
select
  id,
  name,
  slug,
  plan,
  plan_status,
  trial_ends_at,
  owner_id,
  case
    when plan_status = 'active' then false
    when trial_ends_at > now() then false
    else true
  end as is_trial_expired,
  greatest(0,
    extract(day from (trial_ends_at - now()))
  )::int as trial_days_remaining
from organizations;

-- ---------------------------------------------
-- BUG 3 — whoop_cycles RLS policy'leri
-- ---------------------------------------------
create policy "whoop_cycles_select"
on whoop_cycles for select using (
  exists (
    select 1 from athletes a
    where a.id = whoop_cycles.athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) in ('admin','coach')
    )
  )
);

create policy "whoop_cycles_insert"
on whoop_cycles for insert with check (
  exists (
    select 1 from athletes a
    where a.id = whoop_cycles.athlete_id
    and a.user_id = auth.uid()
  )
);

-- ---------------------------------------------
-- BUG 3 — polar_sync_state RLS policy'leri
-- ---------------------------------------------
create policy "polar_sync_select"
on polar_sync_state for select using (
  exists (
    select 1 from athletes a
    where a.id = polar_sync_state.athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) in ('admin','coach')
    )
  )
);

create policy "polar_sync_insert"
on polar_sync_state for insert with check (
  exists (
    select 1 from athletes a
    where a.id = polar_sync_state.athlete_id
    and a.user_id = auth.uid()
  )
);

-- ---------------------------------------------
-- BUG 4 — helper fonksiyonlar search_path sertleştirme
-- search_path = '' olduğu için tüm tablo referansları
-- public. prefix'i ile şemalandırıldı.
-- ---------------------------------------------

create or replace function my_role(org uuid)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.memberships
  where user_id = auth.uid() and org_id = org
  limit 1;
$$;

create or replace function my_team_id(org uuid)
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select team_id from public.memberships
  where user_id = auth.uid() and org_id = org
  limit 1;
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
    and raw_user_meta_data->>'platform_role' = 'super_admin'
  );
$$;

create or replace function calculate_acwr(p_athlete_id uuid, p_date date)
returns table(acute_load numeric, chronic_load numeric, acwr_ratio numeric)
language sql
stable
security definer
set search_path = ''
as $$
  with loads as (
    select
      log_date,
      session_load
    from public.acwr_logs
    where athlete_id = p_athlete_id
      and log_date between (p_date - interval '27 days') and p_date
  )
  select
    round(avg(case when log_date >= (p_date - interval '6 days') then session_load end), 2) as acute_load,
    round(avg(session_load), 2) as chronic_load,
    case
      when avg(session_load) > 0
      then round(
        avg(case when log_date >= (p_date - interval '6 days') then session_load end) /
        avg(session_load), 3
      )
      else null
    end as acwr_ratio
  from loads;
$$;

create or replace function get_athlete_programs(p_athlete_id uuid)
returns setof public.training_programs
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.training_programs p
  join public.athletes a on a.id = p_athlete_id
  where (p.athlete_id = p_athlete_id or p.team_id = a.team_id)
    and p.is_published = true
  order by p.start_date desc nulls last;
$$;

create or replace function update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
