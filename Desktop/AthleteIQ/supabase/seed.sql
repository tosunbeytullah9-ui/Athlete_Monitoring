-- =============================================
-- seed.sql — Geliştirme test verisi
-- 1 org, 2 takım, 3 koç, 5 sporcu
-- =============================================

-- Test organizasyonu
insert into organizations (id, name, slug, plan) values
  ('00000000-0000-0000-0000-000000000001', 'Test Federasyonu', 'test-fed', 'pro');

-- Test takımları
insert into teams (id, org_id, name, discipline) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'A Takımı — Artistik', 'artistic'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'B Takımı — Ritmik', 'rhythmic');

-- Test sporcuları (user_id null — henüz davet edilmedi)
insert into athletes (id, org_id, team_id, full_name, birth_date, gender, height_cm, weight_kg) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Ayşe Yıldız', '2002-03-15', 'female', 162, 52),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Zeynep Kaya', '2001-07-22', 'female', 158, 49),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Mert Demir', '2003-11-08', 'male', 175, 68),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Elif Şahin', '2000-05-30', 'female', 165, 54),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Selin Arslan', '2004-01-12', 'female', 160, 51);

-- Test programı (A Takımı için)
insert into training_programs (id, org_id, team_id, title, week_number, start_date, phase, is_published) values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010',
   'Hazırlık Dönemi — Hafta 1', 1, current_date, 'preparation', true);

-- Test seansları
insert into training_sessions (id, program_id, day_of_week, session_type, title, duration_min, order_index) values
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', 1, 'strength', 'Kuvvet Antrenmanı', 90, 0),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000001', 3, 'technical', 'Teknik Antrenman', 120, 1),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000001', 5, 'conditioning', 'Kondisyon', 60, 2);

-- Test egzersizleri
insert into exercises (session_id, name, category, sets, reps, load_kg, rest_sec, unit, order_index) values
  ('00000000-0000-0000-0003-000000000001', 'Back Squat', 'squat', 4, 6, 80, 180, 'kg', 0),
  ('00000000-0000-0000-0003-000000000001', 'Romanian Deadlift', 'hinge', 3, 8, 60, 120, 'kg', 1),
  ('00000000-0000-0000-0003-000000000001', 'Pull-up', 'pull', 3, 8, null, 90, 'bodyweight', 2);

-- Test ACWR logları (son 30 gün)
insert into acwr_logs (athlete_id, log_date, session_rpe, duration_min, acute_load, chronic_load) values
  ('00000000-0000-0000-0001-000000000001', current_date - 1, 7, 90, 420, 380),
  ('00000000-0000-0000-0001-000000000001', current_date - 2, 6, 75, 400, 370),
  ('00000000-0000-0000-0001-000000000001', current_date - 4, 8, 100, 440, 385),
  ('00000000-0000-0000-0001-000000000002', current_date - 1, 6, 80, 380, 360),
  ('00000000-0000-0000-0001-000000000002', current_date - 3, 7, 90, 400, 370);

-- Test yarışması
insert into competitions (id, org_id, team_id, name, competition_date, location, level) values
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010',
   'Türkiye Artistik Jimnastik Şampiyonası', current_date + 30, 'Ankara', 'national');

-- Test sonuçları
insert into test_results (athlete_id, test_date, test_type, value, unit) values
  ('00000000-0000-0000-0001-000000000001', current_date - 14, 'CMJ', 42, 'cm'),
  ('00000000-0000-0000-0001-000000000001', current_date - 14, '1RM_squat', 85, 'kg'),
  ('00000000-0000-0000-0001-000000000002', current_date - 14, 'CMJ', 38, 'cm');
