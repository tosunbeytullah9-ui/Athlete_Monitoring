-- =============================================
-- 006_exercise_seed.sql
-- 150 platform egzersizi + TGF org kategorileri
-- =============================================

-- =============================================
-- PLATFORM EGZERSİZLERİ
-- =============================================

insert into platform_exercises
  (name, name_tr, movement_pattern, primary_muscles, secondary_muscles,
   sport_tags, equipment, load_type, is_unilateral, difficulty)
values

-- ========================
-- HORIZONTAL PUSH (8)
-- ========================
('Bench Press', 'Bench Press', 'horizontal_push',
 array['pectoralis_major','anterior_deltoid'], array['triceps','serratus_anterior'],
 array['all_sports','weightlifting'], array['barbell','bench'], 'absolute_kg', false, 'intermediate'),

('Push-Up', 'Şınav', 'horizontal_push',
 array['pectoralis_major','anterior_deltoid'], array['triceps','core'],
 array['all_sports','gymnastics'], array['bodyweight'], 'bodyweight', false, 'beginner'),

('Dumbbell Bench Press', 'Dumbbell Bench Press', 'horizontal_push',
 array['pectoralis_major','anterior_deltoid'], array['triceps'],
 array['all_sports'], array['dumbbell','bench'], 'absolute_kg', false, 'intermediate'),

('Incline Bench Press', 'İncline Bench Press', 'horizontal_push',
 array['pectoralis_major_upper','anterior_deltoid'], array['triceps'],
 array['all_sports','weightlifting'], array['barbell','bench'], 'absolute_kg', false, 'intermediate'),

('Cable Fly', 'Kablo Fly', 'horizontal_push',
 array['pectoralis_major'], array['anterior_deltoid','biceps'],
 array['all_sports'], array['cable'], 'absolute_kg', false, 'beginner'),

('Ring Push-Up', 'Halka Şınav', 'horizontal_push',
 array['pectoralis_major','anterior_deltoid'], array['triceps','core','serratus_anterior'],
 array['gymnastics'], array['rings'], 'bodyweight', false, 'advanced'),

('Dumbbell Fly', 'Dumbbell Fly', 'horizontal_push',
 array['pectoralis_major'], array['anterior_deltoid'],
 array['all_sports'], array['dumbbell','bench'], 'absolute_kg', false, 'beginner'),

('Push-Up on Rings', 'Halkada Şınav', 'horizontal_push',
 array['pectoralis_major','anterior_deltoid'], array['triceps','core'],
 array['gymnastics'], array['rings'], 'bodyweight', false, 'advanced'),

