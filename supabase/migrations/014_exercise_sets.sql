-- =============================================
-- 014_exercise_sets.sql — Set bazlı egzersiz takibi (Parti 2.1)
--
-- exercises tablosundaki tek-değerli kg/RPE/% alanları set bazlı hale
-- getiriliyor. Eski kolonlar bu adımda SİLİNMİYOR — UI güncellenene kadar
-- (Parti 2.2) ikisi paralel yaşayacak, bu yüzden migration tamamen
-- ADDITIVE: mevcut hiçbir kolon/politika/fonksiyon kaldırılmaz.
-- =============================================

-- ---------------------------------------------
-- 1a. exercise_sets — set bazlı yoğunluk kaydı
-- ---------------------------------------------
create table exercise_sets (
  id              uuid primary key default gen_random_uuid(),
  exercise_id     uuid references exercises(id) on delete cascade not null,
  set_number      int not null check (set_number > 0),
  reps            int,
  duration_sec    int,
  load_kg         numeric,
  percent_1rm     numeric,
  rpe             numeric,
  is_bodyweight   boolean default false,
  band_resistance text,
  created_at      timestamptz default now(),
  unique (exercise_id, set_number)
);

create index idx_exercise_sets_exercise_id on exercise_sets(exercise_id);

-- ---------------------------------------------
-- 1b. RLS — exercises tablosunun MEVCUT politikasıyla (002_rls.sql
-- exercises_select / exercises_write) birebir aynı mantık; tek fark
-- exercise_id üzerinden exercises'e bir join hop'u fazla.
-- ---------------------------------------------
alter table exercise_sets enable row level security;

create policy "exercise_sets_select" on exercise_sets for select using (
  exists (
    select 1 from exercises e
    join training_sessions s on s.id = e.session_id
    join training_programs p on p.id = s.program_id
    where e.id = exercise_sets.exercise_id
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

create policy "exercise_sets_write" on exercise_sets for all using (
  exists (
    select 1 from exercises e
    join training_sessions s on s.id = e.session_id
    join training_programs p on p.id = s.program_id
    where e.id = exercise_sets.exercise_id
    and (
      is_super_admin()
      or my_role(p.org_id) = 'admin'
      or my_role(p.org_id) = 'coach'
    )
  )
);

-- ---------------------------------------------
-- 1c / 1d. Yeni sütunlar (additive)
-- ---------------------------------------------
alter table exercises
  add column if not exists completed_at timestamptz;

alter table training_sessions
  add column if not exists athlete_session_notes text;

-- ---------------------------------------------
-- 1e. Eski kolonlar — exercise_sets tarafından supersede edildi.
-- Kolonlar SİLİNMEDİ, sadece işaretlendi (bkz. dosya başlığı).
-- ---------------------------------------------
comment on column exercises.sets is 'DEPRECATED - superseded by exercise_sets, kept until UI migration completes (Parti 2.2)';
comment on column exercises.reps is 'DEPRECATED - superseded by exercise_sets, kept until UI migration completes (Parti 2.2)';
comment on column exercises.duration_sec is 'DEPRECATED - superseded by exercise_sets, kept until UI migration completes (Parti 2.2)';
comment on column exercises.load_kg is 'DEPRECATED - superseded by exercise_sets, kept until UI migration completes (Parti 2.2)';
comment on column exercises.load_percent is 'DEPRECATED - superseded by exercise_sets, kept until UI migration completes (Parti 2.2)';
comment on column exercises.load_percent_1rm is 'DEPRECATED - superseded by exercise_sets, kept until UI migration completes (Parti 2.2)';
comment on column exercises.rpe_target is 'DEPRECATED - superseded by exercise_sets, kept until UI migration completes (Parti 2.2)';

-- ---------------------------------------------
-- 2. Veri migration'ı — mevcut exercises satırlarını set bazına dönüştür.
-- Her exercises satırı için `sets` kadar exercise_sets satırı üretilir;
-- reps/duration_sec/load_kg her sete AYNI kopyalanır. band_resistance
-- mevcut veride yok — hepsi null başlar.
-- ---------------------------------------------
insert into exercise_sets (
  exercise_id, set_number, reps, duration_sec, load_kg,
  percent_1rm, rpe, is_bodyweight, band_resistance
)
select
  e.id,
  gs.set_number,
  e.reps,
  e.duration_sec,
  e.load_kg,
  coalesce(e.load_percent_1rm, e.load_percent),
  e.rpe_target,
  coalesce(e.unit = 'bodyweight', false),
  null
from exercises e
cross join lateral generate_series(1, e.sets) as gs(set_number);
