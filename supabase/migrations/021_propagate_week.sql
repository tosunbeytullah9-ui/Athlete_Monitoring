-- =============================================
-- 021_propagate_week.sql — Parti 3.F
-- Bir bloktaki tek bir haftanın (training_programs satırı) session/exercise/
-- exercise_sets ağacını, AYNI bloktaki SONRAKİ haftalara kopyalar. Hedef
-- haftaların KENDİ alanlarına (start_date/end_date/week_number/title/phase/
-- notes/is_published) DOKUNULMAZ — yalnızca içerik (ağaç) değişir.
--
-- Önce-kontrol (talimat gereği, tahmin edilmedi): update_program_week
-- (020_update_program_week.sql) ve create_program_with_weeks
-- (018_create_program_with_weeks.sql) training_programs.programs_write
-- politikasıyla (002_rls.sql:107-111) BİREBİR AYNI yetkilendirme kontrolünü
-- kullanıyor: coalesce(is_super_admin() or my_role(org)='admin' or
-- my_role(org)='coach', false). Aşağıdaki propagate_week_to_future de AYNI
-- kontrolü, aynı coalesce sarmalıyla kullanıyor — yeni bir mantık icat
-- edilmedi (bkz. CLAUDE.md § 4.1 güvenlik konvansiyonu).
-- =============================================

-- ---------------------------------------------
-- ADIM 1 — copy_program_tree
-- insert_sessions_tree'nin (019_shared_session_tree_insert.sql) jsonb
-- girdisi yerine, VAR OLAN bir kaynak programın session→exercise→
-- exercise_sets ağacını doğrudan satırlardan okuyup hedef programa
-- yeniden-üretilmiş ID'lerle kopyalayan kardeşi. order_index/set_number
-- sırası korunur; session/exercise seviyesinde ID eşlemesi (v_new_session_id/
-- v_new_exercise_id) her exercise'ın doğru yeni session'a, her set'in doğru
-- yeni exercise'a bağlanmasını garanti eder.
--
-- insert_sessions_tree gibi kendi başına bir yetkilendirme kontrolü YOK —
-- çağıran (propagate_week_to_future) zaten kontrol etmiş varsayılıyor
-- (aynı desen, security definer + search_path='').
-- ---------------------------------------------
create or replace function copy_program_tree(
  p_source_program_id uuid,
  p_target_program_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session          record;
  v_exercise         record;
  v_set              record;
  v_new_session_id   uuid;
  v_new_exercise_id  uuid;
begin
  for v_session in
    select * from public.training_sessions
    where program_id = p_source_program_id
    order by order_index
  loop
    insert into public.training_sessions (
      program_id, day_of_week, session_type, title, description,
      duration_min, order_index
    )
    values (
      p_target_program_id, v_session.day_of_week, v_session.session_type,
      v_session.title, v_session.description, v_session.duration_min,
      v_session.order_index
    )
    returning id into v_new_session_id;

    for v_exercise in
      select * from public.exercises
      where session_id = v_session.id
      order by order_index
    loop
      insert into public.exercises (
        session_id, name, category, superset_group, superset_order,
        order_index, rest_sec, notes
      )
      values (
        v_new_session_id, v_exercise.name, v_exercise.category,
        v_exercise.superset_group, v_exercise.superset_order,
        v_exercise.order_index, v_exercise.rest_sec, v_exercise.notes
      )
      returning id into v_new_exercise_id;

      for v_set in
        select * from public.exercise_sets
        where exercise_id = v_exercise.id
        order by set_number
      loop
        insert into public.exercise_sets (
          exercise_id, set_number, reps, duration_sec, load_kg,
          percent_1rm, rpe, is_bodyweight, band_resistance, notes
        )
        values (
          v_new_exercise_id, v_set.set_number, v_set.reps, v_set.duration_sec,
          v_set.load_kg, v_set.percent_1rm, v_set.rpe, v_set.is_bodyweight,
          v_set.band_resistance, v_set.notes
        );
      end loop;
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------
-- ADIM 2 — propagate_week_to_future
-- ---------------------------------------------
create or replace function propagate_week_to_future(
  p_source_program_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id             uuid;
  v_block_id           uuid;
  v_source_week_index  int;
  v_target_count       int;
  v_target             record;
  v_affected           jsonb := '[]'::jsonb;
begin
  -- ---------------------------------------------
  -- 1. Program var mı? — yetkilendirmeden ÖNCE org_id lazım
  -- (my_role(org) org olmadan çağrılamaz — update_program_week ile aynı sıra).
  -- ---------------------------------------------
  select org_id, block_id, week_index_in_block
  into v_org_id, v_block_id, v_source_week_index
  from public.training_programs
  where id = p_source_program_id;

  if v_org_id is null then
    raise exception 'program bulunamadı';
  end if;

  -- ---------------------------------------------
  -- 2. YETKİLENDİRME — programs_write (002_rls.sql) ile birebir aynı,
  -- coalesce(...,false) ZORUNLU (Parti 3.C'nin öğrenimi — membership'siz
  -- kullanıcı için my_role() NULL döner, çıplak boolean OR zinciri sessizce
  -- bypass eder).
  -- ---------------------------------------------
  if not coalesce(
    public.is_super_admin()
    or public.my_role(v_org_id) = 'admin'
    or public.my_role(v_org_id) = 'coach',
    false
  ) then
    raise exception 'yetkisiz';
  end if;

  -- ---------------------------------------------
  -- 3. block_id null ise bu program bir çok-haftalı bloğun parçası değil —
  -- "sonraki hafta" kavramı bile tanımsız.
  -- ---------------------------------------------
  if v_block_id is null then
    raise exception 'bu program bir bloğun parçası değil';
  end if;

  -- ---------------------------------------------
  -- 4. Hedef haftaları say — hiç yoksa (kaynak zaten son hafta) devam etme.
  -- ---------------------------------------------
  select count(*) into v_target_count
  from public.training_programs
  where block_id = v_block_id
    and week_index_in_block > v_source_week_index;

  if v_target_count = 0 then
    raise exception 'sonraki hafta yok';
  end if;

  -- ---------------------------------------------
  -- 5+6. Her hedef için: mevcut ağacı sil (CASCADE ile exercises/
  -- exercise_sets otomatik temizlenir), sonra kaynağın ağacını kopyala.
  -- Hedeflerin start_date/end_date/week_number/title/phase/notes/
  -- is_published alanlarına DOKUNULMAZ. Fonksiyon tek plpgsql çağrısı
  -- olduğundan çağıranın transaction'ı içinde çalışır — herhangi bir
  -- RAISE tüm döngüyü (önceki başarılı hedefler dahil) rollback eder.
  -- ---------------------------------------------
  for v_target in
    select id, week_index_in_block
    from public.training_programs
    where block_id = v_block_id
      and week_index_in_block > v_source_week_index
    order by week_index_in_block
  loop
    delete from public.training_sessions where program_id = v_target.id;
    perform public.copy_program_tree(p_source_program_id, v_target.id);

    v_affected := v_affected || jsonb_build_object(
      'program_id', v_target.id,
      'week_index_in_block', v_target.week_index_in_block
    );
  end loop;

  -- ---------------------------------------------
  -- 7. Dönüş: etkilenen program_id + week_index_in_block listesi.
  -- ---------------------------------------------
  return v_affected;
end;
$$;
