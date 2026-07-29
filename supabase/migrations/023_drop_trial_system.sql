-- =============================================
-- 023_drop_trial_system.sql
-- Trial/deneme sistemi kaldırılıyor (Parti 5.A)
-- =============================================

-- org_trial_status, plan_status/trial_ends_at/owner_id kolonlarına bağımlı —
-- kolonları düşürmeden önce view'ı düşür.
drop view if exists org_trial_status;

-- orgs_insert politikası (008_rls_signup.sql) owner_id'ye bağımlı —
-- kolonu düşürmeden önce 002_rls.sql'deki orijinal (super_admin-only) haline
-- döndür. organizations'a insert eden tek kod yolu (create-org/route.ts)
-- zaten service-role client kullanıyor (RLS bypass), bu yüzden owner_id
-- dalı zaten hiç tetiklenmiyordu — davranış değişikliği yok.
drop policy if exists "orgs_insert" on organizations;
create policy "orgs_insert" on organizations for insert with check (is_super_admin());

alter table organizations
  drop column if exists trial_ends_at,
  drop column if exists plan_status,
  drop column if exists owner_id;
