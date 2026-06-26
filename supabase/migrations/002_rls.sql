-- =============================================
-- 002_rls.sql — Row Level Security politikaları
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

-- RLS'yi aç
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

-- ORGANIZATIONS
create policy "orgs_select" on organizations for select using (
  is_super_admin()
  or exists (select 1 from memberships where user_id = auth.uid() and org_id = organizations.id)
);

create policy "orgs_insert" on organizations for insert with check (is_super_admin());
create policy "orgs_update" on organizations for update using (is_super_admin());

-- TEAMS
create policy "teams_select" on teams for select using (
  is_super_admin()
  or my_role(org_id) is not null
);

create policy "teams_write" on teams for all using (
  is_super_admin()
  or my_role(org_id) = 'admin'
);

-- MEMBERSHIPS
create policy "memberships_select" on memberships for select using (
  is_super_admin()
  or user_id = auth.uid()
  or my_role(org_id) = 'admin'
);

create policy "memberships_insert" on memberships for insert with check (
  is_super_admin()
  or my_role(org_id) = 'admin'
);

-- ATHLETES
create policy "athletes_select" on athletes for select using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or (my_role(org_id) = 'coach' and team_id = my_team_id(org_id))
  or user_id = auth.uid()
);

create policy "athletes_insert" on athletes for insert with check (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or (my_role(org_id) = 'coach' and team_id = my_team_id(org_id))
);

create policy "athletes_update" on athletes for update using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or (my_role(org_id) = 'coach' and team_id = my_team_id(org_id))
);

-- TRAINING_PROGRAMS
create policy "programs_select" on training_programs for select using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or my_role(org_id) = 'coach'
  or (
    exists (
      select 1 from athletes a
      where a.user_id = auth.uid()
      and (a.id = athlete_id or a.team_id = training_programs.team_id)
    )
    and is_published = true
  )
);

create policy "programs_write" on training_programs for all using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or my_role(org_id) = 'coach'
);

-- TRAINING_SESSIONS
create policy "sessions_select" on training_sessions for select using (
  exists (
    select 1 from training_programs p
    where p.id = program_id
    and (
      is_super_admin()
      or my_role(p.org_id) = 'admin'
      or my_role(p.org_id) = 'coach'
      or (
        exists (
          select 1 from athletes a
          where a.user_id = auth.uid()
          and (a.id = p.athlete_id or a.team_id = p.team_id)
        )
        and p.is_published = true
      )
    )
  )
);

create policy "sessions_write" on training_sessions for all using (
  exists (
    select 1 from training_programs p
    where p.id = program_id
    and (
      is_super_admin()
      or my_role(p.org_id) = 'admin'
      or my_role(p.org_id) = 'coach'
    )
  )
);

-- EXERCISES
create policy "exercises_select" on exercises for select using (
  exists (
    select 1 from training_sessions s
    join training_programs p on p.id = s.program_id
    where s.id = session_id
    and (
      is_super_admin()
      or my_role(p.org_id) = 'admin'
      or my_role(p.org_id) = 'coach'
      or (
        exists (
          select 1 from athletes a
          where a.user_id = auth.uid()
          and (a.id = p.athlete_id or a.team_id = p.team_id)
        )
        and p.is_published = true
      )
    )
  )
);

create policy "exercises_write" on exercises for all using (
  exists (
    select 1 from training_sessions s
    join training_programs p on p.id = s.program_id
    where s.id = session_id
    and (
      is_super_admin()
      or my_role(p.org_id) = 'admin'
      or my_role(p.org_id) = 'coach'
    )
  )
);

-- ACWR_LOGS
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

create policy "acwr_insert" on acwr_logs for insert with check (
  exists (
    select 1 from athletes a
    where a.id = athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) = 'admin'
      or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
    )
  )
);

-- COMPETITIONS
create policy "competitions_select" on competitions for select using (
  is_super_admin()
  or my_role(org_id) is not null
);

create policy "competitions_write" on competitions for all using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or my_role(org_id) = 'coach'
);

-- COMPETITION_RESULTS
create policy "comp_results_select" on competition_results for select using (
  is_super_admin()
  or exists (
    select 1 from competitions c
    join memberships m on m.org_id = c.org_id
    where c.id = competition_id and m.user_id = auth.uid()
  )
);

create policy "comp_results_write" on competition_results for all using (
  is_super_admin()
  or exists (
    select 1 from competitions c
    where c.id = competition_id
    and (my_role(c.org_id) = 'admin' or my_role(c.org_id) = 'coach')
  )
);

-- TEST_RESULTS
create policy "test_results_select" on test_results for select using (
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

create policy "test_results_write" on test_results for all using (
  is_super_admin()
  or exists (
    select 1 from athletes a
    where a.id = athlete_id
    and (
      my_role(a.org_id) = 'admin'
      or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
    )
  )
);
