-- =============================================
-- 017_program_blocks.sql — Çok haftalı program grupları (Parti 3.B)
--
-- program_blocks: birden fazla training_programs satırını (haftalık
-- program) ortak bir bloğa (örn. "Hazırlık Dönemi — 8 Hafta") gruplamak
-- için üst seviye bir konteyner. Tamamen ADDITIVE:
--   - Yeni bir tablo (program_blocks)
--   - training_programs'a iki nullable kolon (block_id, week_index_in_block)
-- Mevcut hiçbir tablo/politika/fonksiyon değişmez, mevcut 6 training_programs
-- satırı block_id=null / week_index_in_block=null ile etkilenmeden kalır.
-- =============================================

-- ---------------------------------------------
-- 1. program_blocks
-- ---------------------------------------------
create table program_blocks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references organizations(id) on delete cascade not null,
  team_id      uuid references teams(id) on delete cascade,
  athlete_id   uuid references athletes(id) on delete cascade,
  created_by   uuid references auth.users(id),
  title        text not null,
  total_weeks  int not null check (total_weeks >= 1),
  phase        text,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  -- 001_schema.sql:84-87'deki training_programs.program_scope_check ile
  -- BİREBİR AYNI mantık: team_id XOR athlete_id, ikisi de boş olamaz.
  constraint program_blocks_scope_check check (
    (team_id is not null and athlete_id is null) or
    (athlete_id is not null and team_id is null)
  )
);

create index idx_program_blocks_org_id on program_blocks(org_id);
create index idx_program_blocks_team_id on program_blocks(team_id);
create index idx_program_blocks_athlete_id on program_blocks(athlete_id);

-- 009_security_fixes.sql'deki update_updated_at() zaten var, yeniden kullan.
create trigger program_blocks_updated_at
  before update on program_blocks
  for each row execute function update_updated_at();

-- ---------------------------------------------
-- 2. training_programs — blok bağlantısı (additive, her ikisi de nullable)
-- ---------------------------------------------
alter table training_programs
  add column if not exists block_id uuid references program_blocks(id) on delete set null,
  add column if not exists week_index_in_block int check (week_index_in_block is null or week_index_in_block >= 1);

create index if not exists idx_programs_block_id on training_programs(block_id);

-- ---------------------------------------------
-- 3. RLS
--
-- program_blocks'ın org_id/team_id/athlete_id'si training_programs ile
-- BİREBİR aynı şekilde doğrudan kolon olarak duruyor (exercises/exercise_sets'teki
-- gibi ekstra bir join-hop'a gerek yok — o desen yalnızca alt tablolar
-- (exercises, exercise_sets) üst tabloya (training_programs) FK ile
-- bağlandığında gerekiyordu). Bu yüzden burada programs_select/programs_write
-- (002_rls.sql:93-111) ile AYNI doğrudan mantık kullanılıyor — yeni bir
-- helper fonksiyon icat edilmedi, my_role/my_team_id/is_super_admin
-- olduğu gibi tekrar kullanıldı.
--
-- Kasıtlı fark: training_programs.programs_select sporcu dalını
-- "and is_published = true" ile kısıtlıyor çünkü taslak bir programın
-- içeriği (egzersizler) sporcuya sızmamalı. program_blocks'ta yayın
-- kavramı yok — blok yalnızca bir başlık/faz/toplam-hafta konteyneri,
-- yayın durumu tamamen kendi altındaki training_programs satırlarında
-- yaşıyor. Bu yüzden sporcu dalında is_published kontrolü YOK — sporcu
-- kendi bloğunu (athlete_id eşleşmesi) veya takımının bloğunu (team_id
-- eşleşmesi) görebilir. Henüz hiçbir UI bu tabloyu okumuyor; blok UI'ı
-- şevk edilene kadar bu yalnızca bir erişilebilirlik kararı, gözlemlenen
-- bir davranış değil.
-- ---------------------------------------------
alter table program_blocks enable row level security;

create policy "program_blocks_select" on program_blocks for select using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or my_role(org_id) = 'coach'
  or exists (
    select 1 from athletes a
    where a.user_id = auth.uid()
    and (a.id = program_blocks.athlete_id or a.team_id = program_blocks.team_id)
  )
);

create policy "program_blocks_write" on program_blocks for all using (
  is_super_admin()
  or my_role(org_id) = 'admin'
  or my_role(org_id) = 'coach'
);
