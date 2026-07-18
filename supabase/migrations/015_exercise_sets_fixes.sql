-- =============================================
-- 015_exercise_sets_fixes.sql — Parti 2.1 doğrulama düzeltmeleri
--
-- 014_exercise_sets.sql'de eksik kalan iki madde:
--   1. notes text kolonu hiç yoktu.
--   2. band_resistance serbest text'ti — DB seviyesinde CHECK yoktu.
-- Mevcut 13 satırın hepsinde band_resistance NULL (014'ün backfill'i
-- hep null yazdı), bu yüzden CHECK eklemek mevcut veriyle çakışmıyor.
-- =============================================

alter table exercise_sets
  add column if not exists notes text;

alter table exercise_sets
  add constraint exercise_sets_band_resistance_check
  check (band_resistance in ('soft', 'medium', 'hard'));
