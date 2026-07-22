-- =============================================
-- 020_update_program_week.sql — Parti 3.E, Adım 2
-- Transactional RPC: mevcut bir training_programs (tek hafta) satırının
-- alanlarını + tüm session/exercise/exercise_sets ağacını TEK transaction'da
-- günceller. edit-program-client.tsx'in eski delete-then-reinsert (sıralı,
-- transactionsız) akışının yerini alır.
--
-- Önce-kontrol (talimat gereği, canlı pg_policies ile doğrulandı — bkz.
-- PROGRESS.md § Parti 3.E): training_programs.programs_write "for all"
-- policy'si hem SELECT hem INSERT/UPDATE/DELETE için AYNI tek USING
-- ifadesini kullanıyor — ayrı bir UPDATE-özel WITH CHECK YOK, created_by
-- veya team_id'ye göre bir kısıtlama da YOK (org'daki herhangi bir
-- admin/coach herhangi bir programı düzenleyebilir, 018'in INSERT'te
-- kullandığı kontrolle BİREBİR AYNI). Bu yüzden aşağıdaki yetkilendirme
-- 018_create_program_with_weeks.sql'deki ile bilerek birebir aynı.
--
-- Kapsam dışı (bilinçli): p_org_id/p_team_id/p_athlete_id bu RPC'nin
-- imzasında YOK — program kapsamı (hangi takım/sporcu) bu fonksiyonla
-- DEĞİŞTİRİLEMEZ, yalnızca içerik (başlık/faz/not/tarih/seans ağacı)
-- güncellenir. Talimatın verdiği imza bunu yansıtıyor.
-- =============================================

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
  v_week_number int;
begin
  -- ---------------------------------------------
  -- 1. Program var mı? — yetkilendirme kontrolünden ÖNCE org_id'yi
  -- bulmak gerekiyor (my_role(org) org olmadan çağrılamaz).
  -- ---------------------------------------------
  select org_id into v_org_id
  from public.training_programs
  where id = p_program_id;

  if v_org_id is null then
    raise exception 'program bulunamadı';
  end if;

  -- ---------------------------------------------
  -- 2. YETKİLENDİRME — training_programs.programs_write (002_rls.sql) ile
  -- BİREBİR AYNI, coalesce(...,false) ZORUNLU (Parti 3.C'nin öğrenimi —
  -- membership'siz kullanıcı için my_role() NULL döner, çıplak boolean OR
  -- zinciri sessizce bypass eder).
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
  -- 3. week_number YENİDEN hesaplanır — asla parametre olarak alınmaz.
  -- 018_create_program_with_weeks.sql ile AYNI ISO 8601 mantığı.
  -- ---------------------------------------------
  v_week_number := to_char(p_start_date, 'IW')::int;

  -- ---------------------------------------------
  -- 4. training_programs alanlarını güncelle.
  -- ---------------------------------------------
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

  -- ---------------------------------------------
  -- 5. Mevcut seansları sil — exercises/exercise_sets FK CASCADE ile
  -- otomatik silinir (2.2.D'de doğrulanmış davranış, bkz. PROGRESS.md).
  -- ---------------------------------------------
  delete from public.training_sessions where program_id = p_program_id;

  -- ---------------------------------------------
  -- 6. Yeni ağacı ekle — 019'da çıkarılan paylaşılan fonksiyon.
  -- ---------------------------------------------
  perform public.insert_sessions_tree(p_program_id, p_sessions);
end;
$$;
