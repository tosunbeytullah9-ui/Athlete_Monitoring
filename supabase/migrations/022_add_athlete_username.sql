-- =============================================
-- 022_add_athlete_username.sql
-- Sporcu için kullanıcı adı + parola tabanlı hesap (e-posta gerektirmeyen
-- girişler için, örn. create-athlete-account Edge Function). Nullable —
-- mevcut e-posta tabanlı hesaplar (İbrahim vb.) zorla migrate edilmiyor.
-- =============================================

alter table athletes add column username text;

-- Case-insensitive global benzersizlik (org bazlı değil — sentetik e-posta
-- @athleteiq.app tek bir alan adı altında olduğundan çakışma önlenmeli).
create unique index idx_athletes_username_lower
  on athletes (lower(username))
  where username is not null;
