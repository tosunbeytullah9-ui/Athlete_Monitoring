-- =============================================
-- 003_functions.sql — Yardımcı fonksiyonlar
-- =============================================

-- ACWR hesaplama fonksiyonu (7 günlük / 28 günlük ortalama)
create or replace function calculate_acwr(p_athlete_id uuid, p_date date)
returns table(acute_load numeric, chronic_load numeric, acwr_ratio numeric)
language sql stable security definer as $$
  with loads as (
    select
      log_date,
      session_load
    from acwr_logs
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

-- Sporcu programlarını getir (yayınlanmış)
create or replace function get_athlete_programs(p_athlete_id uuid)
returns setof training_programs
language sql stable security definer as $$
  select p.*
  from training_programs p
  join athletes a on a.id = p_athlete_id
  where (p.athlete_id = p_athlete_id or p.team_id = a.team_id)
    and p.is_published = true
  order by p.start_date desc nulls last;
$$;
