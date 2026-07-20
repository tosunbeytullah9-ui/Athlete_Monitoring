# AthleteIQ — Bug Envanteri

> Oluşturulma: 2026-06-30 (salt-tespit) · Son güncelleme: 2026-07-20 (Parti 2.2.D — `onInvalid` handler eklenmesiyle 2 bulgunun "sessiz" kısmı giderildi, kök neden AÇIK kaldı)
> **Durum:** 22 bulgunun 17'si ✅ FIXED. 1 madde (leaked-password) kod değil, kullanıcının elle yapacağı bir Supabase Dashboard ayarı (⏳). **Açık kod bug'ı: 4** — 1'i bilinçli olarak ertelendi (⚠️ WONTFIX, Parti 8'de çözülecek), 3'ü Parti 2.2.C'de bulundu; 2'sinin "sessiz" olma özelliği Parti 2.2.D'de yan etki olarak giderildi (kök neden hâlâ AÇIK), 1'i (`start_date`/`end_date`) değişmedi.
> Düzeltmeler 4 partide (PARTİ 1–4), her biri kullanıcı onayıyla ve tsc/build/eslint doğrulamasıyla uygulandı.

## Tarama Yöntemi

| Adım | Araç | Sonuç |
|------|------|-------|
| TypeScript | `tsc --noEmit` (paket bazında) | web ✅ mobile ✅ db ✅ validators ✅ integrations ✅ — **sadece `packages/ui` 1 hata** |
| Build | `next build @athleteiq/web` | ✅ Başarılı (25 sayfa, Next tip kontrolü dahil temiz) |
| Lint | `eslint` | ⚠️ **Hiçbir ESLint config yok** — çalıştırılamadı (bulgu #M3) |
| Şema | Supabase Cloud canlı sorgu + `get_advisors` | 9 migration uygulanmış, advisor bulguları aşağıda |

> **Not:** Subagent raporlarındaki "kritik" iddiaların bir kısmı doğrulamada **yanlış çıktı** (build başarılı olduğu için landing page çökmesi/type hatası gerçek değil). Bu rapor yalnızca **doğrulanmış** bug'ları içerir. Elenen yanlış pozitifler en altta listelenmiştir.

---

## Kritik (sistem çalışmıyor)

- **✅ FIXED (LOGOUT GUARD — 2026-07-01)** — **Athlete guard `/auth/logout`'u blokluyordu (Parti 1 yan etkisi)** (`apps/web/middleware.ts`)
  - **Sorun:** Parti 1 athlete rol guard'ı `role === 'athlete'` için `/programs` dışındaki her yolu `/programs`'a redirect ediyordu. Bu kural `/auth/logout` POST route'unu da yakaladı — athlete çıkış yapmak istediğinde middleware onu `/programs`'a geri atıyor, logout hiç çalışmıyordu (sonsuz döngü: athlete oturumdan çıkamıyordu).
  - **Düzeltme:** Middleware'e `/auth/*` muafiyeti eklendi — auth route'ları (`/auth/logout`, `/auth/confirm`, `/auth/callback` vb.) rol redirect'inden muaf. Logout artık çalışıyor.

- **✅ FIXED (ROL CACHE — 2026-07-01)** — **Bayat rol cookie'si sonraki kullanıcılara miras kalıyordu** (`apps/web/middleware.ts`, `app/auth/logout/route.ts` [yeni], `components/shared/header.tsx`, `app/(auth)/login/login-form.tsx`)
  - **Sorun:** `aiq_role`/`aiq_org_id`/`aiq_team_id` cookie'leri kullanıcıya bağlı değildi. Middleware "cookie varsa DB'ye sorma" mantığıyla çalışıyordu. Logout yalnızca `supabase.auth.signOut()` çağırıyordu; httpOnly `aiq_*` cookie'leri client JS silemediği için kalıyordu. Sonuç: athlete çıkış yapıp aynı tarayıcıdan admin giriş yapınca bayat `athlete` cookie'si miras kalıyor, admin menüleri gizli kalıyordu. Parti 2 athlete guard'ı bu cache'i sertleştirdi ama kullanıcıya bağlamayı eklemedi (yan etki).
  - **Kök neden:** Cookie kullanıcı kimliğine (`user.id`) bağlı değildi + logout cookie'yi temizlemiyordu.
  - **Düzeltme (3 katman):**
    1. **Middleware — cookie'yi kullanıcıya bağla (asıl fix):** Cookie set edilirken `aiq_uid = user.id` de yazılıyor. Cache okuma `cacheValid = cachedUid === user.id && cachedRole && cachedOrgId` ile korunuyor; eşleşmezse membership DB'den taze çekilip tüm `aiq_*` yeniden yazılıyor. `team_id` yoksa bayat `aiq_team_id` maxAge:0 ile temizleniyor.
    2. **Server-side logout route:** `app/auth/logout/route.ts` (POST) — `signOut()` + `cookieStore.delete('aiq_uid'|'aiq_role'|'aiq_org_id'|'aiq_team_id')` → `/login` (303). `header.tsx` çıkış butonu artık bu route'a `fetch POST` atıp hard navigation yapıyor (eski client `signOut` kaldırıldı).
    3. **Login sonrası hard navigation (yedek):** `login-form.tsx` başarılı `signInWithPassword` sonrası `router.push` yerine `window.location.href = next` → middleware taze çalışıp doğru rolü yazıyor.
  - **Doğrulama:** `tsc --noEmit` (web) 0 hata; `pnpm build` başarılı, `/auth/logout` route'u kayıtlı. Çoklu-hesap tarayıcı senaryosu (athlete→admin→super_admin geçişleri) canlı oturum gerektiriyor — kod/tip/build doğrulaması geçti, manuel test kullanıcı tarafından yapılmalı.

- **✅ FIXED (GÜVENLİK PARTİ 2 — 2026-06-30)** — **Athlete rol guard: koç paneli sporcuya açıktı** (`apps/web/middleware.ts`, `components/shared/sidebar.tsx`, `app/(dashboard)/layout.tsx`, `app/(dashboard)/programs/programs-client.tsx`, `app/(dashboard)/programs/[id]/program-detail-client.tsx`)
  - **Sorun:** RLS veri yazımını engelliyordu (athlete veri DEĞİŞTİREMİYORDU ✅) ama frontend koç arayüzünü athlete'e açıyordu. Kök neden: sidebar'da rol filtresi yoktu ve middleware yalnızca `/admin`, `/dashboard`, `/settings` yollarını koruyordu — `/athletes`, `/exercises`, `/programs/new`, `/programs/[id]/edit`, `/acwr`, `/competitions`, `/tests`, `/wearables` athlete'e açıktı.
  - **Karar:** Athlete web'de SADECE kendi yayınlanmış programını salt-okunur görür. Başka hiçbir sayfaya erişemez.
  - **Düzeltme (4 katman, defans-in-depth):**
    1. **Middleware guard (asıl güvenlik):** `role === 'athlete'` ise izin verilen tek yol `/programs` ve `/programs/[id]`; `/programs/new` ve `*/edit` özellikle bloklı; diğer her yol → `/programs` redirect.
    2. **Sidebar rol filtresi:** Her `navItem`'a `roles` alanı eklendi; `useUserContext().role` ile filtrelenip athlete yalnızca "Programlar"ı görüyor.
    3. **Server-side layout guard:** `(dashboard)/layout.tsx` artık async; cookie'den rolü okuyup `x-pathname` (middleware'in eklediği header) ile athlete için ikinci kez kontrol ediyor.
    4. **Programs UI:** Athlete için "Yeni Program", "Düzenle", "Yayınla" butonları ve taslak filtreleri gizlendi; yalnızca yayınlanmış programlar listeleniyor (salt-okunur).
  - **Ek kök neden (test sırasında bulundu):** `aiq_role` cookie'si `httpOnly` olduğu için `useUserContext` (`document.cookie` okur) rolü HİÇ göremiyordu → sidebar/buton filtreleri sessizce çalışmıyordu. Çözüm: `lib/hooks/user-context-provider.tsx` eklendi; layout server'da rolü okuyup `UserContextProvider` ile client'e geçiriyor, `useUserContext` önce provider'dan okuyor (cookie'ye fallback). Artık rol SSR'da mevcut, flash yok.
  - **Test (curl + gerçek oturum, localhost:3002):**
    - athlete (`cosaswilan@gmail.com`): `/programs` 200; `/athletes` `/exercises` `/acwr` `/competitions` `/tests` `/wearables` `/settings` `/programs/new` `/dashboard` `/programs/[id]/edit` → hepsi 307 → `/programs`. SSR HTML'de sidebar yalnızca "Programlar", "Yeni Program" butonu yok.
    - admin (`tosunbeytullah9@gmail.com`): tüm route'lar 200; sidebar 8 öğe + "Yeni Program" butonu görünüyor.

- **✅ FIXED (PARTİ 1)** — **`apps/web/middleware.ts:129,138,157` + `apps/web/app/page.tsx:54` + `apps/web/app/auth/confirm/route.ts:60`** : Sporcu (`athlete`) rolü web'de var olmayan `/program` (tekil) route'una yönlendiriliyor. → 5 konumda `/program` → `/programs` (çoğul) yapıldı; mobil dokunulmadı. : Web'de yalnızca `/programs` (çoğul) route'u var; `/program` hiç tanımlı değil, dolayısıyla 404 ve `/` → middleware → 404 döngü riski. : Mobil uygulamadaki `/program` route'u web kod tabanına kopyalanmış; web'de sporcular için geçerli bir hedef belirlenmemiş. : 5 konumdaki athlete hedefini web'de geçerli bir sayfaya (ör. `/programs` salt-okunur veya `/login`) yönlendir — athlete web'i kullanmıyorsa kararı netleştir.

---

## Yüksek (özellik bozuk)

- **✅ FIXED (PARTİ 2 — 2026-07-01)** — **`apps/web/app/(dashboard)/tests/page.tsx`** : Sayfa yalnızca `<h1>Test Sonuçları</h1>` döndürüyor (3 satır, içerik yok). → Tam atletik performans CRUD eklendi: `page.tsx` (server) + `tests-client.tsx` (client). 7 kategori / 31 test tipi katalog (Sıçrama, Sprint, Maksimal Kuvvet, Güç, Dayanıklılık, Çeviklik, Esneklik). Sporcu seçici, kategori→test tipi kademeli dropdown, otomatik birim, trend kolonu (sprint/çeviklikte düşük=iyi mantığı), filtreler (sporcu/kategori/tarih), admin/coach sil. `packages/db/queries/tests.ts`'e `getTests`/`createTest`/`deleteTest` eklendi.

- **✅ FIXED (PARTİ 2 — 2026-07-01)** — **`apps/web/app/(dashboard)/wearables/page.tsx`** : Sayfa yalnızca `<h1>Wearable Bağlantıları</h1>` döndürüyor (3 satır, içerik yok). → Bağlantı durumu UI eklendi: `page.tsx` (server) + `wearables-client.tsx` (client). 3 özet kartı (Toplam Sporcu / WHOOP Bağlı / Polar Bağlı), sporcu bazlı durum tablosu (yeşil "Bağlı" / gri "Bağlı Değil" badge), son senkronizasyon, filtreler (bağlı/bağlı değil/tümü). "Bağla" butonu disabled (tooltip: entegrasyon yakında). `packages/db/queries/wearables.ts`'e `getWearableConnections` eklendi. NOT: Entegrasyon aktif değil, salt durum görüntüleme.

- **✅ FIXED (PARTİ 2 — 2026-07-01)** — **`packages/ui/components/button.tsx:46`** : TS2322 — `style` prop tip çakışması, çift `@types/react` (19.1.17 vs 19.2.17). → `pnpm-workspace.yaml`'a `overrides` eklendi (`@types/react`: 19.2.17, `@types/react-dom`: 19.2.3). pnpm 11'de overrides `pnpm-workspace.yaml`'a taşınmış (package.json `pnpm.overrides` artık okunmuyor) — doğru yere kondu, package.json'daki bayat `pnpm` alanı temizlendi, `packageManager` gerçek global binary ile (`pnpm@11.9.0`) hizalandı. node_modules + lockfile yeniden üretildi → tüm ağaçta tek `@types/react@19.2.17`. `pnpm --filter="@athleteiq/ui" tsc --noEmit` → 0 hata.

---

## Orta (TypeScript / şema / güvenlik)

- **✅ FIXED (PARTİ 2 — 2026-07-01)** — **`packages/db/types.ts` (organizations tablosu + Views)** : `organizations`'dan `trial_ends_at`, `plan_status`, `owner_id` kolonları eksik; `org_trial_status` view'ı hiç tiplenmemiş. → `supabase gen types` ile types.ts yeniden üretildi: organizations'da 3 kolon + `org_trial_status` view (id, plan_status, trial_ends_at, trial_days_remaining, is_trial_expired, owner_id...) artık tipli. `(admin as any)` bypass'ı [create-org/route.ts](apps/web/app/api/signup/create-org/route.ts) `createServiceClient<Database>` ile gerçek tipe çevrildi; `(supabase as any)` bypass'ı [trial-banner.tsx](apps/web/components/shared/trial-banner.tsx) `Tables<"org_trial_status">` Pick tipiyle değiştirildi. `tsc --noEmit` (db + web) → 0 hata.

- **✅ FIXED (PARTİ 3 — 2026-07-01)** — **`supabase/migrations/007_superset_columns.sql` + `007_trial.sql`** : İki migration aynı `007` numara prefix'ini paylaşıyordu. → `005_exercises.sql:113-114`'ün `superset_group`/`superset_order`'ı zaten eklediği doğrulandı; `007_superset_columns.sql` **silindi** (gereksiz tekrar). `007_trial.sql` → `010_trial.sql` olarak yeniden adlandırıldı (008, 009 dolu). DİKKAT: yalnızca local geçmiş düzeltmesi; cloud'a tekrar push edilmedi.

- **✅ FIXED (PARTİ 3 — 2026-07-01)** — **Proje geneli — ESLint config yok** : Kökte, `apps/web`'de, `apps/mobile`'da hiçbir `.eslintrc*` / `eslint.config.*` yoktu. → `apps/web/eslint.config.mjs` (Next 15 flat config: `next/core-web-vitals` + `next/typescript`, `react-hooks/exhaustive-deps` warn) ve `apps/mobile/eslint.config.js` (`eslint-config-expo/flat`) eklendi. Web `lint` script'i `next lint` → `eslint .` (Next 16'da `next lint` kaldırılıyor). Kök `lint: turbo lint` + turbo lint pipeline zaten vardı. pnpm izolasyonu için gerekli eslint plugin'leri (`react-hooks`, `react`, `jsx-a11y`, `import`, `@typescript-eslint/*`, `@next/eslint-plugin-next`, `@eslint/eslintrc`) web devDeps'e; `eslint` + `eslint-config-expo` mobile devDeps'e eklendi. **Sonuç: 15 error → 0 error, 21 warning.** Düzeltilen 15 error: 3 unescaped-entity (escape), 2 html-link-for-pages (→ `<Link>`); geri kalan 10 error `warn`/override ile geçildi — 7 `no-explicit-any` (kasıtlı `(supabase as any)` escape-hatch → warn), 3 shadcn `ui/**` (no-empty-object-type/prefer-const, CLAUDE.md "dokunulma" → files override). Warning'ler talimat gereği bırakıldı.

