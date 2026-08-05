-- =============================================
-- 027_drop_calculate_acwr.sql
-- Ölü kod temizliği (Parti 6 — ACWR Konsolidasyonu)
-- =============================================

-- calculate_acwr(p_athlete_id uuid, p_date date) — 003_functions.sql'de tanımlandı,
-- 009_security_fixes.sql:126-153'te search_path sertleştirmesiyle yeniden tanımlandı
-- (mantık aynı kaldı). Repo genelinde .rpc("calculate_acwr", ...) çağıran TEK bir
-- call site yok (keşifte ve bu partide tekrar doğrulandı) — ürünün gerçek ACWR
-- hesaplaması tamamen client-side, apps/web/app/(dashboard)/acwr/acwr-client.tsx'teki
-- avgLoad() ile, SABİT bölen (7/28 takvim günü) formülüyle yapılıyor. Bu fonksiyon
-- DEĞİŞKEN bölen (yalnızca loglanan günlerin avg()'i) kullanıyordu — materyal olarak
-- farklı bir metodoloji: 28 günlük pencerede yalnızca 3 kayıt (420+300+360=1080 yük)
-- olan yeni bir sporcu için bu fonksiyon acwr_ratio ≈ 1.0 ("dengeli") üretirken, canlı
-- client-side formül ≈ 4.0 ("aşırı yüklenme alarmı") üretir — iki doğruluk kaynağı.
-- acwr_logs.acwr_ratio (001_schema.sql) yalnızca acute_load/chronic_load generated
-- kolonuna bağlı, bu fonksiyona bağımlı DEĞİL — drop şemayı etkilemez.
-- CASCADE KULLANILMIYOR: bilinmeyen bir view/trigger buna bağımlıysa bu ifade hata
-- verip DURACAK (beklenmiyor, keşifte ve bu partide tekrar doğrulandı).
drop function if exists calculate_acwr(uuid, date);