-- ========================
-- VERTICAL PUSH (8)
-- ========================
('Overhead Press', 'Omuz Press', 'vertical_push',
 array['deltoid','triceps'], array['upper_trapezius','serratus_anterior'],
 array['all_sports','weightlifting'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Dumbbell Shoulder Press', 'Dumbbell Omuz Press', 'vertical_push',
 array['deltoid','triceps'], array['upper_trapezius'],
 array['all_sports'], array['dumbbell'], 'absolute_kg', false, 'intermediate'),

('Handstand Push-Up', 'El Üstünde Şınav', 'vertical_push',
 array['deltoid','triceps'], array['upper_trapezius','core'],
 array['gymnastics'], array['bodyweight','wall'], 'bodyweight', false, 'advanced'),

('Arnold Press', 'Arnold Press', 'vertical_push',
 array['deltoid'], array['triceps','upper_trapezius'],
 array['all_sports'], array['dumbbell'], 'absolute_kg', false, 'intermediate'),

('Push Press', 'Push Press', 'vertical_push',
 array['deltoid','triceps'], array['quadriceps','glutes','upper_trapezius'],
 array['weightlifting','all_sports'], array['barbell'], 'absolute_kg', false, 'advanced'),

('Lateral Raise', 'Lateral Raise', 'vertical_push',
 array['lateral_deltoid'], array['upper_trapezius'],
 array['all_sports'], array['dumbbell'], 'absolute_kg', false, 'beginner'),

('Front Raise', 'Ön Kaldırma', 'vertical_push',
 array['anterior_deltoid'], array['upper_trapezius'],
 array['all_sports'], array['dumbbell','barbell'], 'absolute_kg', false, 'beginner'),

('Pike Push-Up', 'Pike Şınav', 'vertical_push',
 array['deltoid','triceps'], array['upper_trapezius','core'],
 array['gymnastics','all_sports'], array['bodyweight'], 'bodyweight', false, 'intermediate'),

-- ========================
-- HORIZONTAL PULL (8)
-- ========================
('Bent-Over Row', 'Öne Eğik Kürek', 'horizontal_pull',
 array['latissimus_dorsi','rhomboids'], array['biceps','rear_deltoid','lower_trapezius'],
 array['all_sports','weightlifting'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Dumbbell Row', 'Dumbbell Kürek', 'horizontal_pull',
 array['latissimus_dorsi','rhomboids'], array['biceps','rear_deltoid'],
 array['all_sports'], array['dumbbell','bench'], 'absolute_kg', true, 'beginner'),

('Cable Row', 'Kablo Kürek', 'horizontal_pull',
 array['latissimus_dorsi','rhomboids'], array['biceps','rear_deltoid'],
 array['all_sports'], array['cable'], 'absolute_kg', false, 'beginner'),

('T-Bar Row', 'T-Bar Kürek', 'horizontal_pull',
 array['latissimus_dorsi','rhomboids','lower_trapezius'], array['biceps','rear_deltoid'],
 array['all_sports','weightlifting'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Face Pull', 'Face Pull', 'horizontal_pull',
 array['rear_deltoid','rhomboids','rotator_cuff'], array['biceps','upper_trapezius'],
 array['all_sports'], array['cable'], 'absolute_kg', false, 'beginner'),

('Inverted Row', 'Ters Kürek', 'horizontal_pull',
 array['latissimus_dorsi','rhomboids'], array['biceps','rear_deltoid','core'],
 array['gymnastics','all_sports'], array['barbell','rings'], 'bodyweight', false, 'intermediate'),

('Meadows Row', 'Meadows Kürek', 'horizontal_pull',
 array['latissimus_dorsi','teres_major'], array['biceps','rear_deltoid'],
 array['all_sports'], array['barbell'], 'absolute_kg', true, 'intermediate'),

('Ring Row', 'Halkada Kürek', 'horizontal_pull',
 array['latissimus_dorsi','rhomboids'], array['biceps','rear_deltoid','core'],
 array['gymnastics'], array['rings'], 'bodyweight', false, 'beginner'),

-- ========================
-- VERTICAL PULL (8)
-- ========================
('Pull-Up', 'Barfiksi', 'vertical_pull',
 array['latissimus_dorsi','biceps'], array['rhomboids','lower_trapezius','core'],
 array['all_sports','gymnastics'], array['pull_up_bar'], 'bodyweight', false, 'intermediate'),

('Lat Pulldown', 'Lat Pulldown', 'vertical_pull',
 array['latissimus_dorsi','biceps'], array['rhomboids','lower_trapezius'],
 array['all_sports'], array['cable'], 'absolute_kg', false, 'beginner'),

('Chin-Up', 'Chin-Up', 'vertical_pull',
 array['latissimus_dorsi','biceps'], array['rhomboids','lower_trapezius'],
 array['all_sports','gymnastics'], array['pull_up_bar'], 'bodyweight', false, 'intermediate'),

('Weighted Pull-Up', 'Ağırlıklı Barfiksi', 'vertical_pull',
 array['latissimus_dorsi','biceps'], array['rhomboids','lower_trapezius','core'],
 array['gymnastics','weightlifting'], array['pull_up_bar','weight_belt'], 'absolute_kg', false, 'advanced'),

('Single-Arm Lat Pulldown', 'Tek Kol Lat Pulldown', 'vertical_pull',
 array['latissimus_dorsi','biceps'], array['rhomboids','lower_trapezius'],
 array['all_sports'], array['cable'], 'absolute_kg', true, 'intermediate'),

('Neutral Grip Pull-Up', 'Nötr Tutuş Barfiksi', 'vertical_pull',
 array['latissimus_dorsi','brachialis'], array['rhomboids','biceps'],
 array['all_sports','gymnastics'], array['pull_up_bar'], 'bodyweight', false, 'intermediate'),

('Scapular Pull-Up', 'Skapular Barfiksi', 'vertical_pull',
 array['lower_trapezius','serratus_anterior'], array['latissimus_dorsi'],
 array['gymnastics'], array['pull_up_bar'], 'bodyweight', false, 'beginner'),

('Muscle-Up', 'Muscle-Up', 'vertical_pull',
 array['latissimus_dorsi','biceps','triceps'], array['core','anterior_deltoid'],
 array['gymnastics'], array['pull_up_bar','rings'], 'bodyweight', false, 'advanced'),

-- ========================
-- HIP HINGE BILATERAL (8)
-- ========================
('Deadlift', 'Deadlift', 'hip_hinge_bilateral',
 array['hamstrings','glutes'], array['quadriceps','lower_back','trapezius'],
 array['all_sports','weightlifting'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Romanian Deadlift', 'Romen Deadlift', 'hip_hinge_bilateral',
 array['hamstrings','glutes'], array['lower_back'],
 array['all_sports'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Sumo Deadlift', 'Sumo Deadlift', 'hip_hinge_bilateral',
 array['glutes','adductors','hamstrings'], array['quadriceps','lower_back'],
 array['weightlifting','combat'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Good Morning', 'Good Morning', 'hip_hinge_bilateral',
 array['hamstrings','glutes'], array['lower_back','upper_back'],
 array['all_sports'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Hip Thrust', 'Kalça İtişi', 'hip_hinge_bilateral',
 array['glutes','hamstrings'], array['quadriceps','lower_back'],
 array['all_sports','athletics'], array['barbell','bench'], 'absolute_kg', false, 'beginner'),

('Glute Bridge', 'Kalça Köprüsü', 'hip_hinge_bilateral',
 array['glutes','hamstrings'], array['lower_back','core'],
 array['all_sports'], array['bodyweight','barbell'], 'bodyweight', false, 'beginner'),

('Trap Bar Deadlift', 'Trap Bar Deadlift', 'hip_hinge_bilateral',
 array['hamstrings','glutes','quadriceps'], array['lower_back','trapezius'],
 array['all_sports','weightlifting'], array['trap_bar'], 'absolute_kg', false, 'intermediate'),

('Kettlebell Swing', 'Kettlebell Swing', 'hip_hinge_bilateral',
 array['glutes','hamstrings'], array['lower_back','core','deltoid'],
 array['all_sports','athletics'], array['kettlebell'], 'absolute_kg', false, 'intermediate'),

-- ========================
-- HIP HINGE UNILATERAL (8)
-- ========================
('Single-Leg RDL', 'Tek Bacak RDL', 'hip_hinge_unilateral',
 array['hamstrings','glutes'], array['lower_back','core'],
 array['all_sports','athletics'], array['dumbbell','barbell'], 'absolute_kg', true, 'intermediate'),

('Single-Leg Hip Thrust', 'Tek Bacak Kalça İtişi', 'hip_hinge_unilateral',
 array['glutes','hamstrings'], array['core'],
 array['all_sports'], array['bench','barbell'], 'absolute_kg', true, 'intermediate'),

('Nordic Hamstring Curl', 'Nordic Hamstring Curl', 'hip_hinge_unilateral',
 array['hamstrings'], array['glutes','lower_back'],
 array['all_sports','athletics','team_sports'], array['partner','pad'], 'bodyweight', false, 'advanced'),

('Dumbbell RDL', 'Dumbbell RDL', 'hip_hinge_unilateral',
 array['hamstrings','glutes'], array['lower_back'],
 array['all_sports'], array['dumbbell'], 'absolute_kg', false, 'beginner'),

('Single-Leg Glute Bridge', 'Tek Bacak Kalça Köprüsü', 'hip_hinge_unilateral',
 array['glutes','hamstrings'], array['core','lower_back'],
 array['all_sports'], array['bodyweight'], 'bodyweight', true, 'beginner'),

('Stiff-Leg Deadlift', 'Sert Bacak Deadlift', 'hip_hinge_unilateral',
 array['hamstrings','glutes'], array['lower_back'],
 array['all_sports'], array['barbell','dumbbell'], 'absolute_kg', false, 'intermediate'),

('B-Stance Hip Thrust', 'B-Stance Kalça İtişi', 'hip_hinge_unilateral',
 array['glutes','hamstrings'], array['core'],
 array['all_sports'], array['barbell','bench'], 'absolute_kg', true, 'intermediate'),

('Kickback', 'Kickback', 'hip_hinge_unilateral',
 array['glutes'], array['hamstrings'],
 array['all_sports'], array['cable','bodyweight'], 'absolute_kg', true, 'beginner'),

-- ========================
-- KNEE DOMINANT BILATERAL (8)
-- ========================
('Back Squat', 'Squat', 'knee_dominant_bilateral',
 array['quadriceps','glutes'], array['hamstrings','lower_back','core'],
 array['all_sports','weightlifting'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Front Squat', 'Ön Squat', 'knee_dominant_bilateral',
 array['quadriceps','glutes'], array['core','upper_back'],
 array['weightlifting','gymnastics'], array['barbell'], 'absolute_kg', false, 'advanced'),

('Goblet Squat', 'Goblet Squat', 'knee_dominant_bilateral',
 array['quadriceps','glutes'], array['core','upper_back'],
 array['all_sports'], array['kettlebell','dumbbell'], 'absolute_kg', false, 'beginner'),

('Leg Press', 'Bacak Presi', 'knee_dominant_bilateral',
 array['quadriceps','glutes'], array['hamstrings'],
 array['all_sports'], array['leg_press_machine'], 'absolute_kg', false, 'beginner'),

('Hack Squat', 'Hack Squat', 'knee_dominant_bilateral',
 array['quadriceps'], array['glutes','hamstrings'],
 array['all_sports'], array['hack_squat_machine','barbell'], 'absolute_kg', false, 'intermediate'),

('Leg Extension', 'Bacak Uzatma', 'knee_dominant_bilateral',
 array['quadriceps'], array[]::text[],
 array['all_sports'], array['leg_extension_machine'], 'absolute_kg', false, 'beginner'),

('Box Squat', 'Kutu Squat', 'knee_dominant_bilateral',
 array['quadriceps','glutes'], array['hamstrings','lower_back'],
 array['all_sports'], array['barbell','box'], 'absolute_kg', false, 'intermediate'),

('Zercher Squat', 'Zercher Squat', 'knee_dominant_bilateral',
 array['quadriceps','glutes'], array['core','upper_back','biceps'],
 array['combat','weightlifting'], array['barbell'], 'absolute_kg', false, 'advanced'),

-- ========================
-- KNEE DOMINANT UNILATERAL (8)
-- ========================
('Bulgarian Split Squat', 'Bulgar Split Squat', 'knee_dominant_unilateral',
 array['quadriceps','glutes'], array['hamstrings','hip_flexors','core'],
 array['all_sports','athletics'], array['dumbbell','barbell','bench'], 'absolute_kg', true, 'intermediate'),

('Lunge', 'Akciğer', 'knee_dominant_unilateral',
 array['quadriceps','glutes'], array['hamstrings','core'],
 array['all_sports'], array['bodyweight','dumbbell','barbell'], 'absolute_kg', true, 'beginner'),

('Step-Up', 'Adım Çıkma', 'knee_dominant_unilateral',
 array['quadriceps','glutes'], array['hamstrings','core'],
 array['all_sports','athletics'], array['box','dumbbell'], 'absolute_kg', true, 'beginner'),

('Pistol Squat', 'Tabanca Squat', 'knee_dominant_unilateral',
 array['quadriceps','glutes'], array['hamstrings','core'],
 array['gymnastics','all_sports'], array['bodyweight'], 'bodyweight', true, 'advanced'),

('Reverse Lunge', 'Geri Akciğer', 'knee_dominant_unilateral',
 array['quadriceps','glutes'], array['hamstrings','core'],
 array['all_sports'], array['bodyweight','dumbbell'], 'absolute_kg', true, 'beginner'),

('Lateral Lunge', 'Yan Akciğer', 'knee_dominant_unilateral',
 array['quadriceps','adductors','glutes'], array['hamstrings','core'],
 array['all_sports','team_sports'], array['bodyweight','dumbbell'], 'absolute_kg', true, 'beginner'),

('Walking Lunge', 'Yürüyüş Akciğer', 'knee_dominant_unilateral',
 array['quadriceps','glutes'], array['hamstrings','core'],
 array['all_sports','athletics'], array['bodyweight','dumbbell','barbell'], 'absolute_kg', true, 'intermediate'),

('Single-Leg Press', 'Tek Bacak Pres', 'knee_dominant_unilateral',
 array['quadriceps','glutes'], array['hamstrings'],
 array['all_sports'], array['leg_press_machine'], 'absolute_kg', true, 'intermediate'),

-- ========================
-- ROTATION (8)
-- ========================
('Cable Woodchop', 'Kablo Odun Kesme', 'rotation',
 array['obliques','core'], array['shoulders','hip_flexors'],
 array['all_sports','combat','team_sports'], array['cable'], 'absolute_kg', false, 'intermediate'),

('Medicine Ball Rotational Throw', 'Tıp Topu Rotasyon Atışı', 'rotation',
 array['obliques','core'], array['shoulders','hips'],
 array['all_sports','athletics','combat'], array['medicine_ball','wall'], 'absolute_kg', false, 'intermediate'),

('Pallof Press', 'Pallof Press', 'anti_rotation',
 array['obliques','core'], array['shoulders'],
 array['all_sports'], array['cable'], 'absolute_kg', false, 'beginner'),

('Russian Twist', 'Rus Dönüşü', 'rotation',
 array['obliques'], array['rectus_abdominis'],
 array['all_sports'], array['bodyweight','medicine_ball'], 'bodyweight', false, 'beginner'),

('Landmine Rotation', 'Landmine Rotasyonu', 'rotation',
 array['obliques','core'], array['shoulders','hips'],
 array['all_sports'], array['barbell','landmine'], 'absolute_kg', false, 'intermediate'),

('Cable Chop', 'Kablo Kıyıcı', 'rotation',
 array['obliques','core'], array['shoulders','hip_flexors'],
 array['all_sports','team_sports'], array['cable'], 'absolute_kg', false, 'beginner'),

('Medicine Ball Side Throw', 'Tıp Topu Yan Atış', 'rotation',
 array['obliques','core'], array['shoulders'],
 array['athletics','combat','team_sports'], array['medicine_ball','wall'], 'absolute_kg', false, 'intermediate'),

('Hip Rotation', 'Kalça Rotasyonu', 'rotation',
 array['hip_flexors','obliques'], array['glutes'],
 array['gymnastics','combat','athletics'], array['bodyweight'], 'bodyweight', false, 'beginner'),

-- ========================
-- ANTI-ROTATION (8)
-- ========================
('Plank', 'Plank', 'anti_rotation',
 array['core','transverse_abdominis'], array['glutes','shoulders'],
 array['all_sports'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('Side Plank', 'Yan Plank', 'anti_rotation',
 array['obliques','transverse_abdominis'], array['glutes','shoulders'],
 array['all_sports'], array['bodyweight'], 'duration_sec', true, 'beginner'),

('Dead Bug', 'Ölü Böcek', 'anti_rotation',
 array['transverse_abdominis','core'], array['hip_flexors','shoulders'],
 array['all_sports','gymnastics'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('Bird Dog', 'Köpek Kuş', 'anti_rotation',
 array['core','glutes'], array['lower_back','shoulders'],
 array['all_sports'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('Ab Wheel Rollout', 'Ab Wheel', 'anti_rotation',
 array['core','transverse_abdominis'], array['latissimus_dorsi','shoulders'],
 array['all_sports'], array['ab_wheel'], 'bodyweight', false, 'advanced'),

('Stir the Pot', 'Tencere Karıştırma', 'anti_rotation',
 array['core','transverse_abdominis'], array['shoulders'],
 array['all_sports'], array['stability_ball'], 'duration_sec', false, 'intermediate'),

('Hollow Body Hold', 'İçi Boş Gövde', 'anti_rotation',
 array['core','hip_flexors'], array['transverse_abdominis'],
 array['gymnastics','all_sports'], array['bodyweight'], 'duration_sec', false, 'intermediate'),

('Copenhagen Plank', 'Kopenhag Plankı', 'anti_rotation',
 array['adductors','obliques'], array['core','hip_flexors'],
 array['all_sports','team_sports'], array['bodyweight','bench'], 'duration_sec', true, 'advanced'),

-- ========================
-- JUMP & LAND (10)
-- ========================
('Box Jump', 'Kutu Zıplaması', 'jump_land',
 array['quadriceps','glutes','calves'], array['hamstrings','core'],
 array['all_sports','athletics'], array['box'], 'bodyweight', false, 'intermediate'),

('Countermovement Jump (CMJ)', 'CMJ', 'jump_land',
 array['quadriceps','glutes','calves'], array['hamstrings','core'],
 array['all_sports'], array['bodyweight'], 'bodyweight', false, 'beginner'),

('Squat Jump', 'Squat Zıplaması', 'jump_land',
 array['quadriceps','glutes','calves'], array['hamstrings'],
 array['all_sports','athletics'], array['bodyweight'], 'bodyweight', false, 'intermediate'),

('Depth Jump', 'Derinlik Zıplaması', 'jump_land',
 array['quadriceps','glutes','calves'], array['hamstrings','core'],
 array['athletics','gymnastics','trampoline'], array['box'], 'bodyweight', false, 'advanced'),

('Broad Jump', 'Uzun Atlama', 'jump_land',
 array['quadriceps','glutes','calves'], array['hamstrings','core'],
 array['all_sports','athletics'], array['bodyweight'], 'bodyweight', false, 'intermediate'),

('Hurdle Jump', 'Engel Zıplaması', 'jump_land',
 array['quadriceps','glutes','calves'], array['hamstrings','core'],
 array['athletics','gymnastics','trampoline'], array['hurdle'], 'bodyweight', false, 'intermediate'),

('Single-Leg Box Jump', 'Tek Bacak Kutu Zıplaması', 'jump_land',
 array['quadriceps','glutes','calves'], array['hamstrings','core'],
 array['all_sports','athletics'], array['box'], 'bodyweight', true, 'advanced'),

('Lateral Box Jump', 'Yan Kutu Zıplaması', 'jump_land',
 array['glutes','quadriceps','abductors'], array['calves','core'],
 array['team_sports','athletics'], array['box'], 'bodyweight', false, 'intermediate'),

('Tuck Jump', 'Diz Çekme Zıplaması', 'jump_land',
 array['quadriceps','glutes','hip_flexors'], array['calves','core'],
 array['gymnastics','trampoline','athletics'], array['bodyweight'], 'bodyweight', false, 'intermediate'),

('Rebound Jump', 'Geri Sekme Zıplaması', 'jump_land',
 array['calves','quadriceps'], array['glutes','hamstrings'],
 array['gymnastics','trampoline','athletics'], array['bodyweight'], 'bodyweight', false, 'advanced'),

-- ========================
-- LOCOMOTION (8)
-- ========================
('Sprint', 'Sprint', 'locomotion',
 array['quadriceps','hamstrings','glutes'], array['calves','core','hip_flexors'],
 array['all_sports','athletics'], array['track'], 'distance_m', false, 'intermediate'),

('Sled Push', 'Kızak İtme', 'locomotion',
 array['quadriceps','glutes','calves'], array['shoulders','core','hamstrings'],
 array['all_sports','athletics'], array['sled'], 'absolute_kg', false, 'intermediate'),

('Sled Pull', 'Kızak Çekme', 'locomotion',
 array['hamstrings','glutes','calves'], array['lower_back','core'],
 array['all_sports','athletics'], array['sled'], 'absolute_kg', false, 'intermediate'),

('Shuttle Run', 'Mekik Koşusu', 'locomotion',
 array['quadriceps','hamstrings','calves'], array['glutes','core'],
 array['team_sports','athletics'], array['cones'], 'duration_sec', false, 'intermediate'),

('Prowler Push', 'Prowler İtme', 'locomotion',
 array['quadriceps','glutes'], array['shoulders','core'],
 array['all_sports'], array['prowler'], 'absolute_kg', false, 'intermediate'),

('Farmer Walk', 'Çiftçi Yürüyüşü', 'locomotion',
 array['trapezius','forearms','core'], array['glutes','hamstrings','calves'],
 array['all_sports'], array['dumbbell','kettlebell'], 'absolute_kg', false, 'intermediate'),

('Lateral Shuffle', 'Yan Shuffle', 'locomotion',
 array['glutes','abductors','quadriceps'], array['calves','core'],
 array['team_sports','athletics'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('Bear Crawl', 'Ayı Yürüyüşü', 'locomotion',
 array['core','shoulders','quadriceps'], array['triceps','hip_flexors'],
 array['gymnastics','all_sports'], array['bodyweight'], 'distance_m', false, 'intermediate'),

-- ========================
-- CORE STABILITY (8)
-- ========================
('Hanging Leg Raise', 'Asılı Bacak Kaldırma', 'core_stability',
 array['hip_flexors','rectus_abdominis'], array['core','latissimus_dorsi'],
 array['gymnastics','all_sports'], array['pull_up_bar'], 'bodyweight', false, 'intermediate'),

('L-Sit', 'L-Oturma', 'core_stability',
 array['hip_flexors','rectus_abdominis'], array['triceps','core'],
 array['gymnastics'], array['parallel_bars','rings','floor'], 'duration_sec', false, 'advanced'),

('V-Up', 'V-Kalkış', 'core_stability',
 array['rectus_abdominis','hip_flexors'], array['obliques'],
 array['gymnastics','all_sports'], array['bodyweight'], 'bodyweight', false, 'intermediate'),

('Toes to Bar', 'Ayak Uçlarını Bara', 'core_stability',
 array['hip_flexors','rectus_abdominis'], array['latissimus_dorsi','obliques'],
 array['gymnastics','all_sports'], array['pull_up_bar'], 'bodyweight', false, 'advanced'),

('Cable Crunch', 'Kablo Karın Kasılması', 'core_stability',
 array['rectus_abdominis'], array['obliques'],
 array['all_sports'], array['cable'], 'absolute_kg', false, 'beginner'),

('Reverse Crunch', 'Ters Karın Kasılması', 'core_stability',
 array['rectus_abdominis','hip_flexors'], array['transverse_abdominis'],
 array['all_sports'], array['bodyweight','bench'], 'bodyweight', false, 'beginner'),

('Dragon Flag', 'Ejderha Bayrağı', 'core_stability',
 array['rectus_abdominis','core'], array['hip_flexors','lower_back'],
 array['gymnastics','combat'], array['bench'], 'bodyweight', false, 'advanced'),

('Planche Lean', 'Planche Eğilimi', 'core_stability',
 array['core','anterior_deltoid'], array['triceps','wrist_extensors'],
 array['gymnastics'], array['parallel_bars','floor'], 'duration_sec', false, 'advanced'),

-- ========================
-- LOADED CARRY (8)
-- ========================
('Suitcase Carry', 'Bavul Taşıma', 'loaded_carry',
 array['obliques','core'], array['trapezius','glutes','forearms'],
 array['all_sports'], array['dumbbell','kettlebell'], 'absolute_kg', true, 'beginner'),

('Bottoms-Up Carry', 'Tersyüz Taşıma', 'loaded_carry',
 array['rotator_cuff','core'], array['trapezius','forearms'],
 array['all_sports'], array['kettlebell'], 'absolute_kg', true, 'intermediate'),

('Overhead Carry', 'Baş Üstü Taşıma', 'loaded_carry',
 array['deltoid','core','trapezius'], array['triceps','forearms'],
 array['weightlifting','all_sports'], array['barbell','dumbbell','kettlebell'], 'absolute_kg', true, 'intermediate'),

('Trap Bar Carry', 'Trap Bar Taşıma', 'loaded_carry',
 array['trapezius','forearms','core'], array['glutes','hamstrings'],
 array['all_sports'], array['trap_bar'], 'absolute_kg', false, 'intermediate'),

('Rack Position Carry', 'Rack Pozisyon Taşıma', 'loaded_carry',
 array['core','upper_back'], array['biceps','trapezius'],
 array['all_sports'], array['kettlebell','dumbbell'], 'absolute_kg', true, 'beginner'),

('Sandbag Carry', 'Kum Torbası Taşıma', 'loaded_carry',
 array['core','trapezius'], array['glutes','hamstrings','forearms'],
 array['combat','all_sports'], array['sandbag'], 'absolute_kg', false, 'intermediate'),

('Cross-Body Carry', 'Çapraz Taşıma', 'loaded_carry',
 array['obliques','core'], array['trapezius','forearms'],
 array['all_sports'], array['dumbbell','kettlebell'], 'absolute_kg', true, 'intermediate'),

('Yoke Carry', 'Boyunduruk Taşıma', 'loaded_carry',
 array['trapezius','core','quadriceps'], array['glutes','calves'],
 array['weightlifting','all_sports'], array['yoke'], 'absolute_kg', false, 'advanced'),

-- ========================
-- SPORT SPECIFIC (10)
-- ========================
('Power Clean', 'Power Temiz Çekiş', 'sport_specific',
 array['hamstrings','glutes','trapezius'], array['quadriceps','calves','core'],
 array['weightlifting','athletics'], array['barbell'], 'absolute_kg', false, 'advanced'),

('Hang Power Clean', 'Askı Power Temiz Çekiş', 'sport_specific',
 array['hamstrings','glutes','trapezius'], array['quadriceps','calves','core'],
 array['weightlifting','athletics','all_sports'], array['barbell'], 'absolute_kg', false, 'intermediate'),

('Power Snatch', 'Power Snatch', 'sport_specific',
 array['hamstrings','glutes','trapezius','deltoid'], array['quadriceps','calves','core'],
 array['weightlifting'], array['barbell'], 'absolute_kg', false, 'advanced'),

('Med Ball Slam', 'Tıp Topu Vuruşu', 'sport_specific',
 array['core','deltoid','latissimus_dorsi'], array['triceps','hamstrings'],
 array['all_sports','combat'], array['medicine_ball'], 'absolute_kg', false, 'beginner'),

('Battle Rope Waves', 'Savaş İpi Dalgaları', 'sport_specific',
 array['deltoid','core'], array['biceps','forearms','trapezius'],
 array['all_sports','combat'], array['battle_rope'], 'duration_sec', false, 'intermediate'),

('Tire Flip', 'Lastik Çevirme', 'sport_specific',
 array['glutes','hamstrings','quadriceps'], array['shoulders','core','trapezius'],
 array['combat','athletics'], array['tire'], 'bodyweight', false, 'advanced'),

('Rope Climb', 'İp Tırmanma', 'sport_specific',
 array['latissimus_dorsi','biceps'], array['core','forearms'],
 array['gymnastics','combat'], array['rope'], 'bodyweight', false, 'advanced'),

('Reactive Agility Drill', 'Reaktif Çeviklik Drili', 'sport_specific',
 array['quadriceps','glutes','calves'], array['hamstrings','core'],
 array['all_sports','team_sports'], array['cones','agility_ladder'], 'duration_sec', false, 'intermediate'),

('Medicine Ball Chest Pass', 'Tıp Topu Göğüs Atışı', 'sport_specific',
 array['pectoralis_major','triceps'], array['anterior_deltoid','core'],
 array['team_sports','athletics'], array['medicine_ball','wall'], 'absolute_kg', false, 'beginner'),

('Resisted Sprint', 'Dirençli Sprint', 'sport_specific',
 array['quadriceps','hamstrings','glutes'], array['calves','hip_flexors','core'],
 array['athletics','team_sports'], array['sled','resistance_band'], 'absolute_kg', false, 'intermediate'),

-- ========================
-- MOBILITY & FLEXIBILITY (10)
-- ========================
('Hip 90/90 Stretch', 'Kalça 90/90 Germe', 'mobility_flexibility',
 array['hip_external_rotators','hip_internal_rotators'], array['glutes','adductors'],
 array['all_sports'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('World''s Greatest Stretch', 'Dünyanın En İyi Gerilmesi', 'mobility_flexibility',
 array['hip_flexors','thoracic_spine'], array['glutes','hamstrings','shoulders'],
 array['all_sports'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('Couch Stretch', 'Koltuk Gerilmesi', 'mobility_flexibility',
 array['hip_flexors','quadriceps'], array['glutes'],
 array['all_sports'], array['bodyweight','wall'], 'duration_sec', true, 'beginner'),

('Thoracic Extension on Foam Roller', 'Torasik Ekstansiyon', 'mobility_flexibility',
 array['thoracic_spine'], array['upper_back'],
 array['all_sports'], array['foam_roller'], 'duration_sec', false, 'beginner'),

('Pigeon Pose', 'Güvercin Pozu', 'mobility_flexibility',
 array['hip_external_rotators','glutes'], array['hip_flexors'],
 array['gymnastics','all_sports'], array['bodyweight'], 'duration_sec', true, 'beginner'),

('Ankle Mobility Drill', 'Ayak Bileği Mobilitesi', 'mobility_flexibility',
 array['calves','soleus'], array['ankle_stabilizers'],
 array['all_sports'], array['bodyweight','wall'], 'duration_sec', true, 'beginner'),

('Deep Squat Hold', 'Derin Squat Tutma', 'mobility_flexibility',
 array['hip_flexors','adductors'], array['glutes','ankles','thoracic_spine'],
 array['all_sports'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('Shoulder CARs', 'Omuz Rotasyon', 'mobility_flexibility',
 array['rotator_cuff','deltoid'], array['scapular_stabilizers'],
 array['all_sports','gymnastics'], array['bodyweight'], 'duration_sec', true, 'beginner'),

('Hamstring Floss', 'Hamstring Mobilitesi', 'mobility_flexibility',
 array['hamstrings'], array['calves','lower_back'],
 array['all_sports'], array['bodyweight'], 'duration_sec', false, 'beginner'),

('Hip Flexor Lunge Stretch', 'Kalça Fleksör Gerilmesi', 'mobility_flexibility',
 array['hip_flexors','quadriceps'], array['glutes'],
 array['all_sports','athletics'], array['bodyweight'], 'duration_sec', true, 'beginner');

-- =============================================
-- TGF ORG KATEGORİLERİ
-- =============================================

insert into org_exercise_categories
  (org_id, name, name_tr, description, color, icon)
select
  o.id,
  cat.name,
  cat.name_tr,
  cat.description,
  cat.color,
  cat.icon
from organizations o,
(values
  ('gymnastics_specific', 'Jimnastiğe Özgü',
   'Jimnastik sporuna özel temel beceriler ve güç egzersizleri',
   '#534AB7', 'star'),
  ('artistic_skills', 'Artistik Beceriler',
   'Artistik jimnastik teknik becerileri (takla, uçuş, bağlantı)',
   '#0F6E56', 'award'),
  ('rhythmic_skills', 'Ritmik Beceriler',
   'Ritmik jimnastik becerileri ve aletli kombinasyonlar',
   '#993C1D', 'music'),
  ('trampoline_skills', 'Trampolin Becerileri',
   'Trampolin ve tumbling becerileri',
   '#185FA5', 'arrow-up'),
  ('prehab_rehab', 'Prehab / Rehab',
   'Yaralanma önleme ve rehabilitasyon egzersizleri',
   '#854F0B', 'heart')
) as cat(name, name_tr, description, color, icon)
where o.slug = 'tgf';