- **✅ FIXED (PARTİ 3 — 2026-07-01)** — **Gizli (bildirilmemiş) bağımlılıklar** (PARTİ 2'de pnpm 11 katı izolasyonuyla bulundu) : `apps/mobile` `@expo/vector-icons` (`[day].tsx`'te kullanılıyor) + `@types/node` bildirmiyordu; `packages/integrations` `@athleteiq/db` + `@types/node` bildirmiyordu. → `apps/mobile/package.json`: deps `@expo/vector-icons: ^15.0.2` (SDK 54 uyumlu), devDeps `@types/node: ^20`. `packages/integrations/package.json`: deps `@athleteiq/db: workspace:*`, devDeps `@types/node: ^20`. `pnpm install` temiz, tüm paket tsc 0 hata.

- **✅ FIXED (PARTİ 1)** — **Supabase: `org_trial_status` view SECURITY DEFINER** (advisor ERROR) : View, oluşturanın yetkileriyle çalışıyor, RLS bypass ediyor. → `009_security_fixes.sql` ile `security_invoker = true` olarak yeniden tanımlandı (advisor ERROR temizlendi). : Görünüm `security_invoker` ile değil, varsayılan definer ile tanımlanmış; herhangi bir authenticated kullanıcı `id` ile başka org'un trial durumunu okuyabilir. : View'ı `security_invoker = true` ile yeniden tanımla.

