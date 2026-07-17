-- =============================================
-- 013_readiness_scores.sql — Readiness Katmanı Parça 2
-- READINESS_PLAN.md §2.5
--
-- ŞEMA ŞİMDİ, MOTOR SONRAKİ İTERASYON.
-- Motor bireysel taban çizgisine dayanıyor (§4.4); taban çizgisi ≥14 gün
-- veri istiyor. Bugün 0 satır wellness var → motoru şimdi yazmak,
-- ayarlanamayan ve doğrulanamayan bir formül yazmaktır.
--
-- Bu tablo TÜRETİLMİŞ bir cache'tir, doğruluk kaynağı DEĞİL. Her zaman
-- wellness_checkins + calculate_acwr()'den yeniden üretilebilir olmalı.
-- =============================================

create table readiness_scores (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  score_date    date not null,

  score         numeric(5,2) check (score between 0 and 100),
  status        text check (status in ('ready','caution','risk','insufficient_data')),

  wellness_component numeric(5,2),
  acwr_component     numeric(5,2),

  -- BİREYSEL taban çizgisi. Mutlak eşik DEĞİL (§4.4).
  -- "Kendi 28 günlük ortalamasının 1.5 SD altında" > "15'in altında"
  wellness_z    numeric(5,2),
  baseline_mean numeric(5,2),
  baseline_sd   numeric(5,2),
  baseline_n    int,          -- kaç günlük geçmişe dayanıyor — GÜVEN göstergesi

  -- Skoru üreten girdilerin anlık görüntüsü. "Bu skor neden 42?" sorusu
  -- 3 ay sonra da cevaplanabilmeli.
  inputs        jsonb,

  -- KRİTİK: ağırlıkları her ayarladığında skorun ANLAMI değişir. Versiyon
  -- damgası olmadan geçmiş skorlar yorumlanamaz hale gelir.
  algorithm_version text not null,
  computed_at   timestamptz default now(),

  unique (athlete_id, score_date)
);

create index idx_readiness_athlete_date on readiness_scores (athlete_id, score_date desc);
create index idx_readiness_date_status  on readiness_scores (score_date, status);

alter table readiness_scores enable row level security;

-- SELECT — wellness_select ile aynı kalıp
create policy "readiness_select" on readiness_scores for select using (
  is_super_admin()
  or exists (
    select 1 from athletes a
    where a.id = readiness_scores.athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) = 'admin'
      or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
    )
  )
);

-- INSERT/UPDATE/DELETE politikası YOK — bilinçli.
-- RLS açık + politika yok = normal kullanıcı yazamaz. Yalnızca service_role
-- (Edge Function) yazar; service_role RLS'i bypass eder.
-- Türetilmiş tablo elle kurcalanmamalı.
