-- 008_rls_signup.sql
-- Self-serve signup için RLS politikaları genişletildi

-- organizations: super admin veya giriş yapmış kullanıcı kendi org'unu oluşturabilir
drop policy if exists "orgs_insert" on organizations;
create policy "orgs_insert" on organizations for insert with check (
  is_super_admin()
  or (auth.uid() is not null and owner_id = auth.uid())
);

-- memberships: self-serve signup — kullanıcı henüz üye olmadığı bir org'a admin olarak katılabilir
drop policy if exists "memberships_insert_self" on memberships;
create policy "memberships_insert_self" on memberships for insert with check (
  is_super_admin()
  or my_role(org_id) in ('admin', 'coach')
  or (
    auth.uid() is not null
    and user_id = auth.uid()
    and role = 'admin'
    and not exists (
      select 1 from memberships m2
      where m2.user_id = auth.uid() and m2.org_id = memberships.org_id
    )
  )
);

-- teams: admin veya coach ekleyebilir
drop policy if exists "teams_insert" on teams;
create policy "teams_insert" on teams for insert with check (
  is_super_admin()
  or my_role(org_id) in ('admin', 'coach')
);
