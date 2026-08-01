-- =============================================
-- 025_team_scoped_training_rls.sql — GÜVENLİK: coach için takım-bazlı RLS
--
-- BULGU (Parti 8.D mobil keşfi sırasında, canlıda kanıtlandı — bkz. PROGRESS.md
-- § Parti 8.D / § Parti 8.E): training_programs/training_sessions/exercises/
-- exercise_sets/program_blocks üzerindeki coach dalı yalnızca ORG kontrolü
-- yapıyordu (`my_role(org_id) = 'coach'`), athletes tablosunun aksine TEAM
-- kontrolü YOKTU. Sonuç: herhangi bir coach, kendi org'undaki HERHANGİ bir
-- takımın program/seans/egzersiz/set/blok verisini doğrudan sorgulayarak
-- (Postman/mobil/web'in kendi getPrograms(orgId) sorgusu dahil — hiçbir team
-- filtresi olmadığı için web'in /programs liste sayfası da bunu canlıda
-- sergiliyordu) okuyabiliyor ve YAZABİLİYORDU (programs_write/sessions_write/
-- exercises_write "for all" politikaları da aynı kusuru taşıyordu).
--
-- ŞABLON: athletes_select (002_rls.sql:73-78) — coach dalı zaten doğru:
--   (my_role(org_id) = 'coach' and team_id = my_team_id(org_id))
-- Bu migration AYNI mantığı, training_programs/program_blocks'ın doğrudan
-- team_id/athlete_id kolonlarına ve training_sessions/exercises/exercise_sets'in
-- training_programs'a join edilmiş satırına uyguluyor. team_id/athlete_id XOR
-- olduğu için (bir satır ya takıma ya bireysel bir sporcuya atanır) coach
-- kontrolü iki dallı: doğrudan team_id eşleşmesi VEYA (athlete_id atanmışsa)
-- o sporcunun kendi team_id'sinin coach'un takımıyla eşleşmesi.
--
-- MEVCUT POLİTİKALAR DÜŞÜRÜLMEDİ — her biri ALTER POLICY ile YERİNDE
-- güncellendi (isim/super_admin/admin/sporcu-self dalları aynen kalıyor,
-- yalnızca coach dalı sıkılaştırıldı).
--
-- coalesce(..., false) NOTU: CLAUDE.md §4.1'deki kural, PLpgSQL
-- "IF NOT (...) THEN RAISE EXCEPTION" deseni içindir (orada NOT NULL = NULL
-- olduğu için kontrol sessizce ATLANIR — fail-OPEN). Bildirimsel RLS USING
-- ifadeleri farklı çalışır: üç-değerli mantıkta NULL zaten satırı DIŞLAR
-- (fail-CLOSED) — yani aşağıdaki coalesce'ler burada gerçek bir bypass'ı
-- KAPATMIYOR (my_team_id() NULL dönse bile team_id=NULL karşılaştırması zaten
-- NULL'a düşüp satırı dışlar — org-level coach/team_id=null edge case'i için
-- Parti 8.C'de onaylanan "boş liste" davranışıyla tutarlı). coalesce yalnızca
-- projenin genel konvansiyonuyla açıklık/tutarlılık için eklendi.
--
-- KAPSAM DIŞI (bilinçli): platform_exercises/org_exercises/
-- org_exercise_categories (005_exercises.sql) — sporcuya özel değil, org-geneli
-- paylaşılan bir egzersiz kütüphanesi, team-scoping'e ihtiyacı yok, DOKUNULMADI.
-- athlete_1rm_records — aynı kusuru taşıyor ama training-program zincirinin
-- parçası değil, ayrı bir BUGS.md bulgusu olarak bırakıldı. Migration
-- 018/019/020/021'deki 4 RPC fonksiyonu (create_program_with_weeks,
-- insert_sessions_tree, update_program_week, propagate_week_to_future) RLS'i
-- SECURITY DEFINER ile bypass edip kendi manuel org-only kontrolünü kullanıyor
-- — bu migration'ın kapsamı dışında, BUGS.md'ye ayrı bir bulgu olarak düşüldü.
-- =============================================

-- ---------------------------------------------
-- TRAINING_PROGRAMS
-- ---------------------------------------------
alter policy "programs_select" on training_programs using (
  coalesce(
    is_super_admin()
    or my_role(org_id) = 'admin'
    or (
      my_role(org_id) = 'coach'
      and (
        team_id = my_team_id(org_id)
        or exists (
          select 1 from athletes a2
          where a2.id = training_programs.athlete_id
          and a2.team_id = my_team_id(org_id)
        )
      )
    )
    or (
      exists (
        select 1 from athletes a
        where a.user_id = auth.uid()
        and (a.id = athlete_id or a.team_id = training_programs.team_id)
      )
      and is_published = true
    ),
    false
  )
);

alter policy "programs_write" on training_programs using (
  coalesce(
    is_super_admin()
    or my_role(org_id) = 'admin'
    or (
      my_role(org_id) = 'coach'
      and (
        team_id = my_team_id(org_id)
        or exists (
          select 1 from athletes a2
          where a2.id = training_programs.athlete_id
          and a2.team_id = my_team_id(org_id)
        )
      )
    ),
    false
  )
);

