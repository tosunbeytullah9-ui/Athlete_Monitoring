-- =============================================
-- 005_exercises.sql
-- Egzersiz kütüphanesi: platform + org katmanları
-- =============================================

-- Platform egzersiz kütüphanesi (global, salt okunur)
create table platform_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_tr text,
  movement_pattern text not null check (movement_pattern in (
    'horizontal_push','vertical_push',
    'horizontal_pull','vertical_pull',
    'hip_hinge_bilateral','hip_hinge_unilateral',
    'knee_dominant_bilateral','knee_dominant_unilateral',
    'rotation','anti_rotation',
    'jump_land','locomotion',
    'core_stability','loaded_carry',
    'sport_specific','mobility_flexibility'
  )),
  primary_muscles text[] default '{}',
  secondary_muscles text[] default '{}',
  sport_tags text[] default '{}',
  equipment text[] default '{}',
  load_type text check (load_type in (
    'absolute_kg','bodyweight','percentage_1rm',
    'rpe','duration_sec','distance_m'
  )) default 'absolute_kg',
  is_unilateral boolean default false,
  difficulty text check (difficulty in (
    'beginner','intermediate','advanced'
  )) default 'intermediate',
  demo_url text,
  instructions text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Organizasyona özel egzersiz kategorileri
create table org_exercise_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  name_tr text,
  description text,
  color text default '#534AB7',
  icon text default 'barbell',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, name)
);

-- Organizasyona özel egzersizler
create table org_exercises (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  forked_from_platform uuid references platform_exercises(id) on delete set null,
  name text not null,
  name_tr text,
  movement_pattern text check (movement_pattern in (
    'horizontal_push','vertical_push',
    'horizontal_pull','vertical_pull',
    'hip_hinge_bilateral','hip_hinge_unilateral',
    'knee_dominant_bilateral','knee_dominant_unilateral',
    'rotation','anti_rotation',
    'jump_land','locomotion',
    'core_stability','loaded_carry',
    'sport_specific','mobility_flexibility'
  )),
  custom_category_id uuid references org_exercise_categories(id) on delete set null,
  primary_muscles text[] default '{}',
  secondary_muscles text[] default '{}',
  sport_tags text[] default '{}',
  equipment text[] default '{}',
  load_type text check (load_type in (
    'absolute_kg','bodyweight','percentage_1rm',
    'rpe','duration_sec','distance_m'
  )) default 'absolute_kg',
  is_unilateral boolean default false,
  difficulty text check (difficulty in (
    'beginner','intermediate','advanced'
  )) default 'intermediate',
  demo_url text,
  instructions text,
  coach_notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint category_required check (
    movement_pattern is not null
    or custom_category_id is not null
  )
);

-- 1RM kayıtları
create table athlete_1rm_records (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade not null,
  exercise_id uuid,
  exercise_source text check (exercise_source in ('platform','org')) default 'platform',
  exercise_name text not null,
  weight_kg numeric not null,
  test_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Mevcut exercises tablosuna süperset + yük sütunları ekle
alter table exercises
  add column if not exists superset_group text,
  add column if not exists superset_order int default 0,
  add column if not exists load_type text default 'absolute_kg',
  add column if not exists load_percent_1rm numeric,
  add column if not exists rpe_target numeric;

-- Index'ler
create index on platform_exercises(movement_pattern);
create index on platform_exercises using gin(sport_tags);
create index on platform_exercises(is_active);
create index on org_exercises(org_id);
create index on org_exercises(org_id, movement_pattern);
create index on org_exercises(custom_category_id);
create index on org_exercises(is_active);
create index on athlete_1rm_records(athlete_id);
create index on athlete_1rm_records(athlete_id, exercise_name);

-- =============================================
-- RLS POLİTİKALARI
-- =============================================

alter table platform_exercises enable row level security;
alter table org_exercise_categories enable row level security;
alter table org_exercises enable row level security;
alter table athlete_1rm_records enable row level security;

-- Platform egzersizleri: herkes okur
create policy "platform_read_all"
  on platform_exercises for select using (true);

-- Org kategorileri: org üyeleri okur
create policy "org_categories_select"
  on org_exercise_categories for select
  using (my_role(org_id) in ('admin','coach','athlete'));

-- Org kategorileri: admin ve koç oluşturur
create policy "org_categories_insert"
  on org_exercise_categories for insert
  with check (my_role(org_id) in ('admin','coach'));

-- Org kategorileri: admin ve koç günceller
create policy "org_categories_update"
  on org_exercise_categories for update
  using (my_role(org_id) in ('admin','coach'));

-- Org kategorileri: admin siler veya koç kendi oluşturduğunu siler
create policy "org_categories_delete"
  on org_exercise_categories for delete
  using (
    my_role(org_id) = 'admin'
    or (my_role(org_id) = 'coach' and created_by = auth.uid())
  );

-- Org egzersizleri: tüm org üyeleri okur
create policy "org_exercises_select"
  on org_exercises for select
  using (my_role(org_id) in ('admin','coach','athlete'));

-- Org egzersizleri: admin ve koç oluşturur
create policy "org_exercises_insert"
  on org_exercises for insert
  with check (my_role(org_id) in ('admin','coach'));

-- Org egzersizleri: admin her şeyi günceller, koç sadece kendi oluşturduğunu
create policy "org_exercises_update"
  on org_exercises for update
  using (
    my_role(org_id) = 'admin'
    or (my_role(org_id) = 'coach' and created_by = auth.uid())
  );

-- Org egzersizleri: admin her şeyi siler, koç sadece kendi oluşturduğunu
create policy "org_exercises_delete"
  on org_exercises for delete
  using (
    my_role(org_id) = 'admin'
    or (my_role(org_id) = 'coach' and created_by = auth.uid())
  );

-- 1RM: koç/admin okur ve yazar, sporcu kendi görür
create policy "1rm_select"
  on athlete_1rm_records for select using (
    exists (
      select 1 from athletes a
      where a.id = athlete_id
      and (
        a.user_id = auth.uid()
        or my_role(a.org_id) in ('admin','coach')
      )
    )
  );

create policy "1rm_insert"
  on athlete_1rm_records for insert
  with check (
    exists (
      select 1 from athletes a
      where a.id = athlete_id
      and my_role(a.org_id) in ('admin','coach')
    )
  );

create policy "1rm_update"
  on athlete_1rm_records for update
  using (
    exists (
      select 1 from athletes a
      where a.id = athlete_id
      and my_role(a.org_id) in ('admin','coach')
    )
  );

create policy "1rm_delete"
  on athlete_1rm_records for delete
  using (
    exists (
      select 1 from athletes a
      where a.id = athlete_id
      and my_role(a.org_id) in ('admin','coach')
    )
  );
