-- =============================================
-- 026_team_scoped_program_rpc.sql — GÜVENLİK: program RPC'lerinde takım-bazlı yetkilendirme
--
-- BULGU (BUGS.md 🟠 AÇIK, 2026-08-01, migration 025'in doğrulaması sırasında
-- bulundu): create_program_with_weeks/insert_sessions_tree/update_program_week/
-- propagate_week_to_future SECURITY DEFINER olduğu için training_programs/
-- training_sessions/exercises/exercise_sets üzerindeki RLS'i (025'te takım-
-- bazlı sıkılaştırıldı) TAMAMEN BYPASS EDER ve kendi manuel yetkilendirmesini
-- kullanır. create_program_with_weeks/update_program_week/propagate_week_to_future
-- bu kontrolü org-only (team check'siz) coalesce ile yapıyordu.
-- insert_sessions_tree'nin İSE hiç yetkilendirme kontrolü YOKTU (org-only bile
-- değil) — "çağıran zaten kontrol ediyor" varsayımıyla yazılmıştı, bu migration
-- ona da ilk kez tam (org+team) bir kontrol ekliyor (SECURITY DEFINER + açık
-- EXECUTE grant'ı ile doğrudan/malicious çağrıya karşı).
--
-- ŞABLON: migration 025'in coach dalı (athletes_select ile birebir aynı desen).
-- Ancak burada RLS USING ifadesi değil, imperatif "if not (...) then raise"
-- kullanıldığından kontrol İKİ AYRI ADIMA bölündü (tek coalesce'e merge
-- edilmedi):
--   Adım 1 (DEĞİŞMEDİ) — org-only: is_super_admin() or admin or coach.
--   Adım 2 (YENİ) — yalnızca "admin/super_admin DEĞİL" olanlar için
--     (yani gerçekten sadece coach): team_id = my_team_id(org) OR
--     (athlete_id atanmışsa) o sporcunun team_id'si = my_team_id(org).
--     Değilse ayrı, spesifik mesaj: 'Bu sporcu sizin takımınızda değil'.
-- Bu ayrım bilinçli: adım 1'i "admin ise değişiklik yok" olarak aynen
-- bırakmak, adım 2'yi yalnızca coach dalına eklemek talimatın literal
-- isteğiyle örtüşüyor; tek bir merge'lenmiş coalesce + tek genel 'yetkisiz'
-- mesajı yerine bu iki-adımlı yapı tercih edildi.
--
-- coalesce(..., false) her iki adımda da ZORUNLU (CLAUDE.md §4.1 —
-- membership'siz çağıran için my_role() NULL döner, çıplak "if not (...)"
-- sessizce bypass eder).
--
-- copy_program_tree (021_propagate_week.sql) BİLİNÇLİ OLARAK DEĞİŞTİRİLMEDİ
-- — görev kapsamı yalnızca yukarıdaki 4 fonksiyonu adlandırdı.
-- propagate_week_to_future artık KAYNAK programın team/athlete kapsamını da
-- doğruladığı ve canlı sorguyla doğrulanmış bir değişmez sayesinde ("bir
-- block_id grubunun TÜM satırları aynı team_id/athlete_id'yi paylaşır — sıfır
-- sapma satırı bulundu, bkz. PROGRESS.md bu Parti'nin doğrulama bölümü"),
-- aynı block_id'ye sahip HER hedef hafta da otomatik olarak aynı kapsamdadır.
-- =============================================

-- ---------------------------------------------
-- 1) create_program_with_weeks
-- ---------------------------------------------
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
  -- Adım 1 — org-only (DEĞİŞMEDİ).
  if not coalesce(
    public.is_super_admin()
    or public.my_role(p_org_id) = 'admin'
    or public.my_role(p_org_id) = 'coach',
    false
  ) then
    raise exception 'yetkisiz';
  end if;

  -- Adım 2 — YENİ: admin/super_admin muaf, yalnızca coach için takım kontrolü.
  if not coalesce(public.is_super_admin() or public.my_role(p_org_id) = 'admin', false) then
    if not coalesce(
      p_team_id = public.my_team_id(p_org_id)
      or exists (
        select 1 from public.athletes a2
        where a2.id = p_athlete_id
        and a2.team_id = public.my_team_id(p_org_id)
      ),
      false
    ) then
      raise exception 'Bu sporcu sizin takımınızda değil';
    end if;
  end if;

  -- XOR kontrolü — DEĞİŞMEDİ.
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

-- ---------------------------------------------
-- 2) insert_sessions_tree — YENİ: ilk kez bir yetkilendirme kontrolü ekleniyor.
-- ---------------------------------------------
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
  v_org_id       uuid;
  v_team_id      uuid;
  v_athlete_id   uuid;
  v_session_id   uuid;
  v_exercise_id  uuid;
  v_session      jsonb;
  v_exercise     jsonb;
  v_set          jsonb;