- **✅ FIXED (PARTİ 1)** — **Supabase: `whoop_cycles` + `polar_sync_state` RLS policy'siz** (advisor INFO) : Her iki tabloda RLS açık ama hiç policy yok → bütün erişimler bloke. → `009_security_fixes.sql` ile athlete-sahiplik select/insert policy'leri eklendi (advisor INFO temizlendi). : `002_rls.sql`/`004_wearables.sql` bu tablolar için policy tanımlamamış. : Wearable sync aktifleşmeden önce bu tablolara athlete-sahiplik policy'leri ekle (şu an dormant, sync açılınca patlar).

- **🟡 AÇIK (kısmen giderildi, Parti 2.2.D) — bulundu: 2026-07-20, Parti 2.2.C** — **new/edit program formu: `week_number` boş bırakılırsa submit reddi** (`apps/web/app/(dashboard)/programs/new/new-program-client.tsx`, `apps/web/app/(dashboard)/programs/[id]/edit/edit-program-client.tsx`)
  - `week_number` inputu boş bırakılırsa `register(..., { valueAsNumber: true })` `NaN` üretiyor. `programSchema`'daki `z.number().int().min(1).max(52).optional().or(z.literal(undefined))` NaN'ı hiçbir dalda kabul etmiyor → zod validasyonu reddediyor. **Kök neden hâlâ AÇIK** — `week_number`/`duration_min` alanları hâlâ `valueAsNumber` kullanıyor, dokunulmadı (Parti 2.2.D bu alanları kapsam dışı bıraktı; yeni set alanları aynı deseni tekrarlamadı, bkz. PROGRESS.md § Parti 2.2.D).
  - **Kısmen giderilen kısım (Parti 2.2.D, yan etki):** `handleSubmit(onSubmit)` → `handleSubmit(onSubmit, onInvalid)` yapıldı (her iki client'ta). Artık form validasyonu reddedince kullanıcıya `alert("Formda eksik veya hatalı alanlar var...")` gösteriliyor — **sessiz** olma özelliği kalktı. Ama mesaj jenerik, hangi alanın sorunlu olduğunu söylemiyor (root cause fix değil, yalnızca görünürlük fix'i).
  - Playwright ile canlı doğrulandı (Parti 2.2.D verification): `console.error` çıktısı `{"sessions":[{"duration_min":{"message":"Expected number, received nan"}}]}` — artık hem console'da hem `alert()` ile görünür, ama alan hâlâ NaN üretiyor.

