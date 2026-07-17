# MOBILE_STATUS.md — Sporcu Uygulaması Durum Tespiti

> Oluşturulma: 2026-07-10 · AŞAMA 1 (salt-tespit)
> **GÜNCELLEME 2026-07-15:** Uygulama fiilen çalıştırıldı ve **cihazda doğrulandı**. Aşağıdaki iki iddia ARTIK GEÇERSİZ:
> - ~~"20 TypeScript hatası"~~ → `@athleteiq/db` zaten bildirilmiş, `tsc --noEmit` **0 hata**.
> - ~~"Boot / kritik bug: statikte temiz"~~ → Gerçekte **donmuş yüzey** bug'ı vardı (css-interop `printUpgradeWarning` hang) — çözüldü, § "Donma bug'ı" bölümüne bak.
>
> Kapsam: `apps/mobile/` (Expo — Sporcu uygulaması)

---

## 🔴→✅ Donma bug'ı (2026-07-15) — ÇÖZÜLDÜ

**Belirti:** Program ekranı ilk frame'de donuk kalıyordu (bayat "Henüz program yok"), 4 tab'a basınca **hiçbir tepki yoktu**. Ama JS çalışıyordu: fetch `count=2` dönüyor, React `programs=2` ile render ediyordu → **React doğru, native Fabric surface commit etmiyordu.**

**Kök neden:** `react-native-css-interop@0.2.6` → `printUpgradeWarning` → `stringify(originalProps)`. `originalProps.children` React element ağacı üzerinden **Fiber + React Navigation obje grafiğinin tamamına** ulaşıyor; önceki patch çökmeyi durdurdu ama stringify o grafı **her re-render'da geziyordu** → JS thread kilitleniyor → yüzey donuyor, dokunuş işlenmiyor. Dev-only (`NODE_ENV !== "production"`).

**Neden sadece Program ekranı:** Sadece haftalık görünüm (7 gün × iç içe dinamik className) upgrade-uyarısını tetikleyecek yoğunlukta. Recovery/Yarışmalar/Profil aynı hook'ları/className'i/fetch'i kullanıyor ve sorunsuz → **navigator / react-native-screens / reanimated / gesture-handler suçsuz.**

**Fix:** `patches/react-native-css-interop@0.2.6.patch` — `printUpgradeWarning` artık derin stringify yapmıyor (sığ `Object.keys()`). `pnpm install` ile kalıcılığı doğrulandı.

**Ek fix:** `supabase_realtime` publication'ı boştu → `training_programs` + `training_sessions` eklendi ("Bağlanıyor" → "Canlı").

---

## Mevcut durum

