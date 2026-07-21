-- =============================================
-- 018_create_program_with_weeks.sql — Parti 3.C
-- Transactional RPC: bir seferde 1..N haftalık bir training_programs
-- grubu + her haftanın training_sessions/exercises/exercise_sets ağacını
-- oluşturur. SADECE FONKSİYON — hiçbir UI bunu henüz çağırmıyor.
--
-- Neden security definer + kendi yetkilendirmesi:
-- Fonksiyon security definer olduğu için training_programs/training_sessions/
-- exercises/exercise_sets/program_blocks üzerindeki RLS politikalarını
-- BYPASS eder. Bu yüzden ilk satırda, training_programs.programs_write
-- politikasıyla (002_rls.sql:107-111, canlı pg_policies ile doğrulandı)
-- BİREBİR AYNI kontrolü manuel olarak uyguluyoruz — yeni bir yetkilendirme
-- mantığı icat edilmedi.
--
-- Neden tek fonksiyon = tek transaction:
-- plpgsql fonksiyonu çağıranın transaction'ı içinde çalışır; içeride
-- RAISE EXCEPTION (yetkisizlik veya bir CHECK constraint ihlali) tetiklenirse
-- Postgres tüm transaction'ı otomatik rollback eder — o ana kadar aynı
-- çağrıda eklenmiş program_blocks/training_programs/training_sessions/
-- exercises/exercise_sets satırları da dahil. Ayrı bir EXCEPTION bloğu
-- YOK — hata yutulmuyor, doğrudan çağırana yansıyor (rollback garantisi
-- için bu şart).
-- =============================================

