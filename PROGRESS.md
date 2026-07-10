# AthleteIQ — Proje Durumu

> Son güncelleme: 2026-07-01 (Bug PARTİ 4 — Kozmetik + son temizlik: mobile realtime unpublish düzeltildi, landing layout import kokusu `MarketingShell`'e çıkarıldı, ölü yük kolonları program builder'a bağlandı (yük tipi seçici), PROGRESS.md/BUGS.md finalize. Envanter: 0 açık kod bug'ı.)
> Son commit: `171ad8a` — 2026-06-28
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

1. **RESEND_API_KEY eksik** — Edge Functions deploy edildi ancak `RESEND_API_KEY` Supabase secret olarak set edilmedi. `resend.com`'dan key alınıp `supabase secrets set RESEND_API_KEY=re_xxx --project-ref nlmwcygmbbxmfpsubvmh` çalıştırılması gerekiyor. Bu yapılana kadar davet emaili gitmiyor ama membership kaydı oluşuyor.

2. **Admin /dashboard yönlendirme** — Coach rolüyle giriş yapan kullanıcı `/dashboard`'a gitmeye çalışırsa `/athletes`'e yönlendiriliyor (middleware'de tanımlı, beklenen davranış). Ancak `/dashboard` doğrudan admin-only olarak işaretli, bu confusion yaratabilir.

3. ~~**Realtime aboneliği**~~ — **Tamamlandı** (2026-06-26): `athletes-client.tsx` ve `programs-client.tsx`'e Supabase Realtime eklendi. `is_published=eq.true` filter ile UPDATE event gelince `router.refresh()` + toast notification tetikleniyor.

4. ~~**🔴 Mobile NavigationContainer hatası**~~ — **ÇÖZÜLDÜ** (2026-06-29):
   - **Expo CLI `Body is unusable` bug:** `@expo/cli@54.0.25` cache layer'ı response body stream'ini iki kez tüketiyordu. Fix: `EXPO_NO_CACHE=1` + `cross-env` ile `package.json dev` script'ine eklendi.
   - **Navigation context hatası:** `index.tsx`'teki `router.replace()` navigation ref hazır olmadan çalışıyordu. Fix: `<Redirect href="...">` component'ine çevrildi.
   - **Bonus:** `(tabs)/_layout.tsx` Tabs.Screen name'leri `program/index` → `program` formatına düzeltildi. `program/` ve `profile/` klasörlerine nested `_layout.tsx` eklendi.

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
