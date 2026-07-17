-- =============================================
-- 012_wellness.sql — Readiness Katmanı Parça 1
-- READINESS_PLAN.md §2.3 + §2.4
--
-- Tamamen ADDITIVE: mevcut hiçbir tablo/politika/fonksiyon değişmez.
--
-- Ölçek: McLean ve ark. (2010) 5 maddelik wellness seti (enerji YOK — §4.1).
-- Ürün içinde "Hooper Index" olarak ADLANDIRILMAZ (§4.3).
-- =============================================

create table wellness_checkins (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  checkin_date  date not null default current_date,

  -- KRİTİK: TÜM maddeler AYNI YÖNDE. 1 = en kötü, 5 = en iyi.
  -- Reverse-coding YOK — bu, tüm bir hata sınıfını (ters puanlama) ortadan kaldırır.
  sleep_quality smallint not null check (sleep_quality between 1 and 5), -- 5 = çok dinlendirici
  soreness      smallint not null check (soreness between 1 and 5),      -- 5 = hiç ağrı yok
  stress        smallint not null check (stress between 1 and 5),        -- 5 = çok rahat
  fatigue       smallint not null check (fatigue between 1 and 5),       -- 5 = çok dinç
  mood          smallint not null check (mood between 1 and 5),          -- 5 = çok pozitif

  -- Uyku SÜRESİ, uyku KALİTESİNDEN farklı bir yapıdır. Opsiyonel.
  sleep_hours   numeric(3,1) check (sleep_hours between 0 and 24),

  -- 5..25 — yüksek = iyi. integer: smallint toplamı PG'de zaten integer döner.
  wellness_total integer generated always as
    (sleep_quality + soreness + stress + fatigue + mood) stored,

  notes         text,

  -- Self-report ile koç-vekil girişini ASLA sessizce karıştırma (§0: 4/6 sporcunun
  -- hesabı yok, 10-14 yaş grubu kalıcı bir kategori). Damga RLS'te zorlanır.
  source        text not null default 'athlete'
                check (source in ('athlete', 'coach_proxy')),
  entered_by    uuid references auth.users(id),

  submitted_at  timestamptz default now(),  -- sabah uyumu (compliance) ölçümü için
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  unique (athlete_id, checkin_date)
);

-- Komuta merkezi "bugün takımım" sorgusu ve sporcu trend sorgusu için
create index idx_wellness_athlete_date on wellness_checkins (athlete_id, checkin_date desc);
create index idx_wellness_date         on wellness_checkins (checkin_date);

-- 009'daki update_updated_at() yeniden kullanılıyor
create trigger wellness_updated_at
  before update on wellness_checkins
  for each row execute function update_updated_at();

-- ---------------------------------------------
-- RLS
-- ---------------------------------------------
alter table wellness_checkins enable row level security;

-- SELECT — 002_rls.sql acwr_select kalıbıyla birebir aynı.
-- Sporcu: kendisi · Koç: kendi takımı · Admin: tüm org · Super admin: hepsi
create policy "wellness_select" on wellness_checkins for select using (
  is_super_admin()
  or exists (
    select 1 from athletes a
    where a.id = wellness_checkins.athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) = 'admin'
      or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
    )
  )
);

-- INSERT — source damgası politikanın İÇİNDE zorlanır.
-- Sporcu 'coach_proxy' yazamaz; koç 'athlete' yazamaz. Damga yalan söyleyemez.
-- entered_by da damganın parçası: başkasının adına imza atılamaz.
create policy "wellness_insert" on wellness_checkins for insert with check (
  (
    wellness_checkins.entered_by is null
    or wellness_checkins.entered_by = auth.uid()
  )
  and exists (
    select 1 from athletes a
    where a.id = wellness_checkins.athlete_id
    and (
      (a.user_id = auth.uid() and wellness_checkins.source = 'athlete')
      or (
        wellness_checkins.source = 'coach_proxy'
        and (
          my_role(a.org_id) = 'admin'
          or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
        )
      )
    )
  )
);

-- UPDATE — acwr_logs'ta EKSİK OLAN politika (§2.4 Boşluk 1). Upsert ve
-- düzeltme bunsuz sessizce başarısız olur.
--
-- using      : hangi MEVCUT satıra dokunabilir
-- with check : dokunduktan SONRAKİ satır hâlâ geçerli mi
--
-- ⚠️ PLANDAN SAPMA (bilinçli, güvenlik — canlıda test edilerek doğrulandı):
-- READINESS_PLAN.md §2.4'teki taslak `with check`e YALNIZCA tarih sınırını
-- koyuyordu. `using` ESKİ satırda, `with check` YENİ satırda değerlendiği için
-- sahiplik yalnız eski satırda kontrol edilmiş oluyordu → sporcu kendi
-- satırında `update ... set source = 'coach_proxy'` yapıp kendi self-report'unu
-- "koç vekil girişi" gibi gösterebiliyordu. Bu, §2.3'ün açık sözleşmesini
-- ("damga yalan söyleyemez") doğrudan çiğniyor ve readiness motorunun vekil
-- veriyi ayrı ağırlıklandırma yeteneğini sessizce bozuyordu.
--
-- Bu yüzden sahiplik ifadesi + entered_by imzası `with check` içinde AYNEN
-- tekrarlanıyor. (Not: satırı `athlete_id` değiştirerek başka sporcuya taşımak
-- plandaki halde de engelleniyordu — wellness_select politikası yeni satıra da
-- uygulanıyor. Gerçek açık `source`/`entered_by` damgasıydı, sahiplik değil.)
create policy "wellness_update" on wellness_checkins for update
using (
  exists (
    select 1 from athletes a
    where a.id = wellness_checkins.athlete_id
    and (
      (a.user_id = auth.uid() and wellness_checkins.source = 'athlete')
      or (
        wellness_checkins.source = 'coach_proxy'
        and (
          my_role(a.org_id) = 'admin'
          or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
        )
      )
    )
  )
  -- Geçmişi geriye dönük "düzeltmeyi" engelle: yalnızca bugün ve dün.
  -- Bayat wellness verisi, olmayan wellness verisinden daha kötüdür.
  and wellness_checkins.checkin_date >= current_date - 1
)
with check (
  (
    wellness_checkins.entered_by is null
    or wellness_checkins.entered_by = auth.uid()
  )
  and exists (
    select 1 from athletes a
    where a.id = wellness_checkins.athlete_id
    and (
      (a.user_id = auth.uid() and wellness_checkins.source = 'athlete')
      or (
        wellness_checkins.source = 'coach_proxy'
        and (
          my_role(a.org_id) = 'admin'
          or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
        )
      )
    )
  )
  and wellness_checkins.checkin_date >= current_date - 1
);

-- DELETE politikası YOK — bilinçli. Wellness geçmişi silinmez (audit izi).

-- ---------------------------------------------
-- Realtime — komuta merkezinin canlı güncellenmesi için
-- 011_realtime.sql kalıbı (idempotent)
--
-- RLS realtime'da da geçerli: her abone yalnızca wellness_select'in izin
-- verdiği satırların değişimini alır.
-- ---------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wellness_checkins'
  ) then
    alter publication supabase_realtime add table public.wellness_checkins;
  end if;
end $$;
