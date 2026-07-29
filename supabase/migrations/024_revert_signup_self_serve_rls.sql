-- =============================================
-- 024_revert_signup_self_serve_rls.sql
-- Public signup wizard kaldırıldı (Parti 5.B) — 008_rls_signup.sql'in
-- self-serve memberships politikası artık kullanılmıyor ve bir yetkisiz-
-- erişim deliği: herhangi bir authenticated kullanıcı, üyesi olmadığı
-- HERHANGİ bir org'a kendini "admin" olarak ekleyebiliyordu. Kapatılıyor.
-- =============================================

drop policy if exists "memberships_insert_self" on memberships;
create policy "memberships_insert_self" on memberships for insert with check (
  is_super_admin()
  or my_role(org_id) in ('admin', 'coach')
);