### Expo SDK versiyonu
- **Expo SDK 54** (`expo: ~54.0.5`) — ✅ Telefondaki Expo Go SDK 54 ile **uyumlu**.
- `react-native: 0.81.5`
- `react: 19.1.0`
- `expo-router: ~6.0.24` (file-based routing)
- `react-native-reanimated: ~4.1.1` (lockfile: 4.1.7) + `react-native-worklets 0.8.3` (transitif, reanimated'ın pnpm klasöründe çözülüyor → sorun değil)
- `nativewind: ^4.1.23` (lockfile: 4.2.6) + `tailwindcss ^3.4.0`
- Not: Versiyonlar SDK 54 hattıyla tutarlı; sürüm uyumsuzluğu yok.

### Route yapısı (Expo Router)
```
app/
├── _layout.tsx              → Root: AuthProvider + StatusBar + <Slot/>
├── index.tsx                → Redirect: session varsa /(tabs)/program, yoksa /(auth)/login
├── (auth)/
│   └── login.tsx            → Email/şifre + magic link
└── (tabs)/
    ├── _layout.tsx          → Bottom tab (4 sekme: Program, Recovery, Yarışmalar, Profil)
    ├── program/
    │   ├── _layout.tsx      → Stack (index + [day])
    │   ├── index.tsx        → Haftalık program + realtime
    │   └── [day].tsx        → Günlük egzersiz detayı
    ├── recovery/
    │   ├── _layout.tsx
    │   └── index.tsx        → Wearable recovery metrikleri
    ├── competitions/
    │   ├── _layout.tsx
    │   └── index.tsx        → Yaklaşan/geçmiş yarışmalar
    └── profile/
        ├── _layout.tsx      → Stack (index + connect-whoop + connect-polar)
        ├── index.tsx        → Profil + wearable satırları + çıkış
        ├── connect-whoop.tsx → STUB (sadece başlık)
        └── connect-polar.tsx → STUB (sadece başlık)
```

### Çalışan (tam kodlanmış) ekranlar
| Ekran | Durum | Not |
|-------|-------|-----|
| Login | ✅ Tam | Şifre girişi çalışır; magic link kodu var (deep-link dönüşü şüpheli, aşağıya bak) |
| Program (haftalık) | ✅ Tam | Realtime abonelik + pull-to-refresh + 7 günlük görünüm |
| Program [day] (günlük) | ✅ Tam | Seans + egzersiz kartları |
| Recovery | ✅ Tam | Wearable yoksa boş-durum; veri varsa ring + metrikler |
| Competitions | ✅ Tam | Yaklaşan/geçmiş ayrımı, geri sayım rozeti |
| Profile | ✅ Tam | Bilgiler + wearable satırları + çıkış |

### Çalışmayan / eksik / stub ekranlar
| Ekran | Durum | Not |
|-------|-------|-----|
| connect-whoop.tsx | 🔴 STUB | Sadece `<Text>WHOOP Bağla</Text>` — OAuth akışı yok. Profildeki "Bağla" butonu buraya gider ama boş sayfa açılır. |
| connect-polar.tsx | 🔴 STUB | Aynı — boş sayfa. |
| Push notifications | ⚪ Kasıtlı boş | `lib/notifications.ts` bilinçli olarak `undefined` döner (dev build sonraki sprint). Bug değil. |

> Not: Wearable bağlantı ekranlarının stub olması MVP kapsamı dışıdır (CLAUDE.md §10: "Wearable entegrasyonu MVP'nin dışındadır"). Kritik değil.

---

## TypeScript hataları

**Toplam: 20 hata** (BUGS.md'de bahsedilen "20 pre-existing hata" — **hâlâ açık**).

### Kök neden (TEK): `@athleteiq/db` workspace bağımlılığı bildirilmemiş
- `apps/mobile/package.json` **`@athleteiq/db`'yi dependency olarak listelemiyor** (web listeliyor: `"@athleteiq/db": "workspace:*"`).
- pnpm yalnızca bildirilen bağımlılıklara symlink kurar → `apps/mobile/node_modules/@athleteiq/` **yok**, kökte de yok.
- Sonuç: her ekranın `import type { Database } from "@athleteiq/db/types"` satırı → **TS2307 (Cannot find module)**.
- Bu, tüm ekranlarda `Database` tipini `error/any`'ye düşürür → callback parametreleri tip çıkarımını kaybeder → **cascading TS7006 (implicitly any)**.

### Hata dağılımı
| Dosya | TS2307 (modül) | TS7006 (implicit any) |
|-------|:---:|:---:|
| `lib/supabase.ts` | 1 | — |
| `lib/hooks/useAthleteProfile.ts` | 1 | — |
| `components/ExerciseCard.tsx` | 1 | — |
| `app/(tabs)/competitions/index.tsx` | 1 | — |
| `app/(tabs)/recovery/index.tsx` | 1 | — |
| `app/(tabs)/profile/index.tsx` | 1 | — |
| `app/(tabs)/program/index.tsx` | 1 | 5 |
| `app/(tabs)/program/[day].tsx` | 1 | 4 |
| **Toplam** | **8** | **9** → +3 = **20** |

### KRİTİK NÜANS: Bu hatalar uygulamayı ÇÖKERTMEZ
- Tüm importlar `import type` (yalnızca tip). Babel/TS bunları **build sırasında siler** → çalışma zamanında `@athleteiq/db` hiç `require` edilmez.
- Yani: **tsc kırmızı, ama Metro bundle + uygulama çalışma zamanı bundan etkilenmez.** PROGRESS.md'nin "navigation çözüldü, program görünüyor" durumu bununla tutarlı.
- Düzeltme yine de gerekli: tip güvenliği yok, CI tsc kırılır, IDE'de otokomple çalışmaz.

### Beklenen düzeltme (AŞAMA 2'de)
`apps/mobile/package.json` deps'e `"@athleteiq/db": "workspace:*"` ekle + `pnpm install`. Bu tek değişiklik **20 hatanın tamamını** çözer (8 TS2307 + türeyen 12 TS7006).

---

## Auth uyumu

### Supabase bağlantısı — ✅ Çalışıyor
- `lib/supabase.ts` doğru projeye bağlı: `nlmwcygmbbxmfpsubvmh.supabase.co` (web ile **aynı proje**).
- `.env` doğru: `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon key, güvenli).
- Token depolama: **`expo-secure-store`** (CLAUDE.md §Mobile kuralı gereği — AsyncStorage değil ✅). `autoRefreshToken: true`, `persistSession: true`.
- `AuthProvider` (`lib/auth.tsx`) `onAuthStateChange` dinliyor → oturum değişince `index.tsx` yönlendiriyor.

### Web'deki auth değişiklikleriyle uyum — ✅ Çakışma yok
- Web'in yeni `aiq_uid`/`aiq_role` **cookie'leri ve server-side logout'u yalnızca Next.js middleware'e ait** — mobil bunları kullanmaz.
- Mobil, Supabase JS SDK ile doğrudan konuşur; ortak backend **Supabase Auth (JWT)**. İki taraf aynı kullanıcı tablosunu paylaşır, çakışma yaratmaz.
- Web'deki cookie/rol cache mantığındaki değişiklikler mobile'ı **etkilemez**.

### Rol kontrolü — ⚠️ Yok (athlete varsayılıyor)
- Mobilde rol kontrolü **yok**. `useAthleteProfile` doğrudan `athletes` tablosundan `user_id = auth.uid()` ile satır çeker.
- Athlete satırı yoksa (koç/admin girişi) → `.single()` hata döner → ekranlar "Sporcu profili bulunamadı" gösterir. **Çökme değil, zarif düşüş.** Sporcu-yalnız uygulama için kabul edilebilir.

---

## Açık buglar (öncelik sırası)

### 🔴 Kritik (uygulama açılmıyor) — ÇÖZÜLDÜ (2026-07-13)
- **"Couldn't find a navigation context" — ÇÖZÜLDÜ.** İzolasyon teşhisiyle (minimal `<Slot>`+View çalıştı, AuthProvider+useAuth çalıştı, sadece navigasyon ağacı mount olunca patladı) gerçek kök neden bulundu: **`react-native-css-interop@0.2.6`** (NativeWind motoru) `render-component.js` içindeki dev-only `stringify`/`printUpgradeWarning` path'i, prop'ları serialize ederken React Navigation objesinin throwing getter'ına (`NavigationStateContext.getKey`) çarpıp çöküyordu. "navigation context" mesajı yan hata idi; `<Redirect>`/Slot/react-navigation suçlu değildi.
- **Fix:** `patches/react-native-css-interop@0.2.6.patch` (stringify `try/catch`) + `pnpm-workspace.yaml patchedDependencies`. Cihazda doğrulandı (İbrahim girişiyle `/(tabs)/program` tab ağacı hatasız render oluyor).
- Not: sadece dev/Expo Go'da olurdu (`NODE_ENV !== "production"` guard'lı path). Detay: memory `mobile-nav-blocker`.

### 🟠 Yüksek (özellik bozuk)
1. ~~**20 TypeScript hatası**~~ — **GEÇERSİZ** (2026-07-15): `@athleteiq/db` zaten `apps/mobile/package.json`'da bildirilmiş, `tsc --noEmit` **0 hata**.
2. **connect-whoop.tsx / connect-polar.tsx stub** — Profilde "Bağla" → boş sayfa. (MVP dışı, ama görünür kırık UX.)

### 🟡 Orta (veri gelmiyor / akış eksik)
3. **Magic link deep-link dönüşü şüpheli** — `signInWithOtp` çağrılıyor ama `emailRedirectTo` verilmiyor ve `athleteiq://` deep-link handler'ı görünmüyor. Magic link mobilde muhtemelen tamamlanmaz. **Şifre girişi çalışır** — bu yüzden Orta. Doğrulanmalı.
4. **Bildirimler kasıtlı devre dışı** — `notifications.ts` no-op. Program publish push'u gelmez (sadece realtime ekran güncellemesi var). Sprint kararı, bug değil.

### ⚪ Düşük (kozmetik / iyileştirme)
5. `router.push(... as never)` — typed routes (`app.json: typedRoutes:true`) bypass ediliyor. Çalışır ama tip güvenliği kaybı.
6. Profil çıkış akışı `supabase.auth.signOut()` + "root layout yönlendirecek" yorumuna güveniyor — `onAuthStateChange` bunu tetikler, muhtemelen çalışır; doğrulanmalı.

---

## Önerilen düzeltme sırası (AŞAMA 2 için)

1. **İlk iş — `expo start` ile fiilen boot et.** Statik analiz "kritik bug yok" diyor ama bu doğrulanmadı. Gerçek durumu (Metro bundle, navigation, login) gözle görmeden düzeltmeye başlama. (Web'de yaptığımız gibi: önce çalıştır, gör.)
2. **20 TS hatasını kapat** — `apps/mobile/package.json`'a `"@athleteiq/db": "workspace:*"` ekle → `pnpm install` → `tsc --noEmit` 0 hata teyit et. (Ucuz, tek kaynak, tüm cascade çözülür.)
3. **Login uçtan uca test** — test kullanıcısı (`tosunbeytullah9@gmail.com` / `AthleteIQ2026`) ile şifre girişi → program ekranı geliyor mu? (Not: bu kullanıcı athlete satırına sahip mi? Değilse "profil bulunamadı" görürüz — test için athlete `user_id`'li bir hesap gerekebilir.)
4. **Ekran-ekran veri doğrulama** — program (realtime dahil), recovery (wearable yoksa boş-durum), competitions, profile. Her birinde gerçek veri akıyor mu?
5. **Magic link deep-link** — gerekirse `emailRedirectTo: athleteiq://...` + linking handler ekle veya magic link'i şimdilik gizle (şifre yeterli).
6. **connect-whoop/polar** — MVP dışı; ya "yakında" placeholder ile netleştir ya da butonları disable et (boş sayfa açmaktansa).

---

## Özet

| Boyut | Durum |
|-------|-------|
| Expo SDK 54 / telefon uyumu | ✅ Uyumlu |
| Route yapısı | ✅ Sağlam (7 ekran + stub'lar) |
| Supabase/auth bağlantısı | ✅ Doğru proje, SecureStore, web ile çakışmasız |
| TypeScript | ✅ 0 hata (2026-07-15 doğrulandı) |
| Boot / kritik bug | ✅ Cihazda doğrulandı — donma bug'ı çözüldü (css-interop patch), 4 tab + Program çalışıyor |
| Wearable connect ekranları | 🟠 Stub (MVP dışı) |

**Sonraki adım:** AŞAMA 2 — önce `expo start` ile gerçek durumu gör, sonra parti parti düzelt (ilk parti: 20 TS hatası tek satırla).