- **🟡 AÇIK (kısmen giderildi, Parti 2.2.D) — bulundu: 2026-07-20, Parti 2.2.C** — **new/edit program formu: `training_sessions.duration_min` boş bırakılırsa submit reddi** (`apps/web/app/(dashboard)/programs/new/new-program-client.tsx`, `apps/web/app/(dashboard)/programs/[id]/edit/edit-program-client.tsx`)
  - `week_number` ile birebir aynı kök neden: seans kartındaki "Süre (dakika)" alanı boş bırakılırsa `valueAsNumber: true` `NaN` üretiyor, `sessionSchema`'daki `duration_min: z.number().int().positive().optional().or(z.literal(undefined))` bunu reddediyor. **Kök neden hâlâ AÇIK.**
  - **Kısmen giderilen kısım (Parti 2.2.D):** yukarıdaki `week_number` maddesiyle aynı `onInvalid` eklemesi bu alanı da kapsıyor — artık sessiz değil, `alert()` gösteriyor.
  - Playwright ile canlı doğrulandı (Parti 2.2.C + tekrar Parti 2.2.D'de): `{"sessions":[{"duration_min":{"message":"Expected number, received nan", ...}}]}`. Test script'inde bu alan doldurularak (75) aşıldı — geçici workaround, kalıcı fix değil.
  - Kalıcı fix (öneri, henüz yapılmadı): `valueAsNumber: true` yerine yeni set alanlarında kullanılan `setValueAs: (v) => v === "" ? undefined : Number(v)` desenine geçmek.

- **🔴 AÇIK — bulundu: 2026-07-20, Parti 2.2.C (ExerciseList refactor) doğrulaması sırasında** — **new/edit program formu: `start_date`/`end_date` boş bırakılırsa Postgres insert reddi** (`apps/web/app/(dashboard)/programs/new/new-program-client.tsx`, `apps/web/app/(dashboard)/programs/[id]/edit/edit-program-client.tsx`)
  - `start_date`/`end_date` alanları boş bırakılırsa `register("start_date")` `""` (boş string) döndürüyor; `programSchema`'da `z.string().optional()` bunu geçerli kabul ediyor (boş string de bir string). `onSubmit`'teki `start_date: data.start_date ?? null` yalnızca `null`/`undefined`'ı yakalıyor, `""`'ı yakalamıyor — sonuç olarak Postgres'in `date` kolonuna `""` gönderiliyor ve insert `invalid input syntax for type date: ""` hatasıyla reddediliyor.
  - Playwright ile canlı doğrulandı: form validasyonunu geçiyor (title/team/week_number/phase doluyken), ama Supabase REST `POST /training_programs` **400** dönüyor, uygulama bunu `alert()` ile kullanıcıya gösteriyor (bu kısmı sessiz değil — diğer ikisinin aksine en azından bir hata mesajı çıkıyor, ama mesaj teknik ve kullanıcı için anlamsız: "invalid input syntax for type date: \"\"").
  - Fix: `?? null` yerine `|| null` (veya boş string'i açıkça `null`'a çeviren bir yardımcı) kullanılmalı — ama bu değişiklik ExerciseList'in kapsamı dışında, dokunulmadı.
  - **Parti 2.2.D notu:** Bu bug `onInvalid` eklemesinden ETKİLENMEDİ (zaten zod validasyonunu geçiyor, hata Postgres insert aşamasında oluşuyor ve zaten bir `alert()` ile gösteriliyordu — "sessiz" değildi, sadece mesaj teknikti). Parti 2.2.D doğrulaması sırasında test script'inde `start_date`/`end_date` doldurularak aşıldı (workaround), hâlâ AÇIK.

- **🔴 AÇIK — bulundu: 2026-07-20, Parti 2.2.D (set bazlı UI) sırasında, madde 6 (deprecated kolon taraması)** — **mobil `ExerciseCard.tsx` hâlâ deprecated `exercises` kolonlarını okuyor** (`apps/mobile/components/ExerciseCard.tsx`)
  - Parti 2.2.D web tarafında (new/edit program builder) egzersiz insert'lerini artık `exercise_sets`'e yazıyor, `exercises.sets`/`reps`/`load_kg`/`load_percent`/`unit` kolonlarına hiç yazmıyor (hepsi null kalıyor). `apps/mobile/components/ExerciseCard.tsx:12-27` (`formatLoad`/`formatVolume`) hâlâ bu kolonları okuyor — bu partiden sonra web'de oluşturulan/düzenlenen HER programda sporcu mobil uygulamada egzersiz kartlarını **boş/varsayılan** görecek (`sets` `?? 1` fallback'i yüzünden "1 × undefined tekrar" gibi anlamsız bir volume metni, yük rozetinin hiç görünmemesi).
  - Talimat gereği bu partide (2.2.D) DOKUNULMADI — mobil güncellemesi CLAUDE.md § Agent 4/6 kapsamında Parti 7'de (mobil "yaptım" akışı) ele alınmalı: `ExerciseCard` `exercise_sets` join'i okuyacak şekilde güncellenmeli.
  - Not: `apps/web/components/features/exercises/*` dosyalarındaki `load_type` referansları FARKLI bir kavram (platform_exercises/org_exercises katalog metadata'sı), bu bug'la ilgisi yok — taranmadı.

---

## Düşük (kozmetik / tamamlanmamış)

- **✅ FIXED (PARTİ 4 — 2026-07-01)** — **`apps/web/components/features/landing/landing-page.tsx:1`** : Layout dosyası (`@/app/(marketing)/layout`) bir component olarak import edilip `<MarketingLayout>` şeklinde kullanılıyordu. → Nav + footer içeriği yeni paylaşılan component'e çıkarıldı: [marketing-shell.tsx](apps/web/components/shared/marketing-shell.tsx) (`MarketingShell`). Hem `(marketing)/layout.tsx` (Next.js layout olarak KALDI, artık `MarketingShell` render ediyor) hem de `landing-page.tsx` bu shell'i kullanıyor — layout dosyası artık component gibi import EDİLMİYOR. Build başarılı, `/` prerender korundu, görsel çıktı aynı (aynı JSX taşındı).

- **✅ FIXED (PARTİ 1)** — **Supabase: helper fonksiyonlar `search_path` mutable** (advisor WARN) : `my_role`, `my_team_id`, `is_super_admin`, `calculate_acwr`, `get_athlete_programs`, `update_updated_at` fonksiyonlarında `search_path` set edilmemiş. → `009_security_fixes.sql` ile 6 fonksiyon `set search_path = ''` + tüm tablo referansları `public.` prefix'li olarak yeniden yazıldı (advisor WARN temizlendi). NOT: `EXECUTE` yetkisi geri alımı (anon/authenticated RPC exposure) bu partinin kapsamı dışında, ayrı bulgu olarak duruyor. : SECURITY DEFINER fonksiyonlar için güvenlik sertleştirme eksik; ayrıca bu fonksiyonlar anon/authenticated rolüne RPC olarak açık. : Fonksiyonlara `set search_path = ''` ekle ve gereksiz `EXECUTE` yetkilerini geri al.

- **⚠️ WONTFIX (şimdilik) — 2026-07-18, Parti 2.1 doğrulaması sırasında bulundu** — **Migration sıralama hatası: `008_rls_signup.sql` / `009_security_fixes.sql`, `010_trial.sql`'den önceki trial kolonlarına referans veriyor**
  - 008_rls_signup.sql / 009_security_fixes.sql, organizations.owner_id/plan_status/trial_ends_at kolonlarına 010_trial.sql'den önce referans veriyor — sıfırdan "supabase db reset" bu yüzden bozuluyor (cloud etkilenmiyor, gerçek apply sırası farklıydı). Trial/plan sistemi Madde 1 kapsamında kaldırılacağı için bu, Parti 8'de (plan/landing temizliği) migration'lar konsolide edilirken çözülecek. WONTFIX şimdilik.

- **⏳ KULLANICI AKSİYONU (PARTİ 4'te talimat verildi) — Supabase: Leaked password protection kapalı** (advisor WARN) : HaveIBeenPwned kontrolü devre dışı. Bu bir KOD bug'ı değil, Supabase Dashboard ayarı — kullanıcı manuel yapacak. **Adımlar:** Dashboard (`nlmwcygmbbxmfpsubvmh`) → sol menü **Authentication** → **Sign In / Providers** (bazı sürümlerde **Policies**) altında **Password** bölümü → **"Leaked password protection"** (a.k.a. "Prevent use of compromised passwords" / HaveIBeenPwned) toggle'ını **AÇIK** yap → **Save**. Kaydettikten sonra `get_advisors` tekrar çalıştırılıp WARN'ın kalktığı doğrulanabilir.

- **✅ FIXED (PARTİ 4 — 2026-07-01)** — **`exercises` tablosu — ölü kolonlar** : `load_percent_1rm`, `rpe_target`, `load_type` kolonları şemada vardı (005) ama program builder UI'ı bunları hiç yazmıyordu (yalnızca `load_kg`/`load_percent` persist ediliyordu). → Kolonlar SİLİNMEDİ (gelecek özellik için doğru tasarım). Bunun yerine [new-program-client.tsx](apps/web/app/(dashboard)/programs/new/new-program-client.tsx) builder'ına **yük tipi seçici** eklendi: her egzersiz satırında `kg / %1RM / RPE` dropdown'ı (`load_type`), seçime göre ilgili input alanı görünüyor (mutlak kg → `load_kg`, `absolute_kg`; 1RM % → `load_percent_1rm`, `percentage_1rm`; RPE → `rpe_target`, `rpe`). `exerciseSchema`'ya 3 alan (Zod), `onSubmit` insert'ine 3 kolon eklendi; kaydederken yalnızca aktif yük tipinin kolonu doldurulur, diğerleri `null` (temiz veri). `exercises.load_type`'ta CHECK constraint yok — değer çakışması riski yok. **Edit builder de eşitlendi:** [edit-program-client.tsx](apps/web/app/(dashboard)/programs/[id]/edit/edit-program-client.tsx) delete-then-reinsert yaptığı için aynı 3 alan schema/defaultValues (mevcut değerleri yükler)/insert/UI'a eklendi — aksi halde bir programı düzenlemek RPE/1RM verisini sıfırlardı (veri kaybı tuzağı kapatıldı). **Detay görünümü** [program-detail-client.tsx](apps/web/app/(dashboard)/programs/[id]/program-detail-client.tsx) yük kolonu artık `%X 1RM` / `RPE X` / `X kg` gösteriyor. tsc/build/eslint temiz (0 error). NOT: Mobil `ExerciseCard` (sporcu görünümü) yalnızca kg gösteriyor — bu parti "mobile'a dokunma" kapsamında bırakıldı, gelecekte eşitlenebilir (kozmetik, veri kaybı yok).

- **✅ FIXED (PARTİ 3 — 2026-07-01)** — **Local/Cloud migration isim sapması** : `supabase migration list` çıktısı: local 001-004 cloud ile eşleşiyordu; ancak local `005,006,008,009,010` cloud'da timestamp-prefix (`20260626200754`, `20260626200950`, `20260629181355`=add_superset_columns, `20260629184316`, `20260629190825`, `20260630122720`) olarak kayıtlıydı — 6 cloud vs 5 local (fark: silinen superset migration'ının cloud karşılığı). → Kullanıcı onayıyla `supabase migration repair` çalıştırıldı: 6 timestamp kaydı `reverted`, local `005/006/008/009/010` `applied` işaretlendi. `migration list` artık her satırda Local = Remote. Şema değişmedi, yalnızca geçmiş tablosu hizalandı.

- **✅ FIXED (PARTİ 4 — 2026-07-01)** — **PROGRESS.md doc sapması** : PROGRESS.md `(marketing)/page.tsx` var diyordu; gerçekte landing kök `app/page.tsx`'te `LandingPage` component'i olarak render ediliyor, `(marketing)/` altında yalnızca `demo/` + `layout.tsx` var. → PROGRESS.md landing/marketing bölümü gerçek dosya yapısına göre güncellendi (landing-page.tsx + marketing-shell.tsx yansıtıldı, migration listesi 010'a kadar doğrulandı).

- **✅ FIXED (PARTİ 4 — 2026-07-01)** — **`apps/mobile/app/(tabs)/program/index.tsx`** : Realtime aboneliği `filter: is_published=eq.true` kullanıyordu; Postgres realtime filtresi yalnızca yeni satır filtreye uyduğunda fire ettiği için unpublish (true→false) olayını kaçırıyor, program ekranda takılı kalıyordu. → Subscription'dan `filter` KALDIRILDI; artık tüm `training_programs` INSERT/UPDATE/DELETE event'leri dinleniyor ve her değişimde `fetchPrograms` yeniden çalışıyor. `fetchPrograms` zaten `.or(athlete_id/team_id)` + `.eq(is_published,true)` ile filtrelediği için bu sporcuya ait olmayan veya unpublish edilmiş programlar sonuçtan otomatik düşüyor. DELETE event'inde `payload.old` yalnızca PK içerebildiğinden client-side eşleştirme yerine koşulsuz refetch tercih edildi (sorgu `limit 5`, ucuz). Yalnızca bu dosya değişti (mobile'ın başka yerine dokunulmadı). NOT: mobile tsc'de önceden var olan `@athleteiq/db/types` çözümleme hataları bu değişiklikten bağımsız (clean tree'de de 20 hata) — bu edit yeni hata eklemedi.

