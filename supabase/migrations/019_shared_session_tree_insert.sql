-- =============================================
-- 019_shared_session_tree_insert.sql — Parti 3.E, Adım 1
-- REFAKTÖR — davranış değişikliği YOK.
--
-- 018_create_program_with_weeks.sql'deki session→exercise→exercise_sets iç
-- içe insert döngüsü, private bir plpgsql fonksiyonuna (insert_sessions_tree)
-- çıkarılıyor. create_program_with_weeks bu fonksiyonu ÇAĞIRIYOR, kendi
-- mantığını tekrar yazmıyor. Amaç: Parti 3.E Adım 2'de eklenecek
-- update_program_week RPC'sinin AYNI ağaç-insert mantığını tekrar yazmadan
-- yeniden kullanabilmesi (tek yerde yaz ilkesi).
--
-- Neden "private" (schema-qualified ama grant kısıtlı değil, sadece
-- security definer + search_path='' ile aynı hardening deseni):
-- Postgres'te gerçek bir "private fonksiyon" kavramı yok; bu fonksiyon
-- security definer olarak tanımlanıyor çünkü training_sessions/exercises/
-- exercise_sets üzerindeki RLS'i bypass etmesi gerekiyor (tıpkı
-- create_program_with_weeks'in halihazırda yaptığı gibi) — çağıran RPC'ler
-- (create_program_with_weeks, update_program_week) zaten kendi
-- yetkilendirme kontrollerini bu fonksiyonu çağırmadan ÖNCE yapıyor, bu
-- yüzden insert_sessions_tree'nin kendi başına bir yetkilendirme kontrolü
-- YOK — çağıranın zaten yetkilendirdiği varsayılıyor (tıpkı 018'in iç
-- döngüsünün de kendi başına bir kontrol yapmaması gibi, davranış aynı).
-- =============================================

create or replace function insert_sessions_tree(
  p_program_id uuid,
  p_sessions   jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id   uuid;
  v_exercise_id  uuid;
  v_session      jsonb;
  v_exercise     jsonb;
  v_set          jsonb;
begin
  for v_session in select * from jsonb_array_elements(p_sessions) loop
    insert into public.training_sessions (
      program_id, day_of_week, session_type, title, description,
      duration_min, order_index
    )
    values (
      p_program_id,
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
end;
$$;

-- create_program_with_weeks — iç döngü insert_sessions_tree çağrısıyla
-- değiştirildi, geri kalan her şey (yetkilendirme, XOR kontrolü,
-- program_blocks/training_programs insert'i, haftalık döngü) AYNEN korundu.
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
  v_program_ids  uuid[] := '{}';
  v_week_start   date;
  v_week_end     date;
  v_week_number  int;
begin
  if not coalesce(
    public.is_super_admin()
    or public.my_role(p_org_id) = 'admin'
    or public.my_role(p_org_id) = 'coach',
    false
  ) then
    raise exception 'yetkisiz';
  end if;

  if not (
    (p_team_id is not null and p_athlete_id is null) or
    (p_athlete_id is not null and p_team_id is null)
  ) then
    raise exception 'p_team_id ve p_athlete_id''den tam olarak biri dolu olmalı';
  end if;

  if p_weeks_count < 1 then
    raise exception 'p_weeks_count >= 1 olmalı';
  end if;

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

  for i in 1..p_weeks_count loop
    v_week_start  := p_block_start_date + ((i - 1) * 7);
    v_week_end    := v_week_start + 6;
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

    perform public.insert_sessions_tree(v_program_id, p_sessions);
  end loop;

  return jsonb_build_object('block_id', v_block_id, 'program_ids', to_jsonb(v_program_ids));
end;
$$;
