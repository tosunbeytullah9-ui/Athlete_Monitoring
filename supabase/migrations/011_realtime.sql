-- =============================================
-- 011_realtime.sql
-- Realtime publication for athlete-facing program sync.
--
-- Neden: `supabase_realtime` publication'ı BOŞTU. Mobil sporcu uygulaması
-- `training_programs` üzerinde postgres_changes'e abone oluyor; tablo
-- publication'da olmadığı için kanal asla SUBSCRIBED olmuyordu ve gösterge
-- "Bağlanıyor"da takılı kalıyordu (koç program yayınlayınca sporcu anlık
-- göremiyordu — CLAUDE.md §10 MVP kriteri).
--
-- Not: RLS yine geçerli — her abone yalnızca kendi RLS'ine göre görebildiği
-- satırların değişimini alır (bkz. 002_rls.sql programs_select/sessions_select).
-- =============================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'training_programs'
  ) then
    alter publication supabase_realtime add table public.training_programs;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'training_sessions'
  ) then
    alter publication supabase_realtime add table public.training_sessions;
  end if;
end $$;