---

## Özet (Kategori Bazında)

| Kategori | Sayı | Bug'lar |
|----------|------|---------|
| 🔴 **Kritik** | 3 | ✅ `/program` route uyumsuzluğu (PARTİ 1), ✅ rol cookie miras bug'ı (ROL CACHE), ✅ logout guard bloklama (LOGOUT GUARD) |
| 🟠 **Yüksek** | 3 | ✅ `/tests` stub (PARTİ 2), ✅ `/wearables` stub (PARTİ 2), ✅ `packages/ui` TS2322 (PARTİ 2) |
| 🟡 **Orta** | 9 | ✅ bayat types.ts (PARTİ 2), ✅ 007 migration çakışması (PARTİ 3), ✅ ESLint config yok (PARTİ 3), ✅ SECURITY DEFINER view (PARTİ 1), ✅ RLS policy'siz 2 tablo (PARTİ 1), 🟡 `week_number` submit reddi (AÇIK, "sessiz" kısmı Parti 2.2.D'de giderildi, kök neden değil), 🟡 `duration_min` submit reddi (AÇIK, aynı), 🔴 `start_date`/`end_date` boşsa Postgres insert reddi (AÇIK, değişmedi), 🔴 mobil `ExerciseCard` deprecated kolon okuyor (AÇIK, Parti 2.2.D'de bulundu, Parti 7 kapsamı) |
| ⚪ **Düşük** | 8 | ✅ landing layout import (PARTİ 4), ✅ search_path mutable (PARTİ 1), ⏳ leaked-password (kullanıcı aksiyonu), ✅ ölü kolonlar (PARTİ 4), ✅ migration isim sapması (PARTİ 3), ✅ PROGRESS.md drift (PARTİ 4), ✅ mobile realtime unpublish (PARTİ 4), ⚠️ 008/009 trial kolon sıralaması (WONTFIX, Parti 8'e ertelendi) |
| **TOPLAM** | **23** | **17 ✅ FIXED**, 5 açık kod bug'ı (1 ⚠️ WONTFIX Parti 8'e ertelendi, 2 🟡 kısmen giderildi/kök neden AÇIK, 2 🔴 tam AÇIK — biri new/edit program formu date insert reddi, biri mobil deprecated kolon okuma), 1 ⏳ kullanıcı aksiyonu (Supabase Dashboard ayarı) |

> **PARTİ 2.2.D (2026-07-20) — Set bazlı UI doğrulaması:** `handleSubmit(onSubmit, onInvalid)` eklenmesiyle `week_number`/`duration_min` bug'larının "sessiz" olma özelliği giderildi (artık `alert()` gösteriliyor) — kök neden (NaN üreten `valueAsNumber`) hâlâ AÇIK, dokunulmadı (kapsam dışı). Deprecated kolon taraması sırasında yeni bir AÇIK bug bulundu: mobil `ExerciseCard.tsx` hâlâ `exercises.sets/reps/load_kg/load_percent/unit` okuyor — bu partiden sonra web'de oluşturulan programlarda mobilde egzersiz kartları eksik/anlamsız görünecek (Parti 7 kapsamında ele alınmalı).

> **PARTİ 2.2.C (2026-07-20) — ExerciseList refactor doğrulaması:** ExerciseList'i paylaşılan bileşene taşıma sırasında (görev kapsamı dışında, çevresindeki form/schema kodunda) 3 yeni AÇIK bug bulundu — `week_number` ve `duration_min` boş bırakılırsa `NaN` yüzünden sessiz submit reddi, `start_date`/`end_date` boş bırakılırsa `""` Postgres'e gönderilip insert reddediliyor. Üçü de fix edilmedi (kapsam dışı), yalnızca kayda geçirildi.

> **PARTİ 4 (2026-07-01) — Kozmetik + son temizlik:** İş 1 (mobile realtime unpublish) ✅, İş 2 (landing layout import → `MarketingShell`) ✅, İş 3 (ölü kolonlar → yük tipi seçici, hem new hem edit builder + detay görünümü) ✅, İş 4 (leaked-password) → kullanıcıya adım adım talimat verildi (manuel Dashboard ayarı), İş 5 (PROGRESS.md + BUGS.md finalize) ✅.
>
> **Envanter durumu: 0 açık kod bug'ı.** Kalan tek madde leaked-password olup bir Supabase Dashboard toggle'ı (kod değil) — kullanıcı elle açacak.
>
> **PARTİ 3 (2026-07-01) — Altyapı hijyeni:** İş 1 (gizli bağımlılıklar) ✅, İş 2 (007 çift prefix) ✅, İş 3 (local/cloud migration repair — kullanıcı onayıyla hizalandı) ✅, İş 4 (ESLint kurulumu) ✅ FIXED.

### Elenen Yanlış Pozitifler (subagent abartıları — BUGS.md'ye dahil EDİLMEDİ)
- ❌ "Landing page layout import'u sayfayı çökertiyor" → YANLIŞ (build başarılı, statik prerender). Sadece kod kokusu olarak Düşük'e indirildi.
- ❌ "Landing page'de `use client` eksik" → YANLIŞ (hiç event handler yok, saf server component).
- ❌ "ExerciseCard `load_percent` yanlış kolon" → YANLIŞ (`load_percent` geçerli kolon, builder de yazıyor).
- ❌ "007 migration reapply'de fail olur" → YANLIŞ (`if not exists` idempotent).
- ❌ "Trial kolonları type hatası verir" → YANLIŞ (`as any` ile bypass edilmiş, çökme yok).
