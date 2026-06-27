# AthleteIQ — Proje Durumu

> Son güncelleme: 2026-06-28 (mobile navigation debug — çözülmedi)
> Son commit: `171ad8a` — 2026-06-28
> Bu dosya her session başında okunmalı. CLAUDE.md ile birlikte projenin hafızasıdır.

---

## Tamamlanan Özellikler

### Veritabanı (Agent 1 — DB Agent) ✅
- `supabase/migrations/001_schema.sql` — Tüm core tablolar
- `supabase/migrations/002_rls.sql` — Row Level Security politikaları
- `supabase/migrations/003_functions.sql` — Helper fonksiyonlar (my_role, my_team_id, is_super_admin, calculate_acwr, get_athlete_programs)
- `supabase/migrations/004_wearables.sql` — Wearable tabloları + athlete_push_tokens
- `supabase/migrations/005_exercises.sql` — Egzersiz kütüphanesi tabloları + RLS (platform_exercises, org_exercise_categories, org_exercises, athlete_1rm_records)
- `supabase/migrations/006_exercise_seed.sql` — 135 platform egzersizi (16 hareket paterninden) + TGF için 5 org kategorisi
- `supabase/seed.sql` — Başlangıç test verisi
- `packages/db/types.ts` — Supabase'den üretilmiş TypeScript tipleri
- `packages/db/queries/` — athletes, programs, acwr, competitions, tests, wearables, teams, memberships, **exercises** sorguları

### Kimlik Doğrulama (Agent 2 — Auth Agent) ✅
- `apps/web/middleware.ts` — Route koruması + membership cookie cache (8 saat)
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
- `apps/web/app/(dashboard)/programs/` — Program listesi, yeni program oluşturma, program detay, program düzenleme (`[id]/edit/`)
- `apps/web/app/(dashboard)/acwr/` — ACWR dashboard
- `apps/web/app/(dashboard)/competitions/` — Yarışma listesi
- `apps/web/app/(dashboard)/tests/` — Test sonuçları
- `apps/web/app/(dashboard)/wearables/` — Wearable bağlantı durumu
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
| 005 | exercises | ✅ Uygulandı |
| 006 | exercise_seed | ✅ Uygulandı |

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
- **pnpm:** 11.9
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

4. **🔴 Mobile NavigationContainer hatası — ÇÖZÜLMEDI** — Expo Router v6.0.24 + React Navigation v7.3.4 kombinasyonunda `"Couldn't find a navigation context"` hatası alınıyor. Birden fazla yaklaşım denendi, hiçbiri çalışmadı. Sonraki session'da kökten araştırılmalı. Mevcut durum:
   - `_layout.tsx`: `AuthContext` + `Stack` (her zaman render ediyor, null döndürmüyor)
   - `index.tsx`: `useEffect` + `router.replace` (navigation context hazır olmadan önce çalışıyor — `assertIsReady()` throw ediyor)
   - `(auth)/_layout.tsx`: YOK (silindi — olunca başka sorun çıkıyor)
   - **Öneri:** Expo Router v6 changelog'unu oku, `initialRouteName` pattern'i dene, ya da `expo-router` versiyonunu `~4.x` veya `~5.x`'e downgrade et

5. ~~**Seed verisi yetersiz**~~ — **Tamamlandı** (2026-06-26): 2 yeni takım (Ritmik Takım, Trampolin Takım) ve 4 yeni sporcu eklendi. Toplam: 4 takım, 5 sporcu.

---

## Sıradaki Görevler

### Öncelik 0 — Blocker
- [ ] 🔴 **Mobile NavigationContainer hatası** — Expo Router v6 + React Navigation v7 uyumsuzluğu. `router.replace` navigation ref hazır olmadan önce çağrılıyor. Çözüm denemeleri başarısız. Kökten araştır: Expo Router v6 migration guide, `initialRouteName`, ya da versiyon downgrade.

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
⏳ Athlete mobilde programı görebilir (realtime eksik)
✅ Athlete ACWR logu girebilir
✅ Coach ACWR dashboard'unu görebilir
✅ Yarışma eklenebilir
✅ Test sonucu eklenebilir
❌ RLS testleri (henüz yazılmadı)
```
