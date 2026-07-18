-- =============================================
-- 016_session_rpe.sql — training_sessions.session_rpe (Parti 2.2.B)
--
-- Şema hazırlığı ONLY. Bu kolon şu an hiçbir UI'dan doldurulmuyor ve
-- acwr_logs / acwr-client.tsx mekanizmasına bağlanmıyor — bu bağlantı
-- Parti 6 (ACWR/Readiness birleştirme) ve Parti 7 (mobil "yaptım" akışı)
-- kapsamında yapılacak. Tamamen additive.
-- =============================================

alter table training_sessions
  add column if not exists session_rpe smallint
  check (session_rpe between 1 and 10);

comment on column training_sessions.session_rpe is
  'Athlete-entered post-session RPE (1-10). Populated in Parti 7 (mobile). Not yet wired to acwr_logs — see Parti 6 for ACWR/Readiness reconciliation.';
