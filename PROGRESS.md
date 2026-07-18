# AthleteIQ — Proje Durumu

> Son güncelleme: 2026-07-18 (**Parti 2.2.B — session_rpe şeması (atıl, Parti 6/7'de bağlanacak)** — `training_sessions.session_rpe` kolonu eklendi, cloud'a push edildi ve doğrulandı. Detay: § Parti 2.2.B)
> Önceki: 2026-07-18 (**Parti 2.1 — exercise_sets şeması** — set bazlı yoğunluk takibi için yeni tablo + RLS, cloud'a push edildi ve doğrulandı. Detay: § Parti 2.1)
> Önceki: 2026-07-15 (**Mobil donma çözüldü** — css-interop `printUpgradeWarning` deep-stringify HANG'i patch'lendi; Program ekranı + 4 tab cihazda çalışıyor. Realtime publication boştu, dolduruldu. Detay: § Bilinen Sorunlar #4)
> Son commit: `14562dd` — 2026-07-01
> Bu dosya her session başında okunmalı. CLAUDE.md ile birlikte projenin hafızasıdır.

---

## Tamamlanan Özellikler

### Veritabanı (Agent 1 — DB Agent) ✅
- `supabase/migrations/007_trial.sql` — Trial sütunları (trial_ends_at, plan_status, owner_id) + `org_trial_status` view — **uygulandı** (2026-06-29)
- `supabase/migrations/001_schema.sql` — Tüm core tablolar
- `supabase/migrations/002_rls.sql` — Row Level Security politikaları
- `supabase/migrations/003_functions.sql` — Helper fonksiyonlar (my_role, my_team_id, is_super_admin, calculate_acwr, get_athlete_programs)
- `supabase/migrations/004_wearables.sql` — Wearable tabloları + athlete_push_tokens
- `supabase/migrations/005_exercises.sql` — Egzersiz kütüphanesi tabloları + RLS (platform_exercises, org_exercise_categories, org_exercises, athlete_1rm_records)
- `supabase/migrations/006_exercise_seed.sql` — 135 platform egzersizi (16 hareket paterninden) + TGF için 5 org kategorisi
- `supabase/seed.sql` — Başlangıç test verisi
- `packages/db/types.ts` — Supabase'den üretilmiş TypeScript tipleri
- `packages/db/queries/` — athletes, programs, acwr, competitions, tests, wearables, teams, memberships, **exercises** sorguları

### Parti 2.2.B — session_rpe şeması (atıl, Parti 6/7'de bağlanacak) ✅ (2026-07-18)
- `supabase/migrations/016_session_rpe.sql` — `training_sessions.session_rpe` (smallint, null, `CHECK between 1 and 10`), additive. Şu an hiçbir UI'dan doldurulmuyor, `acwr_logs`/`acwr-client.tsx` mekanizmasına bağlanmıyor — bağlantı Parti 6 (ACWR/Readiness birleştirme) ve Parti 7 (mobil "yaptım" akışı) kapsamında yapılacak.
- Local'de `supabase migration up` ile test edildi, cloud'a (`nlmwcygmbbxmfpsubvmh`) `supabase db push` ile uygulandı. `migration list` Local=Remote (016 dahil).
- Cloud doğrulaması (`information_schema` + `pg_constraint`): kolon `smallint`/nullable, CHECK constraint `(session_rpe >= 1) AND (session_rpe <= 10)`, kolon yorumu mevcut.
- `pnpm --filter web build` temiz geçti (yalnızca önceden var olan lint uyarıları, migration'la ilgisiz) — beklenen sonuç, çünkü hiçbir UI bu kolonu henüz okumuyor/yazmıyor.

### Parti 2.1 — exercise_sets şeması ✅ (2026-07-18)
- `supabase/migrations/014_exercise_sets.sql` — set bazlı yoğunluk takibi. Tamamen ADDITIVE:
  - **exercise_sets** tablosu: `exercise_id` (FK cascade) + `set_number` (unique birlikte), `reps`, `duration_sec`, `load_kg`, `percent_1rm`, `rpe`, `is_bodyweight`, `band_resistance`, `created_at`.
  - RLS: `exercises_select`/`exercises_write` (002_rls.sql) ile birebir aynı mantık, `exercise_id` üzerinden bir join hop'u fazla.
  - `exercises.completed_at` ve `training_sessions.athlete_session_notes` eklendi (her ikisi de null, henüz UI/RLS yazma yolu yok — bilinçli, Parti 2.2'de).
  - Eski kolonlar (`sets`, `reps`, `duration_sec`, `load_kg`, `load_percent`, `load_percent_1rm`, `rpe_target`) SİLİNMEDİ, `DEPRECATED` yorumu eklendi — UI (Parti 2.2) geçene kadar paralel yaşıyor.
  - Veri migration'ı: 5 mevcut `exercises` satırı → 13 `exercise_sets` satırı (`SUM(sets)` ile birebir). Cloud'da doğrulandı (satır sayısı + örnek satır karşılaştırması).
  - RLS doğrulaması: İBRAHİM ÇOLAK hesabıyla simülasyon (gerçek login değil — `set local request.jwt.claims`) → kendi takımının (Hipertrofi + "aaaaaaaaaaa" programları) 7 set'ini görüyor, diğer takımın published programındaki ("asdasdasd", Arnold Press + Ayı Yürüyüşü, 6 set) hiçbirini görmüyor. İzolasyon çalışıyor.
  - `pnpm --filter web build` temiz geçti (sadece önceden var olan lint uyarıları, migration'la ilgisiz).
- **Not — "yukarıdaki şema" bulunamadı:** Görev talimatı exercise_sets için önceden verilmiş bir şemaya atıfta bulunuyordu ama bu konuşmada/repoda öyle bir şema yoktu (muhtemelen özetlenmiş/düşmüş bir önceki mesaj). Şema, veri migration adımındaki alan listesinden (reps/duration_sec/load_kg/percent_1rm/rpe/is_bodyweight/band_resistance) ve mevcut `exercises` kolon tipleriyle birebir eşleştirilerek yeniden inşa edildi. **Kullanıcı doğrulamalı** — özellikle `band_resistance` (text seçildi, mevcut veride örnek yok) ve `created_at` dışında bookkeeping kolonu eklenmediği (updated_at yok, `exercises` da yok çünkü).
- **Yan bulgu 1 (düzeltildi):** `006_exercise_seed.sql:249` — `array[]` tip cast'i olmadan kullanılmış ("Leg Extension" secondary_muscles), fresh `supabase db reset`'i `ERROR: cannot determine type of empty array (42P18)` ile kırıyordu. `array[]::text[]` yapıldı. Cloud etkilenmedi (135 satır zaten doğruydu, migration remote'ta zaten "applied" işaretli — push bu dosyayı tekrar çalıştırmaz).
- **Yan bulgu 2 (DÜZELTİLMEDİ — karar bekliyor):** `008_rls_signup.sql` ve `009_security_fixes.sql`, `organizations.owner_id`/`plan_status`/`trial_ends_at` kolonlarına referans veriyor ama bu kolonlar ancak `010_trial.sql`'de ekleniyor. Fresh `db reset` bu yüzden 008'de `column "owner_id" does not exist` ile patlıyor (remote etkilenmiyor — gerçek tarihsel apply sırası farklıydı, PARTİ 3'ün migration repair'i bunu gizledi). Local'de sadece elle önden kolon ekleyip `migration up` ile atlatıldı, dosyalar değiştirilmedi. Kalıcı çözüm (numaraları kaydırmak / ara migration eklemek) migration geçmişini etkileyeceğinden burada yapılmadı — talimat isterse ayrı bir görev olarak ele alınmalı.

### Self-Serve Signup & Trial Sistemi ✅ (2026-06-29)
- `apps/web/app/(auth)/signup/page.tsx` + `signup-form.tsx` — 4 adımlı kayıt akışı (hesap → org → takım → tebrikler)
- `apps/web/components/shared/marketing-shell.tsx` — Paylaşılan marketing kabuğu (nav + footer). **PARTİ 4:** landing artık layout dosyasını component gibi import etmiyor; hem `(marketing)/layout.tsx` hem landing bu shell'i kullanıyor.
- `apps/web/app/(marketing)/layout.tsx` — Next.js marketing layout (yalnızca `MarketingShell`'i render eder, sidebar yok)
- `apps/web/app/page.tsx` — Kök route: giriş yoksa `LandingPage` render eder, girişte role'e göre yönlendirir
- `apps/web/components/features/landing/landing-page.tsx` — Landing page içeriği (hero, features, pricing, CTA) — `MarketingShell` ile sarılı
- `apps/web/app/(marketing)/demo/page.tsx` — Demo talep formu
- `apps/web/app/api/demo-request/route.ts` — Demo talebi API (Resend ile email)
- `apps/web/components/shared/trial-banner.tsx` — Trial banner (mavi/sarı/kırmızı durumlu)
- `apps/web/components/shared/trial-banner-wrapper.tsx` — Server wrapper (cookie'den org_id okur)
- `apps/web/app/(dashboard)/layout.tsx` — TrialBannerWrapper eklendi
- `apps/web/middleware.ts` — `/signup`, `/demo` public route'lara eklendi
- `apps/web/app/page.tsx` — Giriş yapılmamışsa landing page göster

### Kimlik Doğrulama (Agent 2 — Auth Agent) ✅
- `apps/web/middleware.ts` — Route koruması + membership cookie cache (8 saat, `aiq_uid` ile kullanıcıya bağlı — bayat rol miras etmez). **LOGOUT GUARD FIX (2026-07-01):** athlete rol guard'ına `/auth/*` muafiyeti eklendi — auth route'ları (`/auth/logout`, `/auth/confirm`, `/auth/callback`) rol redirect'inden muaf. Parti 1'in yan etkisi olarak athlete `/auth/logout`'a gidince `/programs`'a geri atılıyordu (çıkış yapamıyordu); artık logout çalışıyor.
- `apps/web/app/auth/logout/route.ts` — Server-side logout (signOut + httpOnly aiq_* cookie temizliği)
- `apps/web/lib/supabase/client.ts` — Client component Supabase client
- `apps/web/lib/supabase/server.ts` — Server component Supabase client
- `apps/web/lib/hooks/useUserContext.ts` — Role + org + team hook
- `apps/web/app/(auth)/login/page.tsx` + `login-form.tsx` — Giriş sayfası
- `apps/web/app/(auth)/invite/[token]/page.tsx` — Davet kabul sayfası
- `apps/web/app/api/auth/invite/route.ts` — Davet oluşturma API endpoint
- `apps/web/app/auth/callback/route.ts` — OAuth callback
- `packages/validators/auth.ts` — Login + davet Zod şemaları

### Web Paneli (Agent 3 — Web Agent) ✅
- `apps/web/app/(dashboard)/layout.tsx` — Sidebar + header layout
- `apps/web/app/(dashboard)/athletes/` — Sporcu listesi (arama, filtre) + detay sayfası
- `apps/web/app/(dashboard)/programs/` — Program listesi, yeni program oluşturma, program detay, program düzenleme (`[id]/edit/`). **PARTİ 4:** egzersiz satırlarına yük tipi seçici (kg / %1RM / RPE → `load_type`/`load_kg`/`load_percent_1rm`/`rpe_target`) eklendi; new + edit builder + detay görünümü eşitlendi (edit delete-reinsert yaptığından veriyi korur).
- `apps/web/app/(dashboard)/acwr/` — ACWR dashboard
- `apps/web/app/(dashboard)/competitions/` — Yarışma listesi
- `apps/web/app/(dashboard)/tests/` — Test sonuçları (server + `tests-client.tsx`, atletik performans CRUD: 7 kategori/31 test tipi, kademeli dropdown, trend kolonu, filtreler) ✅ gerçekten tamamlandı (2026-07-01, Bug Partİ 2)
- `apps/web/app/(dashboard)/wearables/` — Wearable bağlantı durumu (server + `wearables-client.tsx`, 3 özet kartı, durum tablosu, filtreler; "Bağla" disabled — entegrasyon yakında) ✅ gerçekten tamamlandı (2026-07-01, Bug Partİ 2)
- `apps/web/app/(dashboard)/settings/` — Org ayarları (admin only)
- `apps/web/app/(dashboard)/exercises/` — Egzersiz kütüphanesi (platform + org, tam CRUD)
- `apps/web/app/admin/` — Super admin paneli
- `apps/web/components/shared/header.tsx` + `sidebar.tsx` — Layout bileşenleri (Egzersizler linki eklendi)
- `apps/web/components/features/athletes/add-athlete-modal.tsx` — Sporcu ekleme
- `apps/web/components/features/exercises/` — create-exercise-modal, edit-exercise-modal, create-category-modal, fork-exercise-modal, exercise-picker-modal (bug fix: type="button"), delete-confirm-dialog
- `apps/web/components/ui/` — shadcn/ui bileşenleri (badge, button, card, dialog, input, label, select, separator, skeleton, table, textarea)

### Mobil Uygulama (Agent 4 — Mobile Agent) ✅
- `apps/mobile/app/_layout.tsx` — Root layout
- `apps/mobile/app/index.tsx` — Root redirect
- `apps/mobile/app/(auth)/login.tsx` — Giriş ekranı
- `apps/mobile/app/(tabs)/_layout.tsx` — Bottom tab navigator
- `apps/mobile/app/(tabs)/program/index.tsx` — Haftalık program görünümü
- `apps/mobile/app/(tabs)/program/[day].tsx` — Günlük egzersiz detayı
- `apps/mobile/app/(tabs)/recovery/index.tsx` — Recovery ekranı
- `apps/mobile/app/(tabs)/competitions/index.tsx` — Yarışmalar
- `apps/mobile/app/(tabs)/profile/index.tsx` — Profil
- `apps/mobile/app/(tabs)/profile/connect-whoop.tsx` — WHOOP bağlantı
- `apps/mobile/app/(tabs)/profile/connect-polar.tsx` — Polar bağlantı
- `apps/mobile/lib/supabase.ts` — Expo uyumlu Supabase client
- `apps/mobile/lib/notifications.ts` — Push notification
- `apps/mobile/lib/hooks/useAthleteProfile.ts` — Profil hook
- `apps/mobile/components/ExerciseCard.tsx` — Egzersiz kartı

### Wearable Altyapısı (Agent 5 — Integration Agent) ✅ (altyapı hazır, aktif sync yok)
- `packages/integrations/whoop/` — client, oauth, types, normalize, transaction
- `packages/integrations/polar/` — client, oauth, types, normalize
- `supabase/functions/whoop-webhook/index.ts` — WHOOP webhook receiver (deploy edilmedi)
- `supabase/functions/polar-sync/index.ts` — Polar sync (deploy edilmedi)
- `supabase/functions/invite-member/index.ts` — Davet email gönderici (deploy edilmedi)

### Paylaşılan Paketler ✅
- `packages/db/` — DB tip tanımları ve query fonksiyonları
- `packages/ui/` — Paylaşılan UI bileşenleri (button, card, badge, input, label, skeleton)
- `packages/validators/` — Zod şemaları (auth, athlete, program, acwr, team)

---

## Veritabanı Durumu

**Supabase Cloud:** `nlmwcygmbbxmfpsubvmh.supabase.co`

### Uygulanan Migration'lar
| Versiyon | Dosya | Durum |
|----------|-------|-------|
| 001 | schema | ✅ Uygulandı |
| 002 | rls | ✅ Uygulandı |
| 003 | functions | ✅ Uygulandı |
| 004 | wearables | ✅ Uygulandı |
| 005 | exercises | ✅ Uygulandı (superset_group/order kolonları burada) |
| 006 | exercise_seed | ✅ Uygulandı |
| 008 | rls_signup | ✅ Uygulandı |
| 009 | security_fixes | ✅ Uygulandı |
| 010 | trial | ✅ Uygulandı (eski `007_trial.sql`, PARTİ 3'te yeniden adlandırıldı) |
| 011 | realtime | ✅ Uygulandı (2026-07-15 — daha önce elle SQL ile yapılmıştı, migration olarak kayda geçmemişti; AŞAMA 2'de push edildi, idempotent do-block olduğu için etkisiz geçti) |
| 012 | wellness | ✅ Uygulandı (2026-07-15 — Readiness AŞAMA 2 Adım 1: `wellness_checkins` + RLS + realtime) |
| 013 | readiness_scores | ✅ Uygulandı (2026-07-15 — ŞEMA only, motor sonraki iterasyon) |
| 014 | exercise_sets | ✅ Uygulandı (2026-07-18 — Parti 2.1, set bazlı yoğunluk takibi, additive) |
| 015 | exercise_sets_fixes | ✅ Uygulandı (2026-07-18 — Parti 2.1 doğrulama düzeltmeleri: `notes` kolonu + `band_resistance` CHECK) |
| 016 | session_rpe | ✅ Uygulandı (2026-07-18 — Parti 2.2.B, `training_sessions.session_rpe`, atıl/additive) |

> **PARTİ 3 not:** `007_superset_columns.sql` silindi (005 zaten kapsıyor). Local dosya adları cloud geçmişindeki timestamp-prefix'lerle sapmıştı — kullanıcı onayıyla `supabase migration repair` çalıştırıldı (6 timestamp `reverted`, local 005/006/008/009/010 `applied`). `migration list` artık tam hizalı (Local = Remote). Şema tarafında etki yok.

### Mevcut Tablolar (RLS aktif, tüm tablolarda)
| Tablo | Satır Sayısı |
|-------|-------------|
| organizations | 1 |
| teams | 4 |
| memberships | 1 |
| athletes | 5 |
| training_programs | 1 |
| training_sessions | 1 |
| exercises | 2 |
| acwr_logs | 1 |
| competitions | 2 |
| competition_results | 0 |
| test_results | 0 |
| platform_exercises | 135 |
| org_exercise_categories | 5 |
| org_exercises | 0 |
| athlete_1rm_records | 0 |
| wearable_connections | 0 |
| wearable_daily_metrics | 0 |
| whoop_cycles | 0 |
| polar_sync_state | 0 |
| athlete_push_tokens | 0 |

### Edge Functions (Cloud'da Deploy Durumu)
- **invite-member** → ✅ Deploy edildi — `https://nlmwcygmbbxmfpsubvmh.supabase.co/functions/v1/invite-member`
- **whoop-webhook** → ✅ Deploy edildi — `https://nlmwcygmbbxmfpsubvmh.supabase.co/functions/v1/whoop-webhook`
- **polar-sync** → ✅ Deploy edildi — `https://nlmwcygmbbxmfpsubvmh.supabase.co/functions/v1/polar-sync`
- **Secrets:** `NEXT_PUBLIC_APP_URL` set edildi. `RESEND_API_KEY` henüz placeholder — email göndermek için resend.com'dan key alınıp set edilmeli.

---

## Ortam Bilgisi

- **Node:** 24
- **pnpm:** 11.9 (global binary). `package.json` `packageManager` artık `pnpm@11.9.0` ile hizalı. **ÖNEMLİ:** pnpm 11'de `overrides`, `onlyBuiltDependencies` ve `peerDependencyRules` ayarları `pnpm-workspace.yaml`'a taşındı — `package.json`'daki `pnpm` alanı artık okunmuyor. `@types/react` 19.2.17 / `@types/react-dom` 19.2.3 override'ı yaml'da sabit (çift `@types/react` TS2322 çözüldü). `pnpm install` build-script onayı için `onlyBuiltDependencies` (esbuild/sharp/unrs-resolver) kullanır.
- **Supabase Cloud URL:** `https://nlmwcygmbbxmfpsubvmh.supabase.co`

### Başlatma Komutları
```bash
# Web (koç/admin paneli)
pnpm dev --filter="@athleteiq/web"
# → http://localhost:3000

# Mobile (sporcu uygulaması)
pnpm --filter="@athleteiq/mobile" exec expo start --clear
# → Expo Go veya emülatör

# Tüm uygulamalar
pnpm dev

# Lint (PARTİ 3'te kuruldu — ESLint flat config)
pnpm lint                              # turbo lint (tüm paketler)
pnpm --filter="@athleteiq/web" exec eslint .   # yalnızca web (0 error, 21 warning)
```

### Env Dosyaları
- **Web:** `apps/web/.env.local` — Supabase URL + keys, Resend, WHOOP, Polar
- **Mobile:** `apps/mobile/.env` — Expo Supabase URL + anon key

### Test Kullanıcısı
- **Email:** tosunbeytullah9@gmail.com
- **Şifre:** AthleteIQ2026

---

## Bilinen Sorunlar

1. ~~**RESEND_API_KEY eksik**~~ — **KAYIT YANLIŞTI, DÜZELTİLDİ** (2026-07-15, Readiness AŞAMA 2 Adım 0):
   - `RESEND_API_KEY` secret'ta **mevcut** (2026-06-27'de set edilmiş). Bu madde bayattı.
   - **Asıl bulgu: davet e-postasının Resend ile İLGİSİ YOK.** [invite-member/index.ts:81](supabase/functions/invite-member/index.ts#L81) `supabaseAdmin.auth.admin.inviteUserByEmail()` çağırıyor — e-postayı **Supabase Auth'un kendi SMTP'si** gönderiyor. Fonksiyon `RESEND_API_KEY`'e hiç dokunmuyor. Repo genelinde Resend'i kullanan tek yer [demo-request/route.ts](apps/web/app/api/demo-request/route.ts) ve o da `apps/web/.env.local`'den okuyor, Supabase secret'ından değil. Yani Supabase'deki `RESEND_API_KEY` secret'ını şu an **hiçbir kod tüketmiyor**.
   - **Davetin gerçek koşulu:** Supabase Auth → SMTP ayarı. Varsayılan Supabase SMTP yalnızca **proje ekibi üyelerine** gönderir ve saatte ~2 e-posta ile sınırlıdır → gerçek sporcu davetleri için **custom SMTP şart** (Resend burada SMTP sağlayıcısı olarak kullanılabilir, ama bu Dashboard ayarı, Edge Function secret'ı değil).
   - Ayrıca Dashboard → Auth → URL Configuration → Redirect URLs'e `/auth/confirm` eklenmiş olmalı.

2. **🔴 Davet edilen sporcu `athletes` kaydına BAĞLANMIYOR** (2026-07-15'te bulundu) — Davet akışı yalnızca `memberships` satırı oluşturuyor; `athletes.user_id`'yi **hiçbir yerde set etmiyor** (ne [invite-member](supabase/functions/invite-member/index.ts) ne [auth/confirm](apps/web/app/auth/confirm/route.ts)). Sonuç: davet e-postası çalışsa bile sporcu check-in yapamaz — wellness/ACWR RLS'i `athletes.user_id = auth.uid()` üzerinden çalışıyor. Canlı durum: 6 sporcunun 4'ünde `user_id` null; ayrıca İBRAHİM ÇOLAK'ın `user_id`'si var ama **membership'i yok** (ters yönde kopukluk). Readiness katmanının veri üretebilmesi için bu bağın kurulması gerekiyor (davet payload'ına `athlete_id` eklemek veya `/auth/confirm`'de e-posta ile eşleştirmek).

2b. **Admin /dashboard yönlendirme** — Coach rolüyle giriş yapan kullanıcı `/dashboard`'a gitmeye çalışırsa `/athletes`'e yönlendiriliyor (middleware'de tanımlı, beklenen davranış). Ancak `/dashboard` doğrudan admin-only olarak işaretli, bu confusion yaratabilir. → Readiness komuta merkezi bu yüzden `/dashboard`'a değil yeni `/readiness` route'una konacak (READINESS_PLAN.md §5.1).

3. ~~**Realtime aboneliği**~~ — **Tamamlandı** (2026-06-26): `athletes-client.tsx` ve `programs-client.tsx`'e Supabase Realtime eklendi. `is_published=eq.true` filter ile UPDATE event gelince `router.refresh()` + toast notification tetikleniyor.

4. ~~**🔴 Mobile NavigationContainer hatası**~~ — **ÇÖZÜLDÜ** (2026-06-29):
   - **Expo CLI `Body is unusable` bug:** `@expo/cli@54.0.25` cache layer'ı response body stream'ini iki kez tüketiyordu. Fix: `EXPO_NO_CACHE=1` + `cross-env` ile `package.json dev` script'ine eklendi.
   - **Navigation context hatası — GERÇEK kök neden (2026-07-13):** İlk "fix" (`router.replace` → `<Redirect>`) yeterli değildi; hata Adım 2 sonrası geri geldi. İzolasyon teşhisiyle gerçek suçlu bulundu: **`react-native-css-interop@0.2.6`** (NativeWind motoru) `render-component.js` dev-only `stringify` path'i, prop serialize ederken React Navigation'ın throwing getter'ına çarpıp çöküyordu ("navigation context" yan hata idi). **Fix:** `patches/react-native-css-interop@0.2.6.patch` (stringify `try/catch`) + `pnpm-workspace.yaml patchedDependencies`. Cihazda doğrulandı. Detay: MOBILE_STATUS.md + memory `mobile-nav-blocker`. App kodu (Slot + Redirect) orijinal haliyle çalışıyor.
   - **Bonus:** `(tabs)/_layout.tsx` Tabs.Screen name'leri `program/index` → `program` formatına düzeltildi. `program/` ve `profile/` klasörlerine nested `_layout.tsx` eklendi.
   - **🔴 İKİNCİ BUG — DONMA (2026-07-15) — ÇÖZÜLDÜ.** Crash fix'i çökmeyi durdurdu ama **donmayı değil**. Belirti: Program ekranı ilk frame'de donuk (bayat "Henüz program yok"), **tab'lara basınca hiçbir şey olmuyor** — ama JS çalışıyor (fetch `count=2`, React `programs=2` render ediyor). Yani React doğru, **native Fabric surface tek frame sonrası commit etmiyor**.
     - **Kök neden:** aynı dosya — `printUpgradeWarning` → `stringify(originalProps)`. `originalProps.children` = React element ağacı → `_owner`/context üzerinden **Fiber + React Navigation obje grafiğinin tamamı**. try/catch çökmeyi engelledi ama stringify bu devasa grafı **her re-render'da geziyor** → JS thread kilitleniyor → yüzey donuyor, dokunuş işlenmiyor. Sadece dev/Expo Go.
     - **Neden sadece Program?** Sadece haftalık görünüm (7 gün × iç içe dinamik className) css-interop "upgrade" uyarısını tetikleyecek yoğunlukta. Recovery/Yarışmalar/Profil (aynı hook + className + fetch) sorunsuz → navigator, react-native-screens, reanimated, gesture-handler **suçsuz**.
     - **Fix:** `printUpgradeWarning` artık props'u derin stringify etmiyor, sığ `Object.keys()` logluyor. Patch dosyası güncellendi + `pnpm install` ile doğrulandı.
     - **İzolasyon yöntemi:** Program ekranını inline-style minimal sayaç+buton'a indir (çalıştı → navigator sağlam), sonra `programs.length===0` dalını zorla (donma kalktı → suçlu karmaşık render). Ekranda 1sn sayaç + render log: **log'da artıyor ama ekranda artmıyorsa → native donma** (JS değil).

6. ~~**Realtime "Bağlanıyor"da takılı**~~ — **ÇÖZÜLDÜ** (2026-07-15): `supabase_realtime` publication'ı **tamamen boştu** → `postgres_changes` aboneliği asla `SUBSCRIBED` olmuyordu. `training_programs` + `training_sessions` publication'a eklendi.

7. ~~**Mobile 20 TS hatası**~~ — **Geçersiz** (2026-07-15): `@athleteiq/db` zaten `apps/mobile/package.json`'da bildirilmiş; `tsc --noEmit` → **0 hata**. MOBILE_STATUS.md'deki 20-hata iddiası bayattı.

8. **🟡 `acwr_logs` UPDATE politikası eksik** (READINESS_PLAN.md §8.1, kapsam dışı) — `acwr_logs`'ta yalnızca INSERT + SELECT politikası var, ama [packages/db/queries/acwr.ts](packages/db/queries/acwr.ts) `upsert(onConflict: "athlete_id,log_date")` kullanıyor. Upsert çakışınca UPDATE'e döner → politika olmadığı için RLS reddeder → **aynı güne ikinci ACWR logu sessizce başarısız oluyor**. Tabloda 1 satır olduğu için fark edilmemiş. `wellness_checkins` bu hatayı tekrarlamıyor (012'de UPDATE politikası var). Ayrı bir migration ile düzeltilmeli.

5. ~~**Seed verisi yetersiz**~~ — **Tamamlandı** (2026-06-26): 2 yeni takım (Ritmik Takım, Trampolin Takım) ve 4 yeni sporcu eklendi. Toplam: 4 takım, 5 sporcu.

---

## Sıradaki Görevler

### Öncelik 0 — Tamamlandı (2026-06-29)
- [x] Self-serve signup akışı (4 adım) ✅
- [x] Trial sistemi (007_trial.sql, org_trial_status view, TrialBanner) ✅
- [x] Landing page + marketing layout ✅
- [x] Demo talep formu ✅
- [x] Login sayfasına "Hesap oluştur" linki ✅

### Öncelik 1 — Kritik
- [x] Edge Functions cloud'a deploy et (`supabase functions deploy invite-member`) ✅ (2026-06-27)
- [ ] Davet sistemini uçtan uca test et (RESEND_API_KEY set edildikten sonra — email gidiyor mu?)
  - ✅ `/auth/confirm/route.ts` oluşturuldu — `token_hash` doğrulama + membership upsert + metadata temizleme
  - ✅ `invite-member` Edge Function güncellendi — `pending_*` metadata + `SITE_URL/auth/confirm` redirectTo
  - ✅ `SITE_URL=http://localhost:3001` secret set edildi
  - ✅ Edge Function yeniden deploy edildi
  - ⚠️ Supabase Dashboard → Auth → URL Configuration → Redirect URLs'e ekle: `http://localhost:3001/auth/confirm` ve `http://localhost:3000/auth/confirm`
- [x] Realtime aboneliğini web'e ekle (program publish → sporcu anlık görür) ✅
- [x] Seed verisini genişlet (5 sporcu, 3 koç, gerçek veriler) ✅ (5 sporcu, koç ekleme bekliyor)

### Öncelik 2 — Özellik
- [x] `005_exercises.sql` + `006_exercise_seed.sql` — Egzersiz kütüphanesi ✅ (2026-06-26)
- [x] Program builder — süperset sistemi (A/B/C... grup renkleri, max 10 egzersiz/grup) ✅ (2026-06-26)
- [x] Egzersiz kütüphanesi web UI — platform + org katmanı, tam CRUD ✅ (2026-06-26)
- [x] Exercise picker modal — program builder'da kütüphaneden egzersiz seçme ✅ (2026-06-26)
- [ ] 1RM takibi — athlete_1rm_records tablosu hazır, web UI bekliyor
- [ ] ACWR grafiği — Recharts ile görsel trend (şu an tablo mu grafik mi kontrol et)

### Öncelik 3 — Gelecek Sprint
- [ ] WHOOP aktif sync (altyapı hazır, webhook deploy + token yönetimi aktif et)
- [ ] Polar aktif sync (transaction commit flow test et)
- [ ] Stripe abonelik sistemi
- [ ] RLS izolasyon testleri (Vitest)
- [ ] Playwright E2E testleri

---

## MVP Tamamlanma Durumu

```
✅ Org Admin kullanıcı oluşturabilir (web)
✅ Coach davet edilebilir (e-posta — altyapı var, deploy bekliyor)
✅ Athlete davet edilebilir (e-posta — altyapı var, deploy bekliyor)
✅ Coach sporcu ekleyebilir
✅ Coach antrenman programı oluşturabilir
✅ Coach programı publish edebilir
✅ Athlete mobilde programı görebilir (navigation çözüldü, realtime var)
✅ Athlete ACWR logu girebilir
✅ Coach ACWR dashboard'unu görebilir
✅ Yarışma eklenebilir
✅ Test sonucu eklenebilir
❌ RLS testleri (henüz yazılmadı)
```