create or replace function create_program_with_weeks(
  p_org_id           uuid,
  p_team_id          uuid,
  p_athlete_id       uuid,
  p_title            text,
  p_phase            text,
  p_notes            text,
  p_weeks_count      int,
  p_block_start_date date,
  p_sessions         jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_block_id     uuid;
  v_program_id   uuid;
  v_session_id   uuid;
  v_exercise_id  uuid;
  v_program_ids  uuid[] := '{}';
  v_week_start   date;
  v_week_end     date;
  v_week_number  int;
  v_session      jsonb;
  v_exercise     jsonb;
  v_set          jsonb;
begin
  -- ---------------------------------------------
  -- 1. YETKİLENDİRME — training_programs.programs_write (002_rls.sql)
  -- ile birebir aynı: is_super_admin() OR my_role(org)='admin' OR
  -- my_role(org)='coach'. Hiçbir insert'ten ÖNCE çalışır.
  --
  -- KRİTİK — coalesce(..., false) ZORUNLU: org'da hiç membership'i
  -- olmayan bir kullanıcı için my_role() NULL döner. Bu durumda
  -- "false OR null OR null" üç-değerli SQL mantığında NULL'a eşitlenir
  -- (false DEĞİL). plpgsql'de `if not (null) then` hiçbir zaman
  -- tetiklenmez (NULL, IF içinde FALSE gibi davranır) — yani coalesce
  -- olmadan yetkisiz/membership'siz bir kullanıcı SESSİZCE içeri
  -- girerdi. RLS politikasında NULL "reddet" anlamına gelir ama bu
  -- imperatif "if not (...) then raise" çevirisinde ZIT yönde çalışır;
  -- bu yüzden coalesce ile önce false'a sabitlenir. (Canlı testte
  -- İbrahim'in membership'siz athlete kimliğiyle doğrulandı — bkz.
  -- PROGRESS.md Parti 3.C.)
  -- ---------------------------------------------
  if not coalesce(
    public.is_super_admin()
    or public.my_role(p_org_id) = 'admin'
    or public.my_role(p_org_id) = 'coach',
    false
  ) then
    raise exception 'yetkisiz';
  end if;

  -- ---------------------------------------------
  -- 2. XOR kontrolü — training_programs.program_scope_check
  -- (001_schema.sql:84-87) ile birebir aynı mantık.
  -- ---------------------------------------------
  if not (
    (p_team_id is not null and p_athlete_id is null) or
    (p_athlete_id is not null and p_team_id is null)
  ) then
    raise exception 'p_team_id ve p_athlete_id''den tam olarak biri dolu olmalı';
  end if;

  if p_weeks_count < 1 then
    raise exception 'p_weeks_count >= 1 olmalı';
  end if;

  -- ---------------------------------------------
  -- 3. program_blocks — yalnızca birden fazla hafta varsa oluşur.
  -- weeks_count = 1 ise block_id null kalır (training_programs.block_id
  -- zaten nullable, tek haftalık programlar bloksuz yaşar — 017'nin
  -- tasarımıyla tutarlı).
  -- ---------------------------------------------
  if p_weeks_count > 1 then
    insert into public.program_blocks (
      org_id, team_id, athlete_id, created_by, title, total_weeks, phase, notes
    )
    values (
      p_org_id, p_team_id, p_athlete_id, auth.uid(), p_title, p_weeks_count, p_phase, p_notes
    )
    returning id into v_block_id;
  else
    v_block_id := null;
  end if;

  -- ---------------------------------------------
  -- 4. Her hafta için training_programs + p_sessions ağacının klonu.
  -- ---------------------------------------------
  for i in 1..p_weeks_count loop
    v_week_start  := p_block_start_date + ((i - 1) * 7);
    v_week_end    := v_week_start + 6;
    -- Yalnızca bilgi amaçlı: ISO 8601 takvim haftası, hiçbir parametreden
    -- gelmiyor, doğrudan v_week_start'tan hesaplanıyor.
    v_week_number := to_char(v_week_start, 'IW')::int;

    insert into public.training_programs (
      org_id, team_id, athlete_id, created_by, title, week_number,
      start_date, end_date, phase, notes, is_published,
      block_id, week_index_in_block
    )
    values (
      p_org_id, p_team_id, p_athlete_id, auth.uid(), p_title, v_week_number,
      v_week_start, v_week_end, p_phase, p_notes, false,
      case when p_weeks_count > 1 then v_block_id else null end,
      case when p_weeks_count > 1 then i else null end
    )
    returning id into v_program_id;

    v_program_ids := array_append(v_program_ids, v_program_id);

    for v_session in select * from jsonb_array_elements(p_sessions) loop
      insert into public.training_sessions (
        program_id, day_of_week, session_type, title, description,
        duration_min, order_index
      )
      values (
        v_program_id,
        (v_session->>'day_of_week')::int,
        v_session->>'session_type',
        v_session->>'title',
        v_session->>'description',
        (v_session->>'duration_min')::int,
        coalesce((v_session->>'order_index')::int, 0)
      )
      returning id into v_session_id;

      for v_exercise in select * from jsonb_array_elements(coalesce(v_session->'exercises', '[]'::jsonb)) loop
        insert into public.exercises (
          session_id, name, category, superset_group, superset_order,
          order_index, rest_sec, notes
        )
        values (
          v_session_id,
          v_exercise->>'name',
          v_exercise->>'category',
          v_exercise->>'superset_group',
          coalesce((v_exercise->>'superset_order')::int, 0),
          coalesce((v_exercise->>'order_index')::int, 0),
          (v_exercise->>'rest_sec')::int,
          v_exercise->>'notes'
        )
        returning id into v_exercise_id;

        for v_set in select * from jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) loop
          insert into public.exercise_sets (
            exercise_id, set_number, reps, duration_sec, load_kg,
            percent_1rm, rpe, is_bodyweight, band_resistance, notes
          )
          values (
            v_exercise_id,
            (v_set->>'set_number')::int,
            (v_set->>'reps')::int,
            (v_set->>'duration_sec')::int,
            (v_set->>'load_kg')::numeric,
            (v_set->>'percent_1rm')::numeric,
            (v_set->>'rpe')::numeric,
            coalesce((v_set->>'is_bodyweight')::boolean, false),
            v_set->>'band_resistance',
            v_set->>'notes'
          );
        end loop;
      end loop;
    end loop;
  end loop;

  return jsonb_build_object('block_id', v_block_id, 'program_ids', to_jsonb(v_program_ids));
end;
$$;
