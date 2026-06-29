-- 007_trial.sql
-- Trial sütunları + org_trial_status view

alter table organizations
  add column if not exists trial_ends_at timestamptz default (now() + interval '14 days'),
  add column if not exists plan_status text default 'trial'
    check (plan_status in ('trial', 'active', 'expired', 'cancelled')),
  add column if not exists owner_id uuid references auth.users(id);

-- Trial biten organizasyonları kontrol eden view
create or replace view org_trial_status as
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