begin
  select org_id, team_id, athlete_id
  into v_org_id, v_team_id, v_athlete_id
  from public.training_programs
  where id = p_program_id;

  if v_org_id is null then
    raise exception 'program bulunamadı';
  end if;

  -- Adım 1 — org-only (YENİ, öncesinde hiç yoktu).
  if not coalesce(
    public.is_super_admin()
    or public.my_role(v_org_id) = 'admin'
    or public.my_role(v_org_id) = 'coach',
    false
  ) then
    raise exception 'yetkisiz';
  end if;

  -- Adım 2 — YENİ: admin/super_admin muaf, yalnızca coach için takım kontrolü.
  if not coalesce(public.is_super_admin() or public.my_role(v_org_id) = 'admin', false) then
    if not coalesce(
      v_team_id = public.my_team_id(v_org_id)
      or exists (
        select 1 from public.athletes a2
        where a2.id = v_athlete_id
        and a2.team_id = public.my_team_id(v_org_id)
      ),
      false
    ) then
      raise exception 'Bu sporcu sizin takımınızda değil';
    end if;
  end if;

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

-- ---------------------------------------------
-- 3) update_program_week
-- ---------------------------------------------
create or replace function update_program_week(
  p_program_id uuid,
  p_title      text,
  p_phase      text,
  p_notes      text,
  p_start_date date,
  p_end_date   date,
  p_sessions   jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id      uuid;
  v_team_id     uuid;
  v_athlete_id  uuid;
  v_week_number int;
begin
  select org_id, team_id, athlete_id
  into v_org_id, v_team_id, v_athlete_id
  from public.training_programs
  where id = p_program_id;

  if v_org_id is null then
    raise exception 'program bulunamadı';
  end if;

  -- Adım 1 — org-only (DEĞİŞMEDİ).
  if not coalesce(
    public.is_super_admin()
    or public.my_role(v_org_id) = 'admin'
    or public.my_role(v_org_id) = 'coach',
    false
  ) then
    raise exception 'yetkisiz';
  end if;

  -- Adım 2 — YENİ: admin/super_admin muaf, yalnızca coach için takım kontrolü.
  if not coalesce(public.is_super_admin() or public.my_role(v_org_id) = 'admin', false) then
    if not coalesce(
      v_team_id = public.my_team_id(v_org_id)
      or exists (
        select 1 from public.athletes a2
        where a2.id = v_athlete_id
        and a2.team_id = public.my_team_id(v_org_id)
      ),
      false
    ) then
      raise exception 'Bu sporcu sizin takımınızda değil';
    end if;
  end if;

  v_week_number := to_char(p_start_date, 'IW')::int;

  update public.training_programs
  set
    title       = p_title,
    phase       = p_phase,
    notes       = p_notes,
    start_date  = p_start_date,
    end_date    = p_end_date,
    week_number = v_week_number,
    updated_at  = now()
  where id = p_program_id;

  delete from public.training_sessions where program_id = p_program_id;

  perform public.insert_sessions_tree(p_program_id, p_sessions);
end;
$$;

-- ---------------------------------------------
-- 4) propagate_week_to_future
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
  v_team_id            uuid;
  v_athlete_id         uuid;
  v_block_id           uuid;
  v_source_week_index  int;
  v_target_count       int;
  v_target             record;
  v_affected           jsonb := '[]'::jsonb;
begin
  select org_id, team_id, athlete_id, block_id, week_index_in_block
  into v_org_id, v_team_id, v_athlete_id, v_block_id, v_source_week_index
  from public.training_programs
  where id = p_source_program_id;

  if v_org_id is null then
    raise exception 'program bulunamadı';
  end if;

  -- Adım 1 — org-only (DEĞİŞMEDİ).
  if not coalesce(
    public.is_super_admin()
    or public.my_role(v_org_id) = 'admin'
    or public.my_role(v_org_id) = 'coach',
    false
  ) then
    raise exception 'yetkisiz';
  end if;

  -- Adım 2 — YENİ: admin/super_admin muaf, yalnızca coach için takım kontrolü.
  if not coalesce(public.is_super_admin() or public.my_role(v_org_id) = 'admin', false) then
    if not coalesce(
      v_team_id = public.my_team_id(v_org_id)
      or exists (
        select 1 from public.athletes a2
        where a2.id = v_athlete_id
        and a2.team_id = public.my_team_id(v_org_id)
      ),
      false
    ) then
      raise exception 'Bu sporcu sizin takımınızda değil';
    end if;
  end if;

  if v_block_id is null then
    raise exception 'bu program bir bloğun parçası değil';
  end if;

  select count(*) into v_target_count
  from public.training_programs
  where block_id = v_block_id
    and week_index_in_block > v_source_week_index;

  if v_target_count = 0 then
    raise exception 'sonraki hafta yok';
  end if;

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

  return v_affected;
end;
$$;