-- ---------------------------------------------
-- TRAINING_SESSIONS (training_programs'a program_id ile join)
-- ---------------------------------------------
alter policy "sessions_select" on training_sessions using (
  coalesce(
    exists (
      select 1 from training_programs p
      where p.id = program_id
      and (
        is_super_admin()
        or my_role(p.org_id) = 'admin'
        or (
          my_role(p.org_id) = 'coach'
          and (
            p.team_id = my_team_id(p.org_id)
            or exists (
              select 1 from athletes a2
              where a2.id = p.athlete_id
              and a2.team_id = my_team_id(p.org_id)
            )
          )
        )
        or (
          exists (
            select 1 from athletes a
            where a.user_id = auth.uid()
            and (a.id = p.athlete_id or a.team_id = p.team_id)
          )
          and p.is_published = true
        )
      )
    ),
    false
  )
);

alter policy "sessions_write" on training_sessions using (
  coalesce(
    exists (
      select 1 from training_programs p
      where p.id = program_id
      and (
        is_super_admin()
        or my_role(p.org_id) = 'admin'
        or (
          my_role(p.org_id) = 'coach'
          and (
            p.team_id = my_team_id(p.org_id)
            or exists (
              select 1 from athletes a2
              where a2.id = p.athlete_id
              and a2.team_id = my_team_id(p.org_id)
            )
          )
        )
      )
    ),
    false
  )
);

-- ---------------------------------------------
-- EXERCISES (training_sessions üzerinden training_programs'a join)
-- ---------------------------------------------
alter policy "exercises_select" on exercises using (
  coalesce(
    exists (
      select 1 from training_sessions s
      join training_programs p on p.id = s.program_id
      where s.id = session_id
      and (
        is_super_admin()
        or my_role(p.org_id) = 'admin'
        or (
          my_role(p.org_id) = 'coach'
          and (
            p.team_id = my_team_id(p.org_id)
            or exists (
              select 1 from athletes a2
              where a2.id = p.athlete_id
              and a2.team_id = my_team_id(p.org_id)
            )
          )
        )
        or (
          exists (
            select 1 from athletes a
            where a.user_id = auth.uid()
            and (a.id = p.athlete_id or a.team_id = p.team_id)
          )
          and p.is_published = true
        )
      )
    ),
    false
  )
);

alter policy "exercises_write" on exercises using (
  coalesce(
    exists (
      select 1 from training_sessions s
      join training_programs p on p.id = s.program_id
      where s.id = session_id
      and (
        is_super_admin()
        or my_role(p.org_id) = 'admin'
        or (
          my_role(p.org_id) = 'coach'
          and (
            p.team_id = my_team_id(p.org_id)
            or exists (
              select 1 from athletes a2
              where a2.id = p.athlete_id
              and a2.team_id = my_team_id(p.org_id)
            )
          )
        )
      )
    ),
    false
  )
);

-- ---------------------------------------------
-- EXERCISE_SETS (exercises üzerinden training_sessions/training_programs'a join)
-- ---------------------------------------------
alter policy "exercise_sets_select" on exercise_sets using (
  coalesce(
    exists (
      select 1 from exercises e
      join training_sessions s on s.id = e.session_id
      join training_programs p on p.id = s.program_id
      where e.id = exercise_sets.exercise_id
      and (
        is_super_admin()
        or my_role(p.org_id) = 'admin'
        or (
          my_role(p.org_id) = 'coach'
          and (
            p.team_id = my_team_id(p.org_id)
            or exists (
              select 1 from athletes a2
              where a2.id = p.athlete_id
              and a2.team_id = my_team_id(p.org_id)
            )
          )
        )
        or (
          exists (
            select 1 from athletes a
            where a.user_id = auth.uid()
            and (a.id = p.athlete_id or a.team_id = p.team_id)
          )
          and p.is_published = true
        )
      )
    ),
    false
  )
);

alter policy "exercise_sets_write" on exercise_sets using (
  coalesce(
    exists (
      select 1 from exercises e
      join training_sessions s on s.id = e.session_id
      join training_programs p on p.id = s.program_id
      where e.id = exercise_sets.exercise_id
      and (
        is_super_admin()
        or my_role(p.org_id) = 'admin'
        or (
          my_role(p.org_id) = 'coach'
          and (
            p.team_id = my_team_id(p.org_id)
            or exists (
              select 1 from athletes a2
              where a2.id = p.athlete_id
              and a2.team_id = my_team_id(p.org_id)
            )
          )
        )
      )
    ),
    false
  )
);

-- ---------------------------------------------
-- PROGRAM_BLOCKS (training_programs ile birebir aynı doğrudan kolon şekli)
-- ---------------------------------------------
alter policy "program_blocks_select" on program_blocks using (
  coalesce(
    is_super_admin()
    or my_role(org_id) = 'admin'
    or (
      my_role(org_id) = 'coach'
      and (
        team_id = my_team_id(org_id)
        or exists (
          select 1 from athletes a2
          where a2.id = program_blocks.athlete_id
          and a2.team_id = my_team_id(org_id)
        )
      )
    )
    or exists (
      select 1 from athletes a
      where a.user_id = auth.uid()
      and (a.id = program_blocks.athlete_id or a.team_id = program_blocks.team_id)
    ),
    false
  )
);

alter policy "program_blocks_write" on program_blocks using (
  coalesce(
    is_super_admin()
    or my_role(org_id) = 'admin'
    or (
      my_role(org_id) = 'coach'
      and (
        team_id = my_team_id(org_id)
        or exists (
          select 1 from athletes a2
          where a2.id = program_blocks.athlete_id
          and a2.team_id = my_team_id(org_id)
        )
      )
    ),
    false
  )
);
