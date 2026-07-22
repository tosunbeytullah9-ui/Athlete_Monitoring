# AthleteIQ — Proje Durumu

> Son güncelleme: 2026-07-22 (**Parti 3.F — sonraki haftalara uygula, Parti 3 tamamen kapandı** — yeni `copy_program_tree`/`propagate_week_to_future` RPC'leri (`021_propagate_week.sql`) bir haftanın kaydedilmiş session/exercise/exercise_sets ağacını aynı bloktaki sonraki haftalara kopyalar, hedeflerin kendi start_date/end_date/week_number/notes'una dokunmadan; yetkilendirme 018/020 ile birebir aynı coalesce deseni. `edit-program-client.tsx`'e "Sonraki Haftalara Uygula" butonu eklendi (Kaydet'ten ayrı aksiyon, onay penceresinde etkilenecek haftaları açıkça listeliyor), yalnızca block_id'li ve son olmayan haftalarda görünüyor. `packages/db/types.ts` bu partide regen edildi (program_blocks/block_id/week_index_in_block + tüm RPC imzaları artık tipli — 3.B'den beri ertelenen regen). Yerelde (rollback dahil, tetikleyici trigger'la simüle edilmiş çok-hedefli kesinti senaryosu) ve canlıda (gerçek Auth JWT + PostgREST) uçtan uca doğrulandı. **Parti 3 (3.B → 3.F) bu partiyle tamamen kapandı** — üst-özet için § Parti 3 Kapanış Özeti. Detay: § Parti 3.F)
> Önceki: 2026-07-22 (**Parti 3.E — düzenleme akışı transactional RPC'ye taşındı** — 018'in session→exercise→exercise_sets insert mantığı paylaşılan `insert_sessions_tree()` fonksiyonuna çıkarıldı (019, davranış değişikliği yok — 3.C test seti tekrarlandı, birebir aynı sonuç), yeni `update_program_week` RPC'si (020) eklendi (training_programs.programs_write ile birebir aynı yetkilendirme, coalesce zorunlu, week_number her zaman start_date'ten yeniden hesaplanıyor, tüm alan+ağaç güncellemesi TEK transaction). `edit-program-client.tsx` artık bu RPC'yi çağırıyor — eski delete-then-reinsert (transactionsız, sıralı insert) kodu tamamen kaldırıldı. `week_number`/`end_date` input'ları kaldırıldı (start_date zorunlu, end_date otomatik +6 gün); BUGS.md'deki start_date/end_date bug'ı bu dosya için de kapandı. Program kapsamı (takım/sporcu) artık düzenlenemez hale geldi — RPC'nin imzasında yok, bilinçli karar (aşağıda detaylı). `buildSessionsPayload`/`mapRpcError` `apps/web/lib/program-rpc.ts`'e çıkarıldı, iki client de oradan import ediyor. Gerçek TGF/İbrahim verisiyle uçtan uca doğrulandı (Hipertrofi programı düzenlenip eski haline geri döndürüldü). Detay: § Parti 3.E)
> Önceki: 2026-07-21 (**Parti 3.D — wizard RPC'ye bağlandı** — `new-program-client.tsx` artık `create_program_with_weeks` RPC'sini çağırıyor; eski sıralı insert kodu (training_programs→sessions→exercises→exercise_sets tek tek) tamamen kaldırıldı. `week_number`/`end_date` input'ları wizard'dan silindi (RPC bunları otomatik türetiyor), yerine `weeks_count` (1-12, varsayılan 1) eklendi; `start_date` artık zod seviyesinde zorunlu (BUGS.md'deki start_date/end_date bug'ının start_date kısmı bu partiyle kapandı). `edit-program-client.tsx`'e DOKUNULMADI (Parti 3.E kapsamı). Detay: § Parti 3.D)
> Önceki: 2026-07-21 (**Parti 3.C — create_program_with_weeks RPC** — çok haftalı program+hafta ağacını TEK transaction'da oluşturan security definer fonksiyon (`018_create_program_with_weeks.sql`), cloud'a push edildi. Doğrulama sırasında KRİTİK bir yetkilendirme bug'ı bulundu ve düzeltildi (bkz. § Parti 3.C). SADECE FONKSİYON — hiçbir UI henüz çağırmıyor. Detay: § Parti 3.C)
> Önceki: 2026-07-21 (**Parti 3.B — program_blocks şeması** — çok haftalı program grubu (blok) kavramı için yeni `program_blocks` tablosu + `training_programs.block_id`/`week_index_in_block` kolonları, cloud'a push edildi ve RLS simülasyonuyla doğrulandı. Tamamen additive, hiçbir UI henüz bu tabloyu okumuyor. Detay: § Parti 3.B)
> Önceki: 2026-07-21 (**Parti 2.2.F — Tonaj özet metriği (Parti 2'nin son adımı)** — program detay sayfası artık her seans ve programın tamamı için toplam tonajı (kg) hesaplayıp gösteriyor; %1RM setleri sporcunun en güncel 1RM kaydından çözülüyor, kayıt yoksa set tonaja dahil edilmeyip ayrı sayılıyor, vücut ağırlığı/bant setleri kg değil tekrar sayısıyla ayrı gösteriliyor. **Parti 2 (2.1 → 2.2.F) bu partiyle tamamen kapandı** — üst-özet için § Parti 2 Kapanış Özeti. Detay: § Parti 2.2.F)
> Önceki: 2026-07-20 (**Parti 2.2.E — 1RM manuel giriş formu + mevcut query'leri bağlama** — `/tests` sayfasına "1RM Kayıtları" alt-bölümü eklendi (liste + ekleme formu, `create1RMRecord`/`getAthleteMaxes` mevcut haliyle çağrılıyor), program builder'ın ExercisePickerModal'ına `athleteMaxes` prop'u bağlandı ("Son max" rozeti artık görünüyor). Detay: § Parti 2.2.E)
> Önceki: 2026-07-20 (**Parti 2.2.D — set bazlı UI, uçtan uca kablolama** — program builder artık egzersiz başına tek satırlık grid yerine set listesi kullanıyor (kg/%1RM/vücut ağırlığı/direnç bandı + RPE, set başına), `exercise_sets` tablosuna yazıyor/okuyor. Detay: § Parti 2.2.D)
> Önceki: 2026-07-20 (**Parti 2.2.C — ExerciseList paylaşılan bileşene taşındı (davranış değişikliği yok)** — new/edit program builder'daki birebir aynı egzersiz listesi alt-bileşeni `apps/web/components/features/program-builder/exercise-list.tsx`'e çıkarıldı. Detay: § Parti 2.2.C)
> Önceki: 2026-07-18 (**Parti 2.2.B — session_rpe şeması (atıl, Parti 6/7'de bağlanacak)** — `training_sessions.session_rpe` kolonu eklendi, cloud'a push edildi ve doğrulandı. Detay: § Parti 2.2.B)
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

### Parti 3.F — Sonraki haftalara uygula ✅ (2026-07-22)
- **Kapsam:** `supabase/migrations/021_propagate_week.sql` (yeni — `copy_program_tree`, `propagate_week_to_future`), `apps/web/app/(dashboard)/programs/[id]/edit/edit-program-client.tsx` (buton + onay penceresi), `apps/web/lib/program-rpc.ts` (`mapRpcError`'a iki yeni dal), `packages/db/types.ts` (regen).
- **Önce-kontrol (talimat gereği):** `update_program_week`'in (020) kullandığı yetkilendirme — `coalesce(is_super_admin() or my_role(org)='admin' or my_role(org)='coach', false)` — canlı dosyadan doğrudan okunup `propagate_week_to_future`'a **birebir aynı** şekilde uygulandı, yeni bir mantık icat edilmedi.
- **ADIM 1 — `copy_program_tree(p_source_program_id, p_target_program_id)`:** `insert_sessions_tree`'nin (019) jsonb girdisi yerine VAR OLAN bir kaynağın session→exercise→exercise_sets ağacını doğrudan satırlardan (`select * from ... where program_id/session_id/exercise_id = ... order by order_index/set_number`) okuyup hedefe yeniden-üretilmiş ID'lerle kopyalayan kardeşi. `v_new_session_id`/`v_new_exercise_id` değişkenleriyle seviye-bazlı ID eşlemesi korunuyor. Kendi başına yetkilendirmesi yok (insert_sessions_tree ile aynı desen — çağıranın zaten kontrol ettiği varsayılıyor).
- **ADIM 2 — `propagate_week_to_future(p_source_program_id)`:** (1) org_id çekilir, bulunamazsa `program bulunamadı`; (2) yukarıdaki coalesce'li yetkilendirme; (3) `block_id is null` ise `bu program bir bloğun parçası değil`; (4) `block_id` aynı VE `week_index_in_block > kaynağın index'i` olan hedefler sayılır, `0` ise `sonraki hafta yok`; (5) her hedef için `training_sessions` silinir (CASCADE ile exercises/exercise_sets), `copy_program_tree` çağrılır — hedeflerin start_date/end_date/week_number/title/phase/notes/is_published alanlarına **dokunulmaz**; (6) tek plpgsql fonksiyonu = tek transaction, herhangi bir hedefte hata olursa önceki başarılı hedefler DAHİL tümü rollback olur; (7) dönüş `[{program_id, week_index_in_block}, ...]` jsonb dizisi.
- **DOĞRULAMA — yerel (Docker/local Supabase stack, disposable coach/athlete test kimlikleriyle, `set local role authenticated` + `set local request.jwt.claims` simülasyonu):**
  1. **(a) İçerik + izolasyon:** 4 haftalık test bloğu oluşturuldu (`create_program_with_weeks`), hafta 2 `update_program_week` ile düzenlendi (Back Squat 80→90kg, yeni Bench Press egzersizi), `propagate_week_to_future(hafta2)` çağrıldı → hafta 3 ve 4'ün seans/egzersiz/set içeriği hafta 2 ile **birebir aynı** oldu, ama kendi `start_date`/`end_date`/`week_number`/`notes` alanları **değişmedi** (oluşturulduklarındaki orijinal değerlerinde kaldı). Hafta 1 (öncesi) tamamen etkilenmedi.
  2. **(b) Son hafta:** hafta 4'te (block'un son haftası) çağrıldı → temiz `sonraki hafta yok` hatası.
  3. **(c) Bloksuz program:** seed'deki bloksuz bir programda çağrıldı → temiz `bu program bir bloğun parçası değil` hatası.
  4. **(d) Yetkisiz erişim:** disposable athlete-rollü kimlikle çağrıldı → `yetkisiz`.
  5. **(e) Rollback (çok-hedefli kesinti senaryosu):** talimatın "mümkünse geçersiz veri, değilse kesinti senaryosu" seçeneklerinden ikincisi kullanıldı — `copy_program_tree` yalnızca zaten geçerli olan kaynak satırları kopyaladığından (client'tan gelen serbest jsonb değil), 018'in `band_resistance` testindeki gibi bir "geçersiz literal" senaryosu burada doğrudan uygulanamıyordu. Bunun yerine 5 haftalık bir test bloğu kuruldu (hedefler: hafta 3, 4, 5), hafta 2 düzenlendi, ve **geçici bir `before insert on training_sessions` trigger'ı** yalnızca hafta 5'in program_id'sine yazılan insert'te `raise exception` tetikleyecek şekilde eklendi (döngü sırasıyla hafta 3 → 4 → 5 işlendiğinden, hata gelmeden önce hafta 3 ve 4 başarıyla kopyalanmış oluyor). `propagate_week_to_future(hafta2)` çağrıldı → hata, ve **hafta 3, 4, 5'in hepsi çağrı öncesi orijinal (henüz kopyalanmamış) içeriğiyle birebir aynı** kaldı — yani zaten başarıyla işlenmiş hafta 3 ve 4 de dahil, TEK transaction'ın tamamı geri alındı. Test trigger'ı hemen kaldırıldı.
  6. **(f) Temizlik:** İki test bloğu + programları + disposable kimliklerin geçici membership'leri silindi, `leftover_blocks=0`/`leftover_programs=0`/`leftover_memberships=0` doğrulandı.
- **DOĞRULAMA — canlı (Supabase Cloud `nlmwcygmbbxmfpsubvmh`, gerçek admin Auth JWT'siyle `/rest/v1/rpc/*` PostgREST çağrıları, İbrahim'in gerçek kimliğiyle yetkisizlik testi):**
  - (a) senaryosu gerçek TGF org/ACE takımıyla tekrarlandı — 4 haftalık gerçek blok, hafta 2 güncellendi, `propagate_week_to_future` → hafta 3/4 içeriği birebir kopyalandı, kendi `start_date`/`end_date`/`week_number`/`notes` değişmedi (HTTP 200), hafta 1 etkilenmedi.
  - (b) son haftada (hafta 4) çağrıldı → HTTP 400, `sonraki hafta yok`.
  - (c) İbrahim'in gerçek, yayında, bloksuz **Hipertrofi** programında çağrıldı → HTTP 400, `bu program bir bloğun parçası değil`; öncesi/sonrası session/exercise/set join-count fingerprint'i **değişmeden** kaldı (madde i'nin istediği "hiç etkilenmedi" doğrulaması).
  - (d) İbrahim'e geçici `athlete` membership'i verilip onun gerçek `user_id`'siyle simüle edildi → `yetkisiz`; geçici membership hemen silindi.
  - UI'ın `useEffect`'inin kullandığı sorgu şekli (`block_id=eq....&week_index_in_block=gt....&order=week_index_in_block.asc`) gerçek JWT + gerçek RLS ile ayrıca test edildi — beklenen sonraki haftaları (2, 3) doğru döndürdü.
  - Test verisi (blok + programlar) silindi, `total_blocks=0`'a geri döndü (bu partiden önce de 0'dı — canlıda hâlâ hiçbir gerçek çok-haftalı blok yok, hepsi legacy/bloksuz).
- **ADIM 3 — UI (`edit-program-client.tsx`):** Program `block_id`'ye sahipse VE aynı blokta kendisinden sonraki en az bir hafta varsa (bu ikisi TEK bir `useEffect` sorgusuyla, mount anında belirleniyor — talimatın "tıklanınca sorgula" ifadesinin ruhu korunuyor, ama aynı sorgu hem buton görünürlüğünü hem onay penceresinin listesini besliyor, gereksiz ikinci bir round-trip'ten kaçınmak için) "Sonraki Haftalara Uygula" butonu **Kaydet butonundan ayrı**, altında görünüyor. Tıklanınca onay penceresi etkilenecek haftaları AÇIKÇA listeliyor ("Hafta 3, Hafta 4 — devam edilsin mi?") ve ayrıca RPC'nin formun kaydedilmemiş state'ini değil, programın **DB'deki son kaydedilmiş halini** kopyaladığını hatırlatan bir not gösteriyor (talimatın "önce kaydet, sonra yay" sıralamasının neden ayrı tutulduğunu netleştirmek için, düşük riskli/faydalı bir ek açıklama). Onaylanınca `propagate_week_to_future` çağrılır, `mapRpcError` (iki yeni dal eklendi: "bloğun parçası değil"/"sonraki hafta yok" — buton normalde bu durumlarda hiç görünmez, ama başka bir sekmede eşzamanlı değişiklik olursa RPC yine de reddedebilir) ile aynı hata gösterme deseni kullanılıyor, başarıda kısa bir onay mesajı gösteriliyor.
- **Yan bulgu — `packages/db/types.ts` regen edildi (3.B'den beri ertelenen iş, bu partide gerekli hale geldi):** `program.block_id`/`week_index_in_block` okumak için `Tables<"training_programs">`'ın bu iki kolonu içermesi gerekiyordu. `supabase gen types typescript --local` ile regen edildi — tamamen additive diff (yeni `program_blocks` tablosu, `block_id`/`week_index_in_block` kolonları, 5 RPC imzası: `copy_program_tree`/`create_program_with_weeks`/`insert_sessions_tree`/`propagate_week_to_future`/`update_program_week`). CLI sürüm farkı yüzünden dosyanın üst yapısı da değişti (`__InternalSupabase.PostgrestVersion` markörü kalktı, `graphql_public` şeması eklendi) — bu zararsız: `createBrowserClient<Database, "public">(...)`/`createServerClient<Database, "public">(...)` (apps/web/lib/supabase/client.ts, server.ts) zaten şema adını **açıkça** "public" olarak geçiyor, marköre dayanan otomatik çıkarıma hiç ihtiyaç duymuyor. Regen sonrası `@athleteiq/db`, `@athleteiq/web`, `@athleteiq/validators`, `@athleteiq/integrations`, `@athleteiq/ui` tsc'leri 0 hata.
- **DOĞRULAMA — build/type-check:** `pnpm --filter web build` → 0 hata (yalnızca önceden var olan uyarılar). `pnpm turbo run type-check` → 5/5 paket temiz (mobile'da script yok, önceki partilerin de gördüğü durum).
- **Kapsam dışı bırakılan (bilinçli):** Gerçek tarayıcı/Playwright doğrulaması (araç bu ortamda mevcut değil — 3.D/3.E'nin de kaydettiği kısıt); onun yerine gerçek admin Auth JWT'siyle gerçek PostgREST çağrıları (RPC'ler + UI'ın kullandığı SELECT sorgusunun kendisi) kullanıldı.

### Parti 3 Kapanış Özeti — 3.B'den 3.F'ye ✅ (2026-07-22)

Parti 3, tek haftalık programları çok-haftalı **bloklara** genişletti: oluşturma, düzenleme ve bir haftanın içeriğini sonraki haftalara yayma — hepsi transactional RPC'lerle, ayrı ayrı doğrulanmış coalesce'li yetkilendirmeyle. Görev talimatı "3.A'dan 3.F'ye" diyordu; PROGRESS.md/BUGS.md'de ayrı etiketlenmiş bir "3.A" bulunmuyor — bu grubun ilk kaydı **3.B**'dir (program_blocks şeması), bu yüzden özet 3.B'den başlıyor (uydurulmadı, mevcut kayıtla doğrulandı).

| Alt-parti | Ne yaptı | Yeni tablo/RPC/dosyalar |
|---|---|---|
| 3.B | `program_blocks` şeması (additive) — `training_programs.block_id`/`week_index_in_block` | `017_program_blocks.sql` |
| 3.C | `create_program_with_weeks` RPC — bir blok + N haftayı TEK transaction'da oluşturur | `018_create_program_with_weeks.sql` |
| 3.D | Wizard'ı (`new-program-client.tsx`) RPC'ye bağlama, `week_number`/`end_date` input'larını kaldırma | — (yalnızca UI) |
| 3.E | Session-tree insert mantığını `insert_sessions_tree`'ye çıkarma, `update_program_week` RPC'si, edit akışını RPC'ye taşıma | `019_shared_session_tree_insert.sql`, `020_update_program_week.sql` |
| 3.F | Bir haftanın içeriğini sonraki haftalara yayma (`propagate_week_to_future`) | `021_propagate_week.sql` |

**`week_number` artık nasıl davranıyor:** Hiçbir RPC'de `week_number` bir parametre olarak **alınmıyor** — her zaman `to_char(start_date, 'IW')::int` ile ISO 8601 takvim haftasından **yeniden hesaplanıyor** (`create_program_with_weeks`, `update_program_week` içinde; `propagate_week_to_future` bu alana hiç dokunmuyor, yalnızca kopyaladığı hedeflerin KENDİ zaten-doğru week_number'ını koruyor). Sonuç: eski manuel-girilen `week_number` değerleri (RPC'lerden önce oluşturulmuş legacy programlarda, örn. Hipertrofi) yalnızca o program RPC üzerinden düzenlendiğinde doğru ISO değerine normalize ediliyor — legacy programlar RPC'yle dokunulmadığı sürece eski (muhtemelen yanlış) değerlerini koruyor.

**Mobil hâlâ Parti 7'yi bekliyor:** Parti 2 kapanışında bulunan `ExerciseCard.tsx` deprecated-kolon bug'ı (BUGS.md, AÇIK) hâlâ çözülmedi — mobil sporcu görünümü hâlâ `exercises.sets/reps/load_kg/load_percent/unit` okuyor, `exercise_sets`'i değil. Parti 3'ün eklediği blok/propagate katmanı **web-only**; mobil tarafında block_id/week_index_in_block'a dair hiçbir okuma/gösterim yok (sporcu, aynı bloktaki farklı haftaları ayrı programlar olarak görüyor, aralarında "blok" ilişkisi mobil UI'da hiç yüzeye çıkmıyor) — bu, Parti 7 kapsamında ele alınmalı.

### Parti 3.E — Düzenleme akışı transactional RPC'ye taşındı ✅ (2026-07-22)
- **Kapsam:** `supabase/migrations/019_shared_session_tree_insert.sql` (yeni), `supabase/migrations/020_update_program_week.sql` (yeni), `apps/web/lib/program-rpc.ts` (yeni), `apps/web/app/(dashboard)/programs/[id]/edit/edit-program-client.tsx` (yeniden yazıldı), `apps/web/app/(dashboard)/programs/new/new-program-client.tsx` (yalnızca import değişikliği — `buildSessionsPayload`/`mapRpcError` paylaşılan dosyaya taşındı, mantık BİREBİR AYNI).
- **Önce-kontrol bulguları (talimat gereği, tahmin edilmedi):**
  - Canlı `pg_policies` sorgusuyla `training_programs.programs_write` politikasının TAM SQL'i doğrulandı: `for all using (is_super_admin() or my_role(org_id)='admin' or my_role(org_id)='coach')` (002_rls.sql:107-111) — **INSERT ve UPDATE için AYRI bir politika/WITH CHECK YOK**, tek "for all" policy'nin USING'i her ikisine de aynen uygulanıyor. Yani 018'in INSERT'te kullandığı yetkilendirme kontrolüyle update_program_week'in UPDATE'te kullanması gereken kontrol **birebir aynı** — org'daki herhangi bir admin/coach herhangi bir programı düzenleyebilir, `created_by`/`team_id`'ye göre ek bir kısıtlama yok. Varsayılmadı, canlı sorguyla kanıtlandı.
  - `buildSessionsPayload`/`mapRpcError`: `new-program-client.tsx`'te **inline tanımlıydı**, hiçbir paylaşılan dosyada değildi (grep ile doğrulandı) — bu partide `apps/web/lib/program-rpc.ts`'e çıkarıldı.
- **ADIM 1 — Refaktör (`019_shared_session_tree_insert.sql`):** 018'deki session→exercise→exercise_sets iç içe insert döngüsü `insert_sessions_tree(p_program_id uuid, p_sessions jsonb) returns void` adlı private (security definer, `set search_path=''`) bir fonksiyona çıkarıldı. `create_program_with_weeks` (018) `create or replace` ile güncellendi — artık kendi döngüsünü yazmıyor, `perform insert_sessions_tree(...)` çağırıyor. **Doğrulama — 3.C'nin AYNI test setini tekrarlama (local Supabase stack, Docker):** weeks_count=1 (block_id null, week_number=32, session/exercise/set ağacı girdiyle birebir) ✅, weeks_count=4 (block oluşuyor, 4 hafta ardışık week_number/start_date, 2 seans — biri boş — her haftada birebir klonlanmış) ✅, yetkisiz erişim (membership'siz kullanıcı → `ERROR: yetkisiz`, 0 leftover) ✅, rollback band_resistance ihlali (0 leftover) ✅, rollback ISO hafta-53 kenar durumu (0 leftover, block dahil) ✅ — **beşi de 3.C'nin dokümante ettiği sonuçlarla birebir eşleşti, davranış farkı YOK**. Local test için `auth.users`'a iki geçici disposable kimlik (coach + membership'siz) eklendi, test sonunda memberships temizlendi. Commit sonrası `supabase db push` ile cloud'a uygulandı.
- **ADIM 2 — Yeni RPC (`020_update_program_week.sql`):** `update_program_week(p_program_id uuid, p_title text, p_phase text, p_notes text, p_start_date date, p_end_date date, p_sessions jsonb)` — talimatın verdiği imza harfiyen uygulandı. Mantık: (1) `p_program_id`'den `org_id` çekilir, bulunamazsa `raise exception 'program bulunamadı'`; (2) yetkilendirme `coalesce(is_super_admin() or my_role(org)='admin' or my_role(org)='coach', false)` — programs_write ile birebir aynı, çıplak OR zinciri YAZILMADI (3.C'nin öğrenimi); (3) `week_number := to_char(p_start_date,'IW')::int` — parametre olarak ASLA alınmıyor; (4) `training_programs` güncellenir (title/phase/notes/start_date/end_date/week_number/updated_at); (5) `training_sessions` silinir (exercises/exercise_sets CASCADE ile, 2.2.D'de doğrulanmış davranış); (6) `insert_sessions_tree` çağrılır — hepsi tek fonksiyon çağrısı = tek transaction, herhangi bir RAISE tüm adımları (alan güncellemesi dahil) geri alır.
  - **Bilinçli tasarım kararı — kapsam (team_id/athlete_id) bu RPC'de YOK:** Talimatın verdiği imzada `p_org_id`/`p_team_id`/`p_athlete_id` yok — yani bu RPC bir programın hangi takıma/sporcuya ait olduğunu DEĞİŞTİREMEZ, yalnızca içerik (başlık/faz/not/tarih/seans ağacı) günceller. Bu, eski `edit-program-client.tsx`'in (`updateProgram` ile team_id/athlete_id de güncelleyebilen) davranışından bir **kısıtlama** — bilerek yapıldı: RPC'nin desteklemediği bir alanı UI'da editable bırakmak, kullanıcının kapsam değişikliğinin sessizce kaydedilmemesi riskini taşırdı (BUGS.md'nin defalarca bulduğu "sessiz" bug sınıfının aynısı). UI'da (Adım 3) kapsam artık salt-okunur gösteriliyor ("Takım — {ad}" / "Sporcu — {ad}", "düzenlerken değiştirilemez" notuyla).
  - **Doğrulama sırasında bulunan ikinci bilinçli fark — `is_published` bu RPC'de de YOK:** Eski akış, yayında bir program düzenlenince `is_published:false` yazıp taslağa çekiyordu (o dönem non-transactional sıralı insert'in yarım kalma riskine karşı bir güvenlik önlemiydi). Talimatın adım 4 alan listesi (`title, phase, notes, start_date, end_date, week_number`) `is_published`'ı içermiyor — yeni RPC artık bunu hiç değiştirmiyor. Bu bilerek/doğru bir sonuç: RPC tamamen atomik olduğundan (tüm ağaç TEK transaction'da değişiyor), eski önlemin var olma nedeni (yarım kalmış/bozuk bir programın sporcuya görünmesi riski) ortadan kalktı. UI'daki "unpublishWarning" ekranı ve özet adımındaki amber uyarı kutusu buna göre güncellendi — artık YALAN söylemiyor ("taslağa çekilecek" yerine "yayında kalacak, sporcular hemen görecek").
  - **Doğrulama (canlı cloud, gerçek TGF org + İbrahim/ACE verisiyle, `supabase db query --linked` ile SQL + gerçek admin/İbrahim Auth JWT'siyle PostgREST):**
    1. Geçici bir test programı oluşturuldu (`create_program_with_weeks` ile, admin kimliğiyle) — gerçek Hipertrofi/aaaaaaaaaaa verisine dokunmadan test etmek için (talimatın "tercihen bu" dediği seçenek).
    2. **(a) Güncelleme + izolasyon:** Admin kimliğiyle `update_program_week` çağrıldı (başlık/faz/not/tarih değişti, bir set güncellendi, bir egzersiz eklendi) → yalnızca hedef program değişti; Hipertrofi ve aaaaaaaaaaa'nın `session_count`/`exercise_count`/`set_count`/set-değer fingerprint'i **öncesi ve sonrası birebir aynı** kaldı.
    3. **(b) Yetkisiz erişim:** İbrahim'e geçici `athlete` rolü membership'i verildi (aynı ACE takımı), İbrahim'in kimliğiyle test programını güncellemeye çalıştı → `ERROR: yetkisiz` (P0001), program değişmedi. Geçici membership temizlendi.
    4. **(c) Rollback:** Geçersiz `band_resistance` değeriyle güncelleme denendi (title/phase/notes/start_date DAHİL tüm alanları değiştirmeye çalışan bir payload'la) → CHECK constraint hatası, **training_programs'ın title/phase/notes/start_date alanları dahil hiçbir şey değişmedi** (bir önceki başarılı güncellemenin değerleriyle birebir aynı kaldı) — talimatın istediği "kısmi güncelleme kalmamalı" doğrulandı.
    5. **(d) week_number yeniden hesaplama:** `p_start_date='2026-09-08'` için RPC `week_number=37` yazdı; bağımsız `to_char('2026-09-08','IW')::int` sorgusu da `37` döndürdü — birebir eşleşti.
    6. Test verisi (geçici program) silindi, İbrahim'in geçici membership'i kaldırıldı, `leftover=0` her ikisinde de doğrulandı, toplam program sayısı orijinal `6`'ya döndü.
- **ADIM 3 — UI:**
  - `apps/web/lib/program-rpc.ts` (yeni): `buildSessionsPayload`, `mapRpcError`, `setToInsertColumns`, `SessionFormValues` tipi — `new-program-client.tsx`'teki tanımların **birebir aynısı** (davranış değişikliği yok, yalnızca konum değişti). `new-program-client.tsx` artık buradan import ediyor, kendi local tanımlarını sildi.
  - `edit-program-client.tsx` tamamen yeniden yazıldı: eski delete-then-reinsert sıralı kod (training_sessions delete + döngüde tek tek `insert().select().single()` — 3 tablo, transactionsız) silindi, tek `db.rpc("update_program_week", {...})` çağrısıyla değiştirildi.
  - `week_number`/`end_date` input'ları kaldırıldı (`new-program-client.tsx`'teki gibi). `start_date` artık `.min(1, "Başlangıç tarihi gerekli")` ile zorunlu — BUGS.md'deki start_date/end_date bug'ının bu dosya için AÇIK kalan kısmı bu partiyle kapandı (aşağıda BUGS.md güncellendi). `end_date`, `deriveEndDate(start_date)` (start+6 gün, UTC-safe) ile client'ta hesaplanıp RPC'ye `p_end_date` olarak geçiliyor — RPC'nin kendisi (018'in aksine) bunu bir parametre olarak aldığından (talimatın verdiği imza), 018'deki gibi DB içi otomatik türetme YOK, ama UI hiçbir zaman bu alanı göstermiyor/kullanıcıya doldurtmuyor, tıpkı new-program-client'taki gibi.
  - `weeks_count` YOK (talimat gereği — tek hafta düzenleniyor, çoğaltma yok).
  - Hata gösterimi `new-program-client.tsx` ile tutarlı: aynı `mapRpcError`, aynı inline kırmızı çerçeveli hata kutusu (`submitError` state).
  - `packages/db/queries/programs.ts`'teki `updateProgram` fonksiyonuna DOKUNULMADI (görev kapsamı dışı, artık hiçbir yerden çağrılmıyor ama silinmedi — export edilmiş paylaşılan bir fonksiyon, gelecekte başka bir akış kullanabilir).
- **DOĞRULAMA (gerçek PostgREST + gerçek Auth JWT, Playwright bu ortamda mevcut değildi — Parti 2.2.F/3.D'deki aynı araç kısıtı):**
  1. `pnpm --filter web build` → 0 hata (yalnızca önceden var olan uyarılar + `edit-program-client.tsx`'teki pre-existing `_orgId` unused-var uyarısı, `useMemo` eksik bağımlılık uyarısı düzeltildi). `pnpm turbo run type-check` → 5/5 paket temiz (mobile'da script yok, önceki partilerin de gördüğü durum).
  2. **Gerçek uçtan uca düzenleme (İbrahim'in gerçek "Hipertrofi" programı, TGF org, admin'in gerçek Auth JWT'siyle — email/password grant ile canlı alındı, tıpkı Parti 3.D'nin yöntemi):** `buildSessionsPayload`'ın üreteceği JSON birebir elle türetilip gerçek `/rest/v1/rpc/update_program_week` endpoint'ine POST edildi (Back Squat set1 80→82.5kg, yeni "Romanian Deadlift" egzersizi eklendi, Bench Press değişmedi) → HTTP 204. DB doğrulaması: değişiklikler birebir yansımış, `end_date` 2026-06-30→2026-07-02 (start+6, otomatik), `week_number` 3→26 (**beklenen** — Hipertrofi RPC'lerden ÖNCE, eski manuel-girilen week_number ile oluşturulmuştu; `to_char('2026-06-26','IW')::int` bağımsız sorguyla da `26` çıktı, yani eski "3" değeri hiçbir zaman gerçek ISO haftası değildi, RPC onu artık doğru değere normalize ediyor — kalıcı ve doğru bir yan etki, bug değil). Aynı anda "aaaaaaaaaaa" programının fingerprint'i (session/exercise/set sayısı + set değerleri) **değişmeden** kaldı.
  3. **Gerçek veri geri yüklendi:** Aynı RPC'ye orijinal Back Squat/Bench Press verisiyle (Romanian Deadlift olmadan) tekrar POST edildi → Hipertrofi'nin içeriği (isim/kg/tekrar/rest_sec) orijinaliyle birebir aynı doğrulandı (yalnızca `week_number` kalıcı olarak 26'da kaldı — RPC'nin deterministik yeniden-hesaplamasının doğal sonucu, her iki çağrıda da aynı start_date için aynı sonucu üretti).
  4. **Regresyon — `new-program-client.tsx` (yalnızca import değişti):** Aynı gerçek JWT ile `create_program_with_weeks`'e (paylaşılan `program-rpc.ts`'in üreteceği payload şekliyle) POST edildi → HTTP 200, program doğru oluşturuldu (`week_number` ISO ile otomatik, `end_date` start+6) → refaktörün wizard akışını bozmadığı doğrulandı. Test programı silindi.
  5. Test verisi/geçici membership'ler temizlendi, toplam program sayısı `6`'ya döndü (leftover=0).
- **Kapsam dışı bırakılan (bilinçli):** `packages/db/types.ts` RPC regen'i (dosyaların kendi `any` cast'i yeterli, önceki partilerin de izlediği desen). Program kapsamını (team/athlete) değiştirebilen ayrı bir RPC/akış (istenirse ayrı bir parti olarak ele alınabilir). Gerçek tarayıcı/Playwright doğrulaması (araç bu ortamda mevcut değil — gerçek PostgREST + gerçek Auth JWT + gerçek veri kullanıldı, en güçlü alternatif).

### Parti 3.D — Wizard'ı RPC'ye bağlama, week_number/end_date kaldırma ✅ (2026-07-21)
- **Kapsam:** SADECE `apps/web/app/(dashboard)/programs/new/new-program-client.tsx`. `edit-program-client.tsx`'e talimat gereği dokunulmadı (Parti 3.E kapsamı, legacy programları düzenlemek için mevcut delete-then-reinsert akışı olduğu gibi çalışmaya devam ediyor).
- **Önce-kontrol bulguları (talimat gereği, tahmin edilmedi):**
  - `exerciseSchema`/`exerciseSetSchema` (2.2.D'de `exercise-list.tsx`'e taşındı) TAM alan adları çıkarıldı: set şeması `reps`/`duration_sec`/`load_type`/`load_kg`/`percent_1rm`/`band_resistance`/`rpe`/`notes` (form-only `load_type`, DB'de karşılığı yok — hangi kolonun dolu olduğundan türetiliyor); egzersiz şeması `name`/`category`/`is_duration_based`/`rest_sec`/`notes`/`superset_group`/`superset_order`/`exercise_sets[]`. RPC'nin `p_sessions` jsonb'si bu alanları DEĞİL, kendi `->>'...'` okumalarını (`sets`, `reps`, `load_kg`, `percent_1rm`, `is_bodyweight`, `band_resistance`, `rpe` — bkz. 018_create_program_with_weeks.sql:171-187) bekliyor — en kritik fark: RPC set listesini `"sets"` anahtarı altında okuyor, form state'indeki `"exercise_sets"` değil. `buildSessionsPayload` mapping fonksiyonu bu ayrımı gözeterek yazıldı (yanlış isimle sessizce boş dizi/null üretme riski böylece kapatıldı).
  - `end_date` grep taraması: `program-detail-client.tsx`, `edit/edit-program-client.tsx`, `new-program-client.tsx` (bu partiden önce), `programs-client.tsx`, `athlete-detail-client.tsx`, `packages/validators/program.ts` (kullanılmayan eski bir şema, hiçbir client bunu import etmiyor) — hepsi salt-okunur gösterim (`{new Date(program.end_date)...}`), hiçbiri bağımsız bir yazma yolu değil. Bu yüzden `end_date`'i `start_date+6` olarak RPC içinde otomatik türetmek (zaten 018'in tasarımı) güvenli — hiçbir okuma noktası bozulmuyor.
  - `week_number` grep taraması: yukarıdakilere ek olarak `apps/mobile/app/(tabs)/program/index.tsx:204` (`Hafta {activeProgram.week_number}`) ve `apps/web/app/(dashboard)/athletes/[id]/page.tsx:18` (server sorgusunda `select(...week_number)`, salt görüntüleme). Hepsi salt-okunur — mobil zaten Parti 7'yi bekliyor (BUGS.md'deki `ExerciseCard` deprecated kolon bug'ıyla aynı kapsam), bu partide dokunulmadı, yalnızca rapor ediliyor.
- **Uygulama:**
  1. Adım 1'den `week_number`/`end_date` input'ları kaldırıldı. Yerine `weeks_count` (number, min 1 max 12, varsayılan 1, "Kaç hafta sürecek?") eklendi. **max=12 sınırı görev talimatında verildi, yalnızca UI seviyesinde zorlanıyor** — RPC'nin kendisi (`018_create_program_with_weeks.sql`) `p_weeks_count >= 1` dışında bir üst sınır kontrolü yapmıyor; DB seviyesinde bir CHECK yok. Bu partinin kapsamı dışında bırakıldı (yalnızca UI/UX kısıtı, RPC'ye ayrı bir CHECK eklenmedi).
  2. `start_date` zod'da `.min(1, "Başlangıç tarihi gerekli")` ile zorunlu yapıldı (`.optional()` kaldırıldı) — BUGS.md'deki "start_date/end_date boş bırakılırsa Postgres insert reddi" bug'ının **start_date kısmı** bu partiyle kapandı (aşağıda BUGS.md güncellendi). `end_date` alanı tamamen kaldırıldığı için o kısım bug'ı bu dosya için de fiilen ortadan kalktı (artık kullanıcıya gösterilen bir `end_date` input'u yok) — ama BUGS.md maddesi `edit-program-client.tsx` için hâlâ geçerli olduğundan tamamen kapatılmadı, ikiye bölündü.
  3. `onSubmit` tamamen yeniden yazıldı: eski sıralı `insert()` zinciri (4 tablo, döngü içinde tek tek) silindi. Yerine `buildSessionsPayload()` (form state → RPC'nin `p_sessions` jsonb'si, yukarıdaki anahtar-adı ayrımını uygulayan saf fonksiyon) + tek bir `db.rpc("create_program_with_weeks", {...})` çağrısı. `db = supabase as any` cast'i **korundu** (dosyada zaten var olan, TypeScript'in supabase-js generic tiplemesiyle ilgili bilinen bir quirk'ü aşmak için kullanılan yerleşik desen — bkz. Parti 2.2.D/2.2.E notları) — `packages/db/types.ts`'e RPC imzası regen edilmedi, bu dosyanın kendi `any` cast'i zaten tip güvenliğini bu çağrı için de kapsıyor, ayrı bir regen bu partinin kapsamı dışında tutuldu (yalnızca bu dosyaya dokunma kısıtına uyum).
  4. Başarı durumunda: `block_id` null ise (`weeks_count=1`) doğrudan `/programs/{program_ids[0]}` detay sayfasına yönlendirme (eski davranışla aynı hedef). `block_id` doluysa önce `alert("${weeks_count} hafta oluşturuldu.")` (dosyanın zaten kullandığı `alert()` idiomuyla tutarlı — `onInvalid` handler'ı da aynı deseni kullanıyor, senkron/bloklayıcı olduğu için kullanıcı mesajı kapatmadan navigasyon gerçekleşmiyor) sonra aynı hedefe (hafta 1'in id'si) yönlendirme.
  5. Hata durumunda: `console.error` + ham mesajı gösteren `alert()` yerine `submitError` state'i + Adım 3'te (Özet) submit butonunun üstünde kırmızı çerçeveli bir hata kutusu. Yeni `mapRpcError()` fonksiyonu RPC'nin `RAISE EXCEPTION` mesajlarını (`yetkisiz`, XOR ihlali, `week_number` CHECK'i — bu sonuncusu 3.C'nin d2 testinde bulunan ISO hafta-53 kenar durumunun aynısı) kısa Türkçe mesajlara çeviriyor, tanınmayan her şey için jenerik bir mesaja düşüyor (ham Postgres/plpgsql metni kullanıcıya hiç gösterilmiyor).
  6. Adım 2'ye küçük bir bilgi notu eklendi (`weeksCount > 1` iken): "Bu seans planı, oluşturulacak N haftanın hepsinde aynen tekrarlanacak." — RPC'nin klonlama davranışını (aynı seans ağacı her hafta tekrar ediliyor) kullanıcıya açıkça bildirmek için, görev talimatında istenmese de düşük riskli/faydalı bir netlik eklemesi.
  7. Adım 3 özetindeki "Hafta" (`week_number`) alanı "Hafta Sayısı" (`weeks_count`) ile değiştirildi.
- **Doğrulama — Playwright bu oturumda mevcut değildi (araç notu Parti 2.2.F'dekiyle aynı):** bu ortamda hiçbir browser/Playwright aracı yoktu. Bunun yerine en güçlü alternatif kullanıldı — **gerçek supabase-js'in browser'da yapacağı isteğin birebir aynısı** doğrudan PostgREST üzerinden, TGF'nin gerçek admin kullanıcısının (tosunbeytullah9@gmail.com) gerçek Auth JWT'siyle (email/password grant ile canlı alınmış) tetiklendi:
  1. `pnpm --filter web build` → 0 hata (yalnızca önceden var olan uyarılar, yenisi yok). `pnpm turbo run type-check` → 5/5 paket temiz (mobile'da bu script tanımlı değil, atlandı — önceki partilerin de gördüğü durum).
  2. **weeks_count=1, gerçek ACE takımı verisiyle:** `buildSessionsPayload`'ın üreteceği JSON birebir elle türetilip (Back Squat 3×8×80kg, RPE 7/7.5/8) gerçek JWT ile RPC'ye POST edildi → `{block_id:null, program_ids:[tek id]}` (yeni client kodunun beklediği şekille birebir). DB doğrulaması: tek `training_programs` satırı, `block_id`/`week_index_in_block` null, `week_number=37`/`end_date=2026-09-13` **RPC tarafından otomatik türetilmiş** (start_date=2026-09-07, UI'da artık bu alanlar hiç girilmiyor), session/exercise/set ağacı JSON girdisiyle birebir.
  3. **weeks_count=4 (2 seans, biri boş/dinlenme günü — 3.C'nin test deseninin tekrarı):** Aynı yöntemle → `{block_id, program_ids:[4 id]}`. DB: 1 `program_blocks` (`total_weeks=4`), 4 `training_programs` (`week_index_in_block` 1-4, `start_date`'ler 7'şer gün arayla 09-07/09-14/09-21/09-28, `week_number` 37-40 ardışık), her haftada aynı 2 seans (Squat Günü: 1 egzersiz/2 set + Dinlenme Günü: 0 egzersiz) birebir klonlanmış.
  4. **Yetkisiz erişim simülasyonu (İbrahim'in gerçek Auth kullanıcısı, `tosunbeytullah9+ibrahim@gmail.com`, hâlâ 0 membership — 3.C'nin temizlik sonrası bıraktığı durumun aynısı):** `set local role authenticated` + `set local request.jwt.claims` ile (3.B/3.C'nin kanıtlanmış simülasyon yöntemi) gerçek `create_program_with_weeks` çağrısı → `ERROR: yetkisiz` (transaction rollback edildi, `begin/rollback` ile sarıldı). `leftover=0` doğrulandı. Bu, `mapRpcError()`'ın `.includes("yetkisiz")` kontrolünün RPC'nin gerçek hata metniyle **birebir eşleştiğini** kanıtlıyor (PostgREST'in RAISE EXCEPTION'ları `message` alanına ham metin olarak koyduğu bu oturumda ayrıca bir `PGRST301` hatasıyla da doğrulandı — aynı response şekli).
  5. **start_date boş bırakma validasyonu:** Playwright olmadan tarayıcı etkileşimi simüle edilemedi — bu adım yalnızca **kod incelemesiyle** doğrulandı: `programSchema.start_date` artık `.min(1, "Başlangıç tarihi gerekli")`, boş `""` bu kuralı ihlal eder, `zodResolver` `errors.start_date` üretir, input'un altında kırmızı mesaj render edilir VE mevcut `onInvalid` handler'ı (Parti 2.2.D'den beri var) genel bir `alert()` gösterir — sessiz reddetme artık mümkün değil. Gerçek tarayıcıda tıklama/doldurma testi yapılamadı, bu bir araç kısıtı olarak burada not düşülüyor.
  6. **Regresyon — `edit-program-client.tsx` (dokunulmadı):** `git status`/`git diff --stat` ile bu partide yalnızca `new-program-client.tsx`'in değiştiği doğrulandı. İbrahim'in ACE takımının 5 orijinal programı (Hipertrofi/Hazırlık-2/adasdasd×2/aaaaaaaaaaa — "asdasdasd" farklı bir takıma ait, bu sorgunun kapsamı dışında) test verisi eklenmeden/silinmeden önce ve sonra DB'de değişmeden bulundu. `edit-program-client.tsx`'in bağımlı olduğu `getProgramById` sorgusunun (`packages/db/queries/programs.ts:20`, `*, training_sessions(*, exercises(*, exercise_sets(*)))`) BİREBİR AYNISI gerçek JWT ile Hipertrofi programı için PostgREST'e atıldı → 1 session/2 egzersiz (Back Squat 3 set, Bench Press 3 set) — Parti 2.2.F'de dokümante edilen veriyle birebir, sorunsuz dönüyor.
  7. **Temizlik:** Test verisi (`PARTI-3D-TEST 1 Hafta`, `PARTI-3D-TEST 4 Hafta` + bunların `program_blocks` satırı) SQL ile silindi (cascade ile session/exercise/set dahil), `leftover_programs=0`/`leftover_blocks=0`, ACE takımının program sayısı orijinal `5`'e döndü.
- **Kapsam dışı bırakılan (bilinçli, talimat gereği):** `edit-program-client.tsx` (Parti 3.E). `packages/db/types.ts` RPC regen'i (dosyanın kendi `any` cast'i zaten yeterli, ayrı bir paylaşılan-paket değişikliği bu partinin "SADECE new-program-client.tsx" kısıtına girmiyordu). `weeks_count` için DB seviyesinde üst sınır CHECK'i (yalnızca UI kısıtı, RPC'de yok — yukarıda not edildi). Mobil `week_number` okuma noktası (Parti 7).

### Parti 3.C — create_program_with_weeks RPC ✅ (2026-07-21)
- **Kapsam:** `supabase/migrations/018_create_program_with_weeks.sql` (yeni). SADECE FONKSİYON — talimat gereği hiçbir UI dosyası bu partide değiştirilmedi/bağlanmadı.
- **Önce-kontrol (talimat gereği, tahmin edilmedi):** Canlı `pg_policies` sorgusuyla `training_programs.programs_write` politikasının TAM SQL'i çıkarıldı: `for all using (is_super_admin() or my_role(org_id)='admin' or my_role(org_id)='coach')` — ayrı bir `with check` yok, tek `using` hem select hem write için geçerli. Helper fonksiyonların (`is_super_admin() returns boolean`, `my_role(org uuid) returns text`, `my_team_id(org uuid) returns uuid`, hepsi `security definer stable set search_path=''`) TAM imzası `pg_proc`'tan doğrulandı — 009_security_fixes.sql'deki hardened versiyonlar canlıda aktif.
- **Fonksiyon tasarımı:** `create_program_with_weeks(p_org_id, p_team_id, p_athlete_id, p_title, p_phase, p_notes, p_weeks_count, p_block_start_date, p_sessions jsonb)`, plpgsql, `security definer`, `set search_path=''` (mevcut hardening deseniyle tutarlı). İlk satırda `programs_write` ile birebir aynı yetkilendirme kontrolü, ardından `program_scope_check` (001_schema.sql) ile birebir aynı XOR kontrolü. `p_weeks_count > 1` ise `program_blocks` satırı oluşur (block_id), `= 1` ise `block_id`/`week_index_in_block` null kalır — 017'nin tasarımıyla tutarlı. Döngü `p_sessions` ağacını (session→exercise→set, `jsonb_array_elements` ile) her hafta için AYNEN klonlar; `week_number` yalnızca bilgi amaçlı `to_char(week_start,'IW')::int` (ISO 8601) ile hesaplanır. Deprecated `exercises` kolonlarına (sets/reps/load_kg/load_percent/load_percent_1rm/rpe_target/unit) hiç yazılmıyor — Parti 2.2.D'nin kararıyla tutarlı.
- **🔴 KRİTİK BUG bulundu ve düzeltildi (doğrulama sırasında, test (c)'de):** İlk yazımda yetkilendirme kontrolü `if not (is_super_admin() or my_role(org)='admin' or my_role(org)='coach') then raise exception` şeklindeydi. Org'da hiç `memberships` satırı olmayan bir kullanıcı için `my_role()` **NULL** döner (satır bulunamadığında `language sql` fonksiyonu NULL döner, false değil). Üç-değerli SQL mantığında `false OR null OR null = null` — RLS politikasında NULL "reddet" anlamına gelir, ama plpgsql'de `IF NOT (null) THEN` **hiçbir zaman tetiklenmez** (NULL, IF içinde FALSE gibi davranır, fakat NOT NULL de NULL olduğundan negasyon "raise"i tetiklemiyor). Sonuç: membership'siz bir kullanıcı (İbrahim, athlete rolü, TGF'de hiç membership'i yok) fonksiyonu **başarıyla** çağırıp bir `training_programs` satırı yazabildi — canlı testte gerçekten oldu, tespit edilip hemen temizlendi. **Düzeltme:** `if not coalesce(..., false) then raise exception 'yetkisiz'` — coalesce ile önce false'a sabitlenip sonra negatif alınıyor. Düzeltme hem local (docker exec psql) hem cloud'a (execute_sql ile `create or replace function`) uygulandı, migration dosyası da güncellendi. Düzeltme sonrası aynı senaryo `ERROR: yetkisiz` ile temiz reddedildi.
- **Doğrulama (canlı Supabase Cloud, `nlmwcygmbbxmfpsubvmh`, gerçek `set local request.jwt.claims` + `set local role authenticated` simülasyonu, TGF org + İbrahim Çolak/ACE takımı gerçek verisiyle):**
  1. **Coach kimliği:** Org'da şu an gerçek bir coach membership'i yoktu (tek membership: tosunbeytullah9/admin). İbrahim'in user_id'sine **geçici** bir `role='coach'` membership satırı eklenip test sonunda silindi — Parti 3.B'nin aynı geçici-veri deseninin tekrarı.
  2. **weeks_count=1:** `block_id=null`, tek `training_programs` satırı, `week_number=32` (2026-08-03 için), session/exercise/set ağacı girdiyle birebir. Tüm alanlar doğrudan DB'den sorgulanıp doğrulandı.
  3. **weeks_count=4:** 1 `program_blocks` (`total_weeks=4`) + 4 `training_programs` (`week_index_in_block` 1-4, `start_date`'ler 7'şer gün arayla: 08-03/08-10/08-17/08-24, `week_number` 32-35 ardışık). Her haftada AYNI 2 session (biri 2 egzersiz/3 set, biri 0 egzersiz — boş session da test edildi) birebir klonlanmış bulundu.
  4. **Yetkisiz erişim (İbrahim, athlete rolü, membership yok):** Yukarıdaki bug düzeltildikten sonra `ERROR: yetkisiz` ile reddedildi; `program_blocks`/`training_programs`/`training_sessions`/`exercises`/`exercise_sets` — 5 tablonun hepsinde bu deneme için **0 satır** doğrulandı.
  5. **Rollback testi — iki ayrı senaryo (talimattaki band_resistance örneği + daha derin bir senaryo):** Fonksiyon `p_sessions`'ı her hafta için AYNEN klonladığından (tasarımın kendisi gereği), geçersiz bir değer p_sessions içinde olursa HER hafta aynı olacağından hata her zaman 1. haftada tetiklenir (haftalar sırayla işlenir, 1. hafta tam olarak 3. haftayla aynı veriyi taşır). Bu yüzden talimatın "3. haftada hata" istediğini iki tamamlayıcı testle karşılandı:
     - **(d1) band_resistance='invalid_deger':** `exercise_sets_band_resistance_check` ihlali, 1. haftanın set insert'inde tetiklendi. Sonuç: `program_blocks` (döngüden ÖNCE oluşturulmuştu) dahil 5 tablonun hepsinde **0 satır** — döngü başlamadan önce yazılmış satır bile rollback oluyor.
     - **(d2) ISO hafta-53 kenar durumu:** 2026 yılının Ocak 1'i Perşembe olduğundan 53 ISO haftası var (doğrulandı: `to_char('2026-12-28','IW')=53`, `to_char('2027-01-04','IW')=1`). `p_block_start_date='2026-12-14'`, `weeks_count=3` ile 3. hafta tam olarak `week_start=2026-12-28`, `week_number=53`'e denk geldi — `training_programs.week_number` CHECK'i (1-52) bunu reddetti. Hata mesajındaki satır `week_index_in_block=3` içeriyordu — yani 1. ve 2. haftaların TAM ağaçları (program+session+exercise+set) bu noktaya kadar başarıyla yazılmıştı. Sonuç: yine 5 tablonun hepsinde **0 satır** — 2 haftalık başarılı iş de dahil tamamen rollback oldu. Bu, talimatın istediği "1. ve 2. haftalar dahil hepsi rollback olmalı" senaryosunu tasarımın izin verdiği en yakın şekilde karşılıyor.
  6. **week_number ISO doğrulaması (elle hesap):** 2026-01-01 Perşembe olduğundan (2025-01-01 Çarşamba + 365 gün ≡ +1 gün), ISO hafta 1 = 2025-12-29 (Pzt) başlar. Elle hesaplanan 5 referans tarih (`2026-01-01`→hafta1, `2026-01-05`→hafta2, `2026-08-03`→hafta32 [217 gün = tam 31 hafta sonra], `2026-12-28`→hafta53, `2027-01-04`→hafta1) `to_char(...,'IW')` çıktısıyla birebir eşleşti — hem yukarıdaki testler (a/b/d2) hem bağımsız bir `to_char` sorgusuyla çapraz doğrulandı.
  7. **Temizlik:** Geçici coach membership'i (İbrahim) silindi, tüm `RPC-TEST-%` başlıklı `program_blocks`/`training_programs` (cascade ile session/exercise/set dahil) silindi. Son kontrol: `total_programs=6` (İbrahim'in takımının orijinal 6 programı, dokunulmadı), `total_blocks=0`, İbrahim'in membership sayısı `0` (orijinal duruma dönüldü).
  8. `pnpm --filter web build` → 0 hata (yalnızca önceden var olan 3 lint uyarısı — fork-exercise-modal `any`, sidebar `Calendar` unused import, useUserContext hook dependency). Beklenen: hiçbir UI dosyası bu RPC'yi çağırmıyor.
- **Kapsam dışı bırakılan (bilinçli, talimat gereği):** UI'a bağlama (web/mobile), `packages/db/types.ts` regen (RPC henüz kullanılmıyor), EXECUTE yetkisi revoke/grant (mevcut fonksiyonlarla aynı desen — "RPC exposure" advisory'si zaten BUGS.md'de ayrı bir kalem olarak kayıtlı, bu partinin kapsamı değil).

### Parti 3.B — program_blocks şeması ✅ (2026-07-21)
- **Kapsam:** `supabase/migrations/017_program_blocks.sql` (yeni). Tamamen additive — yeni tablo (`program_blocks`) + `training_programs`'a iki nullable kolon (`block_id`, `week_index_in_block`). Mevcut hiçbir tablo/politika/fonksiyon değiştirilmedi, hiçbir UI dosyasına dokunulmadı (talimat gereği bu parti salt şema).
- **`program_blocks` tablosu:** `org_id`/`team_id`/`athlete_id`/`created_by`/`title`/`total_weeks`/`phase`/`notes`/`created_at`/`updated_at`. XOR constraint (`program_blocks_scope_check`) `001_schema.sql:84-87`'deki `training_programs.program_scope_check` ile birebir aynı mantık (team_id XOR athlete_id). `total_weeks` için `check (total_weeks >= 1)`. `updated_at` için `009_security_fixes.sql`'deki mevcut `update_updated_at()` trigger fonksiyonu yeniden kullanıldı — yeni fonksiyon icat edilmedi.
- **`training_programs` eklemeleri:** `block_id uuid references program_blocks(id) on delete set null` + `week_index_in_block int`. İkisi de nullable, mevcut 6 satır (İbrahim'in verisi) etkilenmedi.
  - **Talimatın istemediği ama eklenen küçük bir karar:** `week_index_in_block`'a `check (week_index_in_block is null or week_index_in_block >= 1)` eklendi — görev talimatı bunu istemiyordu, ama aynı tablodaki kardeş kolon `week_number`'ın zaten `check (week_number between 1 and 52)` taşıdığı (001_schema.sql) göz önüne alınınca, negatif/sıfır bir hafta indeksine izin vermek tutarsız ve anlamsız olurdu. Maliyeti sıfır (mevcut tüm satırlar null), riski yok. Üst sınır (total_weeks'e göre) eklenmedi — bu, blok ile programı çapraz kontrol eden bir trigger/fonksiyon gerektirir, kapsam dışı bırakıldı.
- **RLS — kasıtlı tasarım kararı (talimatın "mevcut deseni tekrar kullan" ifadesinin ötesinde netleştirme gerektirdi):** `program_blocks`'ın `org_id`/`team_id`/`athlete_id`'si `exercises`/`exercise_sets`'teki gibi bir alt tabloda değil, `training_programs`'takiyle birebir aynı şekilde **doğrudan kolon** olarak duruyor — yani "join-hop" deseni (exercise_sets → exercises → training_sessions → training_programs) burada gerekmiyor, çünkü zaten hedef tablonun kendisinde. Bu yüzden RLS, `training_programs`'ın `programs_select`/`programs_write` politikalarıyla (002_rls.sql:93-111) **birebir aynı doğrudan mantık** kullanıyor (`my_role`/`my_team_id`/`is_super_admin`, yeni helper yok).
  - **Kasıtlı fark:** `programs_select`'in sporcu dalı `and is_published = true` ile kısıtlı (taslak programın içeriği sporcuya sızmamalı). `program_blocks`'ta yayın kavramı yok — blok yalnızca başlık/faz/toplam-hafta konteyneri, gerçek içerik (egzersizler) hâlâ `training_programs`/`exercises` altında ve onların kendi `is_published` kapısından geçiyor. Bu yüzden `program_blocks_select`'in sporcu dalında `is_published` kontrolü YOK — sporcu kendi bloğunu veya takımının bloğunu direkt görebilir. Bu bir erişilebilirlik kararı, gözlemlenen bir davranış değil — henüz hiçbir UI bu tabloyu okumadığından gerçek bir sızıntı senaryosu yok, blok UI'ı şevk edilirken yeniden değerlendirilebilir.
  - `program_blocks_write`, `programs_write` ile aynı şekilde coach'u kendi takımıyla kısıtlamıyor (org'daki herhangi bir coach yazabilir) — bu, `training_programs`'ta zaten var olan aynı desenin bilinçli tekrarı, yeni bir sıkılaştırma eklenmedi (talimat: "mevcut deseni tekrar kullan").
- **Doğrulama:**
  1. **Local:** Docker Desktop kapalıydı, başlatıldı; `supabase migration up --local` ile 017 temiz uygulandı. `\d program_blocks` (docker exec psql) ile tablo/index/FK/CHECK/RLS/trigger yapısı doğrulandı.
  2. **Cloud push:** `supabase db push` → `nlmwcygmbbxmfpsubvmh`'e uygulandı. `supabase migration list` → Local = Remote (017 dahil).
  3. **information_schema doğrulaması (cloud):** `program_blocks`'ın tüm kolonları + `training_programs.block_id`/`week_index_in_block` doğru tip/nullable ile mevcut. `pg_constraint` ile XOR constraint (`program_blocks_scope_check`) ve `total_weeks`/`week_index_in_block` CHECK'leri doğrulandı.
  4. **Mevcut veri regresyonu:** `select count(*), count(block_id), count(week_index_in_block) from training_programs` → **6, 0, 0** — İbrahim'in takımının 6 programı (Hipertrofi, Hazırlık-2, adasdasd×2, aaaaaaaaaaa, asdasdasd) tek tek `id`/`title` ile SELECT edildi, hepsi `block_id=null`/`week_index_in_block=null` ile sorunsuz döndü.
  5. **RLS simülasyonu (gerçek `set local request.jwt.claims`, İbrahim'in `user_id`'siyle):**
     - İbrahim (athlete, `memberships`'te kaydı yok — yalnızca `athletes.user_id` üzerinden) kendi adına doğrudan bir `program_blocks` satırı **insert etmeye çalıştı → RLS reddetti (42501)** — beklenen: athlete yazamaz, yalnızca admin/coach yazabilir.
     - Admin ile (service-role eşdeğeri, RLS bypass) 3 geçici test bloğu eklendi: (a) İbrahim'e athlete-scoped, (b) İbrahim'in takımı ACE'ye team-scoped, (c) alakasız bir takıma (asdasdasd'nin takımı) team-scoped.
     - İbrahim'in JWT'siyle SELECT → **yalnızca (a) ve (b) döndü**, (c) görünmedi — org/team/athlete scope doğru uygulandı.
     - Admin'in (tosunbeytullah9, `memberships`'te gerçek admin rolü) JWT'siyle SELECT → **3'ü de döndü** — admin org geneli erişimi doğrulandı.
     - Test verisi (3 satır, `title like 'PW-TEST%'`) SQL ile silindi, `leftover_test_rows=0` doğrulandı.
  6. **Advisor:** `get_advisors(security)` çalıştırıldı — dönen 6 uyarı (RPC exposure ×5, leaked-password) hepsi **önceden var olan** bulgular (BUGS.md'de zaten kayıtlı), `program_blocks` için yeni bir "RLS policy yok" uyarısı YOK — politikalar doğru tanındı.
  7. `pnpm --filter web build` → **0 hata** (yalnızca önceden var olan 3 lint uyarısı — fork-exercise-modal `any`, sidebar kullanılmayan `Calendar` import'u, useUserContext hook dependency — hiçbiri bu partiyle ilgisiz, hiçbiri yeni değil). Beklenen sonuç: hiçbir UI dosyası `program_blocks`'a dokunmuyor.
- **Kapsam dışı bırakılan (bilinçli):** Bu parti yalnızca şema. `program_blocks` için web/mobile UI, `packages/db/queries/program-blocks.ts`, `packages/db/types.ts` regen — hiçbiri yapılmadı. Bir sonraki partide (blok UI) `packages/db/types.ts` regen edilmeli (aksi halde TypeScript bu tabloyu/kolonları görmez).

### Parti 2 Kapanış Özeti — 2.1'den 2.2.F'ye ✅ (2026-07-21)

Parti 2, set bazlı yoğunluk takibini şemadan ekrana kadar uçtan uca kabloladı. Altı alt-parti, kronolojik sırayla:

| Alt-parti | Ne yaptı | Değişen tablo/dosyalar |
|---|---|---|
| 2.1 | `exercise_sets` şeması (additive) | `014_exercise_sets.sql`, `015_exercise_sets_fixes.sql` |
| 2.2.B | `training_sessions.session_rpe` kolonu (atıl, henüz bağlı değil) | `016_session_rpe.sql` |
| 2.2.C | `ExerciseList` alt-bileşenini `new`/`edit` builder'larından paylaşılan tek dosyaya çıkarma (davranış değişikliği yok) | `components/features/program-builder/exercise-list.tsx` |
| 2.2.D | Set bazlı UI'ı uçtan uca kablolama — builder artık `exercise_sets`'e yazıyor/okuyor | `exercise-list.tsx`, `new-program-client.tsx`, `edit-program-client.tsx`, `program-detail-client.tsx`, `packages/db/queries/programs.ts`, `packages/db/types.ts` |
| 2.2.E | 1RM manuel giriş formu + mevcut `getAthleteMaxes`/`create1RMRecord`'u bağlama | `tests/page.tsx` + `tests-client.tsx`, `programs/new/page.tsx`, `programs/[id]/edit/page.tsx` |
| 2.2.F | Tonaj özet metriği (bu parti) | `apps/web/lib/tonnage.ts` [yeni], `programs/[id]/page.tsx`, `programs/[id]/program-detail-client.tsx` |

**Şema tarafı:** `exercise_sets` (014) tamamen additive geldi; `exercises` tablosundaki eski kolonlar (`sets`, `reps`, `duration_sec`, `load_kg`, `load_percent`, `load_percent_1rm`, `rpe_target`, `load_type`) **silinmedi**, hâlâ DB'de duruyor ve `DEPRECATED` yorumuyla işaretli. 2.2.D'den bu yana **hiçbir web akışı bu kolonlara yazmıyor** (hem `new-program-client.tsx` hem `edit-program-client.tsx` yalnızca `exercise_sets`'e insert ediyor) — yani bu partiden sonra oluşturulan/düzenlenen her programda bu kolonlar `null` kalacak. Kolonlar bilinçli olarak silinmedi (geriye dönük veri kaybı riski + gelecekte gerekirse kolay rollback).

**Mobil hâlâ Parti 7'yi bekliyor:** `apps/mobile/components/ExerciseCard.tsx` hâlâ deprecated `exercises.sets/reps/load_kg/load_percent/unit` kolonlarını okuyor (BUGS.md, Parti 2.2.D'de bulundu, AÇIK). 2.2.D'den sonra web'de oluşturulan hiçbir programda bu kolonlar dolu olmayacağı için, mobil sporcu görünümü bu programlarda egzersiz kartlarını boş/anlamsız gösterecek — `ExerciseCard`'ın `exercise_sets` join'i okuyacak şekilde güncellenmesi Parti 7 kapsamında.

**Parti 2'nin genel sonucu:** Koç artık program builder'da set bazına kadar inen bir yoğunluk modeli (kg/%1RM/vücut ağırlığı/direnç bandı + RPE) kuruyor, sporcunun 1RM geçmişini giriyor/görüyor ve program detay ekranında hem set tablosunu hem hesaplanmış tonaj özetini görüyor — hepsi salt görüntüleme/hesaplama katmanında, hiçbir yeni DB yazma yolu açılmadan (2.2.F). Açık kalan tek uç: mobil tarafı (Parti 7).

### Parti 2.2.F — Tonaj özet metriği ✅ (2026-07-21)
- **Kapsam:** `apps/web/lib/tonnage.ts` (yeni dosya), `apps/web/app/(dashboard)/programs/[id]/page.tsx`, `apps/web/app/(dashboard)/programs/[id]/program-detail-client.tsx`. `acwr-client.tsx`/`acwr_logs`'a dokunulmadı (talimat gereği, Parti 6 kapsamı). Yeni DB kolonu/tablosu yok — salt hesaplama + render.
- **Önce-kontrol bulguları:**
  - `programs/[id]/page.tsx` **`athleteMaxes` fetch ETMİYORDU** — 2.2.E'nin "üç server sayfası" (`tests/page.tsx`, `programs/new/page.tsx`, `programs/[id]/edit/page.tsx`) arasında değildi. Eklendi.
  - `program-detail-client.tsx`'in `exercises(*, exercise_sets(*))` join'i (2.2.D'de `packages/db/queries/programs.ts`'e eklenmişti) zaten mevcuttu ve set tablosu zaten render ediliyordu — dokunulmadı, doğrudan tonaj hesabı için kullanıldı.
- **Bireysel vs takım programı ayrımı (2.2.E'deki "Son max" rozeti kararıyla aynı gerekçe):** Program `athlete_id` doluysa (`scope==="athlete"`), o sporcunun `getAthleteMaxes` sonucu `page.tsx`'te çekilip client'a geçiriliyor. Program `team_id` doluysa (`scope==="team"`), tek bir "sahibi" sporcu olmadığından 1RM listesi **boş `[]`** geçiliyor — bu, takım programındaki her `%1RM` setinin otomatik olarak "1RM eksikliği nedeniyle dahil edilmedi" sayılması anlamına gelir (doğru davranış: hangi sporcunun 1RM'i kullanılacağı belirsiz, yanlış bir sayı üretmektense dışlamak tercih edildi).
  - Not: 2.2.E'nin per-athlete-loop deseni (tüm org sporcularının maxlarını çekip birleştirme) burada **kullanılmadı** — bu sayfa tek bir programa ait, org geneline ihtiyaç yok; `program.athlete_id` biliniyorsa doğrudan `getAthleteMaxes(supabase, program.athlete_id)` tek çağrısı yeterli.
- **`apps/web/lib/tonnage.ts` (saf fonksiyonlar, DB'ye dokunmuyor):** `buildMaxLookup` (egzersiz adı → en güncel 1RM kg, `Athlete1RMRecord[]`'den `Map` kurar — `getAthleteMaxes`'in kendi dedup'ından SONRA çalıştığı için ek bir "en güncel kazanır" mantığına gerek yok, ama yine de `Map.set` yalnızca ilk görülende yazıldığından çift güvenli), `calculateExerciseTonnage`/`calculateSessionTonnage`/`calculateProgramTonnage`. Set bazlı kural (`calculateSetTonnage`, dosya içi, export edilmiyor):
  1. `is_bodyweight` veya `band_resistance` doluysa → kg'a hiç girmez, `reps` `bodyweightRepCount`'a eklenir.
  2. `load_kg` doluysa → `reps × load_kg` → `totalKg`.
  3. `percent_1rm` doluysa → `maxLookup`'ta egzersiz adı için kayıt varsa `reps × (percent_1rm/100 × 1RM)` → `totalKg`; yoksa `excludedSetCount += 1` (tonaja hiç girmez).
  4. Hiçbiri doluysa (örn. yalnızca süre bazlı, yük bilgisi hiç girilmemiş) → sessizce atlanır (0 katkı, hiçbir sayaca eklenmez) — spesifikasyonda bu durum için ayrı bir istek yoktu.
  - Session/program toplamı, egzersiz sonuçlarının basit toplamı (`reduce`).
- **`program-detail-client.tsx` render:** Başlık kartında program geneli "Toplam Tonaj: X kg" (+ varsa "N set 1RM eksikliği nedeniyle tonaja dahil edilmedi" amber uyarı). Her seans kartının başlığının altında aynı üçlü (seans tonajı + varsa bodyweight/bant tekrar sayısı + varsa dışlanan set sayısı) — `useMemo` ile `maxLookup` bir kez kuruluyor, tonaj hesapları ondan türüyor.
- **Doğrulama (gerçek Supabase Cloud verisiyle, Playwright bu ortamda mevcut değildi — bkz. not aşağıda):**
  1. `pnpm --filter web build` → 0 hata (yalnızca önceden var olan uyarılar).
  2. **Gerçek mevcut veriyle (görevin kendi manuel örneği):** İbrahim'in takımının canlı "Hipertrofi" programı (Back Squat 3×8×80kg + Bench Press 3×8×50kg — bu tam olarak görev talimatındaki örnek) PostgREST üzerinden `getProgramById`'in kullandığı **birebir aynı** join (`training_sessions(*,exercises(*,exercise_sets(*)))`) ile, test kullanıcısının gerçek oturum JWT'siyle (RLS aktif) çekildi; şu anda sevk edilen `apps/web/lib/tonnage.ts` kodu bu veri üzerinde çalıştırıldı (Node 24 `--experimental-strip-types`, gerçek dosya — el ile taklit edilmiş bir kopya değil). Sonuç: `totalKg=3120` — talimattaki manuel hesapla (`8×80×3 + 8×50×3 = 1920+1200=3120`) birebir eşleşti, `excludedSetCount=0`, `bodyweightRepCount=0`.
  3. **%1RM eksik senaryosu (geçici test verisi, Supabase'e gerçek insert ile):** İbrahim için bireysel (athlete-scoped) bir test programı oluşturuldu — Back Squat (3×8×80kg), Bench Press (3×8×%70, önceden eklenen geçici bir 1RM kaydı: 100kg → beklenen 3×8×70=1680kg), Deadlift (2×5×%80, **kasıtlı olarak 1RM kaydı YOK**), Band Pull Apart (2 set, 15+12 tekrar, direnç bandı). Aynı gerçek-JWT + gerçek-kod yöntemiyle çalıştırıldı: `totalKg=3600` (1920+1680, elle hesapla birebir), `excludedSetCount=2` (Deadlift'in 2 seti — doğru), `bodyweightRepCount=27` (15+12 — doğru). Test programı ve geçici 1RM kaydı doğrulama sonrası SQL ile silindi (cascade ile session/exercise/exercise_sets dahil), DB temizliği SQL ile teyit edildi (`leftover_program=0, leftover_1rm=0, leftover_exercises=0`).
  4. **Regresyon:** "aaaaaaaaaaa" (Bisiklet, 1×1×1kg) ve "asdasdasd" (Arnold Press/Ayı Yürüyüşü/Cable Row kg + Single-Leg Hip Thrust bodyweight/bant karışık) programlarının gerçek verisi de aynı yöntemle çekilip hesaplandı — hiçbiri `percent_1rm` kullanmadığından `excludedSetCount=0` her ikisinde de, hesaplama hatasız çalıştı (crash/NaN yok).
  - **Araç notu:** Bu oturumda bir Playwright/tarayıcı MCP aracı mevcut değildi (önceki partilerin "canlı Playwright doğrulaması" yaptığı ortamdan farklı) — bu yüzden gerçek DOM render'ı görsel olarak doğrulanamadı. Bunun yerine daha güçlü bir yöntem kullanıldı: sevk edilen gerçek `tonnage.ts` kodu, uygulamanın gerçek sorgusuyla (aynı PostgREST join, RLS altında gerçek kullanıcı JWT'si) çekilen gerçek veriye karşı doğrudan çalıştırıldı — hesaplama mantığı için DOM'u görmekten daha kesin bir kanıt, ama JSX/CSS render'ının gözle görülür doğruluğu (örn. amber uyarı rengi, layout) doğrulanamadı. Sonraki bir oturumda Playwright mevcutsa görsel bir geçiş önerilir.
  5. Mevcut hiçbir şey bozulmadı: `program-detail-client.tsx`'in diğer render yolları (yayınla butonu, edit linki, boş-seans durumu) değişmedi; yalnızca ek satırlar eklendi.

### Parti 2.2.E — 1RM manuel giriş formu + mevcut query'leri bağlama ✅ (2026-07-20)
- **Kapsam:** `apps/web/app/(dashboard)/tests/page.tsx`, `tests-client.tsx`, `apps/web/components/features/program-builder/exercise-list.tsx`, `apps/web/app/(dashboard)/programs/new/page.tsx` + `new-program-client.tsx`, `apps/web/app/(dashboard)/programs/[id]/edit/page.tsx` + `edit-program-client.tsx`. `packages/db/queries/exercises.ts`'teki `getAthleteMaxes`/`create1RMRecord` **değiştirilmedi**, sadece çağrıldı (talimat gereği). `test_results` tablosuna/"Maksimal Kuvvet" kategorisine dokunulmadı.
- **Önce-kontrol bulguları (talimat gereği doğrulandı, varsayılmadı):**
  - `create1RMRecord` düz bir `insert()` — her çağrı **yeni satır** ekliyor, geçmiş korunuyor (upsert/üzerine yazma yok).
  - `getAthleteMaxes` bir sporcunun tüm kayıtlarını `test_date desc` sıralayıp her `exercise_name` için **ilk görüleni** (yani **en güncel test_date'li kaydı**) döndürüyor — "en yüksek kg" DEĞİL, "en güncel" dedup. Aynı güne iki kayıt girilirse hangisinin kazanacağı sıralama kararsızlığına bağlı (var olan bir kenar durumu, bu partinin kapsamında düzeltilmedi).
  - `athlete_1rm_records` RLS'i **zaten vardı** (`005_exercises.sql`, `1rm_select/insert/update/delete` politikaları) ve `exercises_select/write` ile aynı erişim mantığını takip ediyor (org'daki herhangi bir admin/coach — takım kısıtı yok — + sporcu kendisi). Yeni politika eklenmedi.
  - **Uyuşmazlık tespiti:** `getAthleteMaxes(client, athleteId)` tek bir sporcu alıyor, ama `/tests` sayfası (`getTests(orgId)` gibi) org geneli. Org-geneli eşdeğeri yok ve fonksiyon değiştirilemiyordu — çözüm: sunucu bileşeninde her sporcu için ayrı ayrı çağrılıp (`Promise.all`) sonuçlar birleştirildi (`packages/db/queries/exercises.ts`'e dokunulmadı).
- **`/tests` sayfası — "1RM Kayıtları" alt-bölümü:** Mevcut `showForm`/`filtered` deseni takip edilerek eklendi. Liste: sporcu, egzersiz, en güncel kg, tarih (org geneli, yukarıdaki per-athlete-loop'tan). Form: sporcu seçimi (mevcut `athletes` prop'u), egzersiz seçimi (`platform_exercises` + `org_exercises`'tan **basit `<select>`** — ExercisePickerModal değil, talimatın "mevcut deseni tercih et" seçeneği izlendi, bu sayfanın geri kalanı zaten plain-select kullanıyor), ağırlık/tarih/not → `create1RMRecord`. Yerel state güncellemesi `getAthleteMaxes`'in "en güncel kazanır" dedup mantığını tekrar eden bir `dedupeLatestMaxes` helper'ıyla yapılıyor (yalnızca UI state, DB fonksiyonuna dokunmuyor).
- **Program builder — "Son max" rozeti:** `ExerciseList`'e `athleteMaxes?: Athlete1RMRecord[]` prop'u eklendi, `ExercisePickerModal`'a geçiriliyor (modal'ın kendi render mantığı zaten hazırdı, dokunulmadı). `new-program-client.tsx`/`edit-program-client.tsx`'te veri, sunucu bileşeninde (tests sayfasındakiyle aynı per-athlete-loop) tüm sporcular için çekilip, client'ta **seçili `athlete_id`'ye göre filtrelenip** geçiriliyor: bireysel (`scope==="athlete"`) programlarda seçili sporcunun maksları görünür, takım (`scope==="team"`) programlarında rozet hiç görünmez — bir takım programının tek bir "sahibi" sporcusu olmadığından "Son max" göstermek anlamsız/yanıltıcı olurdu. Bu, talimattaki "sadece bu satırı ekle" ifadesinin ima ettiğinden daha fazla kablolama gerektirdi (veri hiç çekilmiyordu) ama tasarım kararı minimal tutuldu.
- **Yan bulgu (düzeltildi) — Supabase-js "never" tip çıkarımı:** `programs/new/page.tsx`, `programs/[id]/edit/page.tsx` ve `tests/page.tsx`'te `athletesResult.data ?? []` sonucu tipsiz bir `const athletes = ...`'a atanıp `.map()` ile tekrar kullanılınca (yeni `getAthleteMaxes` loop'u için), TypeScript sporcunun tipini `never`'e indirgiyordu (`Property 'id' does not exist on type 'never'`) — muhtemelen supabase-js'in generic `PostgrestResponse.data` tipinin yalnızca doğrudan bir contextual type hedefine (örn. JSX prop) atanınca doğru çözüldüğü bir quirk. Çözüm: `const athletes: { id: string; full_name: string; team_id: string }[] = ...` gibi açık tip anotasyonu eklendi (3 dosyada). Davranışta etkisi yok, yalnızca derleme zamanı.
- **Doğrulama:**
  1. `pnpm --filter web build` → 0 hata (yalnızca önceden var olan uyarılar).
  2. Playwright ile canlı doğrulama (İbrahim Çolak/tosunbeytullah9 hesabıyla, `localhost:3000`): `/tests`'e "1RM Kayıtları" bölümü eklendi, form dolduruldu (İBRAHİM ÇOLAK, Back Squat, 123.5 kg, 2026-07-20), `POST .../athlete_1rm_records` → 201, tablo satırı DB değerleriyle birebir eşleşti.
  3. `/programs/new`'de: başlık dolduruldu, kapsam="Bireysel Sporcu" + İBRAHİM ÇOLAK seçildi, "Devam", gün eklendi, "Kütüphaneden Seç" açıldı, "Back Squat" arandı → **"Son max: 123.5 kg" rozeti göründü** (yukarıdaki adımda eklenen kayıtla birebir).
  4. RLS simülasyonu (`set local request.jwt.claims`, SQL): İbrahim'in kendi `user_id`'siyle sorgu → kendi 1 kaydını görüyor; alakasız/rastgele bir `sub` (ne sporcu sahibi ne org'da coach/admin) ile sorgu → **0 satır**. Şu an org'da tek aktif sporcu (İbrahim) olduğundan "başka bir sporcunun kaydını göremiyor" senaryosu gerçek ikinci bir sporcuyla test edilemedi, ama politika sporcuya-özgü simetrik olduğundan (yabancı kullanıcı 0 satır görüyor) yapısal olarak izolasyon doğrulandı.
  5. Test verisi (1RM kaydı, `notes='PW-TEST 2.2.E verification'`) doğrulama sonrası SQL ile silindi. Test programı DB'ye hiç yazılmadı (yalnızca builder'ın 1. adımı/picker'ı gezildi, submit edilmedi) — temizlenecek bir şey yok.
- **Araç notu (gelecek Playwright doğrulamaları için):** Bu sandbox ortamında headless Chromium'un varsayılan HTTP/2 ile Supabase Auth'a `fetch()` çağrıları bazen `net::ERR_ABORTED`/"Failed to fetch" ile başarısız oluyordu (saf Node `fetch`/`curl` ve Playwright'ın kendi `page.request` client'ı etkilenmiyor — yalnızca sayfa içi tarayıcı `fetch()`). `chromium.launch({ args: ['--no-sandbox', '--disable-http2'] })` sorunu gideriyor. Kod tabanıyla ilgisi yok, ortam/araç kısıtı.
- PROGRESS.md § Sıradaki Görevler → Öncelik 2'deki "1RM takibi" ✅ işaretlendi.

### Parti 2.2.D — Set bazlı UI, uçtan uca kablolama ✅ (2026-07-20)
- **Kapsam:** `exercise-list.tsx`, `new-program-client.tsx`, `edit-program-client.tsx`, `program-detail-client.tsx`, `packages/db/queries/programs.ts`, `packages/db/types.ts` (regen). 1RM giriş formu ve tonaj gösterimi kapsam dışı (2.2.E/F).
- **Önce-kontrol bulguları (talimat gereği doğrulandı):**
  - Eski tek-satırlık grid'in "yük tipine göre kg/%1RM/RPE" switch'i incelendi (2.2.C'de taşınan hali) — aynı desen (koşullu input render) yeni set-bazlı UI'da tekrar kullanıldı, ama semantik değişti: eski switch **egzersiz seviyesindeydi** (kg/%1RM/RPE, 3 seçenek), yeni switch **set seviyesinde** ve 4 seçenekli (Kg/%1RM/Vücut Ağırlığı/Direnç Bandı) — çünkü `exercise_sets` şemasında yük tipini egzersiz değil set taşıyor (014_exercise_sets.sql). `exercise_sets` tablosunda ayrı bir `load_type` kolonu yok; tip `load_kg`/`percent_1rm`/`is_bodyweight`/`band_resistance` kolonlarından HANGİSİNİN dolu olduğundan türetiliyor — dropdown yalnızca form state'inde yaşıyor, submit'te doğru kolona çevriliyor (`setToInsertColumns` helper, hem new hem edit client'ta simetrik).
  - Nested `useFieldArray` (sessions.N.exercises.M.exercise_sets) spike'ı: React hooks kuralları gereği `useFieldArray`'i bir `.map()` callback'i içinde doğrudan çağırmak geçersiz (hook çağrı sayısı egzersiz sayısına göre değişir) — bu yüzden her egzersiz satırı `ExerciseRow` adında ayrı bir alt-bileşene çıkarıldı, kendi `exercise_sets` alanı için kendi `useFieldArray`'ini çağırıyor. react-hook-form 7.52 bu iç içe deseni sorunsuz destekliyor (zaten var olan `sessions→exercises` nesting'iyle aynı mekanizma, bir seviye daha). Alternatif (flat array + index referansı) gerekmedi.
- **Tasarım:** Egzersiz seviyesinde "Tekrar bazlı"/"Süre bazlı" toggle (`is_duration_based`, form-only — DB'de ayrı kolon yok, hangi set alanının (`reps` vs `duration_sec`) dolu olduğundan edit'te geri türetiliyor). Set satırı: Set# (salt okunur, dizi index'inden), Tekrar/Süre input, Yük Tipi dropdown, koşullu değer alanı (Kg→sayı, %1RM→sayı 0-100, Vücut Ağırlığı→alan yok, Direnç Bandı→Yumuşak/Orta/Sert dropdown), her zaman görünen RPE (1-10, 0.5 adım), sil butonu (son set kalınca disabled — "en az 1 set" kuralı UI'da fiziksel olarak imkansız kılındı, yalnızca zod `.min(1)`'e güvenilmedi). "+ Set Ekle" bir önceki setin tüm alanlarını klonluyor. Egzersiz eklendiğinde otomatik 1 boş set ile başlıyor. `rest_sec` egzersiz seviyesinde tek alan (önceki karar korundu).
- **Zod şeması:** `exerciseSetSchema` (`.superRefine`) yük tipine göre ilgili değer alanının dolu olmasını zorunlu kılıyor (Kg→`load_kg`, %1RM→`percent_1rm`, Bant→`band_resistance`). "reps VEYA duration_sec dolu olmalı" kontrolü set şemasında DEĞİL `exerciseSchema.superRefine`'da — çünkü hangisinin zorunlu olduğu (`is_duration_based`) egzersiz seviyesinde yaşıyor, set kendi başına bilemez.
- **Yeni set alanları NaN sınıfı bug'ı TEKRARLAMIYOR:** `week_number`/`duration_min`'de zaten kayıtlı olan `valueAsNumber` + boş input → `NaN` → zod sessiz reddi deseni (BUGS.md, Parti 2.2.C'de bulundu) bilerek yeni set alanlarında (reps/duration_sec/load_kg/percent_1rm/rpe) kullanılmadı — bunun yerine `setValueAs: (v) => v === "" ? undefined : Number(v)` ile boş input `undefined`'a çevriliyor, optional alan doğru şekilde "girilmemiş" sayılıyor. Pre-existing `week_number`/`duration_min` alanları bu partinin kapsamı dışında bırakıldı, dokunulmadı.
- **Sessiz submit reddi kısmen giderildi (yan etki, bilinçli):** `handleSubmit(onSubmit)` → `handleSubmit(onSubmit, onInvalid)` yapıldı (hem new hem edit client). `onInvalid` artık `alert()` ile kullanıcıya "eksik/hatalı alan var" mesajı gösteriyor. Bu, BUGS.md'deki "sessiz" şikayetini gideriyor (kullanıcı artık bir şey görüyor) ama kök nedenleri (week_number/duration_min'in NaN üretmesi) DÜZELTMİYOR — mesaj hâlâ jenerik, alan-spesifik değil. BUGS.md'de buna göre güncellendi.
- **Submit akışı (new + edit, simetrik):** Egzersizler artık tek tek insert ediliyor (bulk insert + `.select()` yerine döngü içinde `insert().select().single()`) — bulk insert'te dönen satır sırasının insert sırasıyla eşleştiği garantisine güvenmek yerine, her egzersizin kendi id'sini alıp `exercise_sets`'i ona bağlamak için. Deprecated kolonlara (`sets`/`reps`/`load_kg`/`load_percent`/`load_percent_1rm`/`rpe_target`/`load_type`/`unit`) artık hiç yazılmıyor (satırdan tamamen çıkarıldı, DB default'ları/null kalıyor).
- **Edit — delete-then-reinsert doğrulaması:** `training_sessions` silinince `exercises` (FK cascade) ve ardından `exercise_sets` (FK cascade) otomatik siliniyor — ayrı bir `exercise_sets` delete adımına gerek yok, canlı testte doğrulandı (yeni id'ler, eski id'ler DB'de yok).
- **`program-detail-client.tsx`:** `exercises(*, exercise_sets(*))` join'i ile okuyor (packages/db/queries/programs.ts `getProgramById`/`getPrograms` güncellendi), her egzersiz altında set tablosu gösteriyor (Set/Tekrar-Süre/Yük/RPE), yük `formatSetLoad` ile band/bodyweight/%1RM/kg önceliğiyle formatlanıyor.
- **`packages/db/types.ts` regen:** `mcp__Supabase__generate_typescript_types` ile yeniden üretildi — önceki dosyada `exercise_sets` tablosu HİÇ tiplenmemişti (014/015 migration'ları cloud'da uygulanmış ama types.ts asla regen edilmemişti, Parti 2.1/2.2.B/C bunu atlamış). Bu partinin bir parçası olarak düzeltildi, `packages/db` ve `apps/web` `tsc --noEmit` + `pnpm --filter web build` temiz.
- **DEPRECATED KOLON TARAMASI (talimat gereği, dokunulmadı):** `apps/mobile/components/ExerciseCard.tsx` hâlâ `exercise.sets`/`exercise.reps`/`exercise.duration_sec`/`exercise.load_kg`/`exercise.load_percent`/`exercise.unit` okuyor (program ekranındaki sporcu görünümü). Bu partiden sonra oluşturulan/düzenlenen programlarda bu kolonlar hep null olacağından, mobil bu programlar için boş/eksik değer gösterecek (set listesini hiç göstermiyor, sadece "X set" gibi özet). **Mobil Parti 7 kapsamında** — bu partide dokunulmadı, yalnızca raporlanıyor. Web tarafında (exercise-form-fields.tsx, exercise-picker-modal.tsx, create/edit/fork-exercise-modal.tsx) görülen `load_type` referansları farklı bir kavram (platform_exercises/org_exercises katalog metadata'sı — "bu egzersiz genelde nasıl yüklenir"), `exercises` (program instance) tablosuyla ilgisi yok, taranmadı/dokunulmadı çünkü zaten deprecated değil.
- **Doğrulama (Playwright + gerçek veri + RLS simülasyonu):**
  1. `pnpm --filter web build` → 0 hata (yalnızca önceden var olan uyarılar).
  2. Yeni program oluşturuldu (İbrahim'in takımı ACE, "PW-TEST Set Bazlı Program"): Back Squat 4 set (60/70/75/80kg, RPE 7/7.5/8/8.5, hepsi 5 tekrar) + Band Pull Apart 2 set (15/12 tekrar, Orta/Sert direnç bandı). DB sorgusu: `exercise_sets` satırları form girdileriyle birebir, `exercises` tablosundaki deprecated kolonların hepsi `null`.
  3. Programı düzenle: Set 1'in yükünü 60→65kg değiştir, kaydet. DB: `exercises`/`exercise_sets` YENİ id'lerle yeniden oluşmuş (delete-then-reinsert), set1 65kg'a güncellenmiş, diğer 5 set (70/75/80 + 2 bant seti) değişmemiş. İbrahim'in diğer published programı "aaaaaaaaaaa" (Bisiklet, 1 set) **aynı `set_id`, aynı `created_at`** ile bire bir korunmuş — sıfır etki.
  4. `program-detail-client.tsx` DOM metni DB değerleriyle birebir eşleşiyor (Set/Tekrar/Yük/RPE tablosu, "Orta bant"/"Sert bant" formatlaması dahil).
  5. RLS simülasyonu (İbrahim'in `user_id`'siyle `set local request.jwt.claims`): program taslakken (`is_published=false`) İbrahim'e görünen set sayısı **0**; UI'dan "Yayınla"ya basılınca **6** (4+2) — `exercise_sets_select` politikası hem taslak/yayın geçişinde hem yeni satırlarda doğru çalışıyor. Test verisi sonunda `training_programs` satırı silinerek temizlendi (cascade ile `exercise_sets` dahil sıfırlandı, doğrulandı).
- **Playwright test altyapısı notu:** `exercise-list.tsx`'e minimal `data-testid` attribute'ları eklendi (exercise-row/set-row/add-set/add-exercise/load-type/vb.) — karmaşık iç içe set formunu placeholder/class tabanlı kırılgan selector'lar yerine güvenilir şekilde sürmek için. Davranışta hiçbir etkisi yok (yalnızca DOM attribute'u), CLAUDE.md Agent 6'nın gelecekteki Playwright E2E testleri için de yeniden kullanılabilir.

### Parti 2.2.C — ExerciseList paylaşılan bileşene taşındı (davranış değişikliği yok) ✅ (2026-07-20)
- `apps/web/components/features/program-builder/exercise-list.tsx` — yeni dosya. `new-program-client.tsx` ve `edit-program-client.tsx`'teki birebir aynı `ExerciseList` alt-bileşeni (egzersiz ekleme, superset_group atama, set/reps/load grid'i, `getGroupCount`/`handleGroupChange` mantığı) buraya taşındı — satır satır aynen, davranış değişikliği yok. `exerciseSchema`, `SUPERSET_GROUPS`, `SUPERSET_COLORS`, `LOAD_TYPES` de bu dosyaya çıkarıldı ve her iki client artık aynı `exerciseSchema` referansını import ediyor (önceden iki ayrı ama yapısal olarak özdeş zod objesiydi).
- **Bulunan küçük uyuşmazlık (rapor edildi, kullanıcı onayıyla giderildi):** İki orijinal `ExerciseList` birebir değildi — `new-program-client.tsx`'te kullanılmayan bir `groupedLabels` değişkeni (dead code, hiç okunmuyordu) ve kullanılmayan bir `FieldValues` type import'u vardı, `edit-program-client.tsx`'te yoktu. İkisi de runtime'da etkisizdi (unused), paylaşılan bileşene taşınırken ikisi de düşürüldü — davranışta fark yaratmaz.
- **Tip uyarlaması (kaçınılmaz, refactor'ün doğası gereği):** `ExerciseList` artık `TFieldValues extends ProgramFormShape` generic'i ile çalışıyor (iki dosyanın kendi `ProgramForm` tipi yapısal olarak aynı ama nominal olarak farklı zod-türetilmiş tipler). react-hook-form'un `Path<T>`/`ArrayPath<T>` tipleri generic parametre üzerinden path string'lerini doğrulayamadığı için `register`/`watch`/`setValue`/`useFieldArray` çağrılarında hedefli `as Path<TFieldValues>`/`as never` cast'leri eklendi — yalnızca tip seviyesinde, runtime'da hiçbir etkisi yok (build ile doğrulandı).
- `new-program-client.tsx` ve `edit-program-client.tsx`: yerel `ExerciseList` tanımı silindi, ikisi de paylaşılan bileşeni import ediyor. Artık kullanılmayan `BookOpen` icon import'u (ExerciseList ile birlikte taşındığı için) her iki dosyadan da temizlendi.
- **Doğrulama:** `pnpm --filter web build` temiz (0 hata, önceden var olan uyarılar dışında yeni uyarı yok). Playwright ile canlı doğrulama: (1) İbrahim'in takımının "Hipertrofi" (Back Squat 3×8×80kg, Bench Press 3×8×50kg) ve "aaaaaaaaaaa" (Bisiklet 1×1×1kg) programlarının `/edit` sayfası DOM'u DB'deki değerlerle birebir eşleşiyor; (2) yeni program oluşturma akışı (3 adım, egzersiz + superset grubu dahil) uçtan uca test edildi, `exercises` tablosuna yazılan satır form girdileriyle birebir aynı; (3) edit akışında kaydetme (delete-then-reinsert) tetiklendi — session/exercise id'leri değişti ama tüm içerik (name/sets/reps/load_kg/rest_sec/notes/superset_group) korundu. Test verisi (yeni oluşturulan program) doğrulama sonrası silindi.
- **Yan bulgu (kapsam dışı, DOKUNULMADI):** Doğrulama sırasında iki ayrı, ExerciseList'le ilgisiz pre-existing bug bulundu — `week_number` ve `duration_min` (session seviyesi) alanları boş bırakılırsa `valueAsNumber` `NaN` üretiyor, zod `.optional().or(z.literal(undefined))` NaN'ı reddediyor, ve `handleSubmit`'e `onInvalid` handler'ı olmadığı için form **sessizce** submit olmuyor (kullanıcıya hata gösterilmiyor). Ayrıca boş `start_date`/`end_date` `""` olarak gönderiliyor, Postgres `date` kolonu için `invalid input syntax` hatası veriyor (`?? null` yalnızca null/undefined'ı yakalıyor, `""`'ı yakalamıyor). Üçü de `new-program-client.tsx`/`edit-program-client.tsx`'in ExerciseList DIŞINDAKİ, görev kapsamı dışı bırakılan onSubmit/programSchema mantığında — talimat gereği dokunulmadı, burada not düşülüyor.

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
| 017 | program_blocks | ✅ Uygulandı (2026-07-21 — Parti 3.B, çok haftalı program grubu tablosu + `training_programs.block_id`/`week_index_in_block`, additive, henüz atıl/UI bağlantısı yok) |

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
- [x] 1RM takibi — `/tests` sayfasında "1RM Kayıtları" bölümü + program builder "Son max" rozeti ✅ (2026-07-20, Parti 2.2.E)
- [x] Tonaj özet metriği — program detay sayfasında seans/program bazlı toplam tonaj + 1RM eksikliği uyarısı ✅ (2026-07-21, Parti 2.2.F — **Parti 2 tamamen kapandı**)
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
