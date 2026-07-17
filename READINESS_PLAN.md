# READINESS_PLAN.md — Readiness Katmanı Mimarisi

> Oluşturulma: 2026-07-15 · **AŞAMA 1 — KEŞİF + MİMARİ (kod yazılmadı)**
> Kapsam: Wellness check-in (mobil) + Koç komuta merkezi (web) + Readiness score motoru (sonraki iterasyon)
> Yöntem: Web bug temizliği ve mobil navigation'da olduğu gibi — önce tam resim, sonra parça parça uygulama.

---

## 0. YÖNETİCİ ÖZETİ — Önce Bunu Oku

**Readiness katmanının önündeki gerçek engel readiness katmanı değil: sporcuların hesabı yok.**

Canlı DB sorgusu (`nlmwcygmbbxmfpsubvmh`, 2026-07-15):

| Aktif sporcu | Kullanıcı hesabı olan | Hesabı olmayan |
|---|---|---|
| 6 | **2** | **4** |

`athletes.user_id` nullable ve 4 sporcuda **null**. Wellness check-in'i sporcu kendi hesabıyla girer (`a.user_id = auth.uid()`). Yani bugün bu katmanı olduğu gibi inşa edersek:

- 6 sporcunun **2'si** check-in yapabilir,
- Komuta merkezi **4 kalıcı gri satır** gösterir,
- Ürün "çalışıyor" ama boş görünür.

**Zincir şu:**

```
RESEND_API_KEY yok  (PROGRESS.md § Bilinen Sorunlar #1)
   → davet e-postası gitmiyor
      → sporcunun hesabı oluşmuyor (user_id null)
         → check-in yapamıyor
            → komuta merkezi boş
```

Readiness katmanı, **daveti çalışan bir sisteme** ihtiyaç duyar. Bu yüzden §7'deki uygulama sırasında **Adım 0 = RESEND_API_KEY**. Ucuz (bir secret set etme) ama bu yapılmadan katmanın demo değeri sıfır.

**İkinci sonuç — bu bir ürün gerçeği, geçici bir arıza değil:** Bu bir cimnastik federasyonu. Sporcuların önemli kısmı **10-14 yaş** olacak; telefonu/e-postası olmayan sporcu kalıcı bir kategori. Bu yüzden şemaya `source` kolonu koyuyoruz (`athlete` | `coach_proxy`): koç, hesabı olmayan sporcu adına giriş yapabilir **ama veri damgalanır**, self-report ile vekil giriş asla sessizce karışmaz. Detay: §2.3.

**Diğer üç önemli bulgu:**

1. 🔴 **`acwr_logs`'ta UPDATE politikası YOK ama kod upsert kullanıyor** → mevcut, henüz fark edilmemiş bug. `wellness_checkins` bu hatayı tekrarlamamalı. (§2.4)
2. 🟠 **`/dashboard` middleware'de admin-only, koç oraya giremiyor** → komuta merkezi `/dashboard`'a konamaz. Yeni `/readiness` route'u öneriliyor. (§5.1)
3. 🟡 **Önerdiğin 6 metrikten biri (enerji) fazla** — `enerji` ile `yorgunluk` aynı yapının ters kutbu, ikisini birden toplamak yorgunluğu çift ağırlıklandırır. Kanıt 5 maddeyi destekliyor. (§4)

---

## 1. MEVCUT SİSTEM ANALİZİ

### 1.1 İlişkileneceğimiz tablolar (canlı doğrulandı)

| Tablo | Satır | İlgili kolonlar | Readiness ile ilişkisi |
|---|---|---|---|
| `athletes` | 6 | `id`, `user_id` (**nullable**), `org_id`, `team_id` (**not null**), `is_active` | Tüm readiness verisinin çapası (FK) |
| `acwr_logs` | 1 | `athlete_id`, `log_date`, `session_load` (generated), `acute_load`, `chronic_load`, `acwr_ratio` (generated) | **Zamansal** ilişki (FK yok) — readiness'in yük bileşeni |
| `memberships` | 4 | `user_id`, `org_id`, `team_id`, `role`, `unique(user_id, org_id)` | RLS rol çözümü |
| `teams` | 6 | `id`, `org_id` | Komuta merkezi kapsamı |

**`athletes.team_id` NOT NULL** — her sporcunun takımı garanti. Komuta merkezi için iyi haber: "takımsız sporcu" kenar durumu yok.

### 1.2 `acwr_logs` gerçeği — readiness motoru için kritik

Şema iddiası ile çalışan kod arasında fark var:

- `session_load` ve `acwr_ratio` **gerçekten generated** (canlı `information_schema` ile doğrulandı — ilk bakışta `column_default: null` görünür, bu generated kolonlarda normaldir, yanlış alarm değil).
- Ama `acute_load` / `chronic_load` **düz kolon** — bunları uygulama yazar.
- [acwr-client.tsx:117-151](apps/web/app/(dashboard)/acwr/acwr-client.tsx#L117-L151) bunları **client-side, JS'te, yalnızca kayıt anında** hesaplar.
- DB'deki `calculate_acwr()` fonksiyonu ([003_functions.sql](supabase/migrations/003_functions.sql)) **hiç kullanılmıyor** — ölü kod.

**Sonuç:** `acwr_ratio`, yazıldığı andaki bir **snapshot**'tır; sonraki günlerde yeniden hesaplanmaz. Readiness motoru (iterasyon 3) `acwr_logs.acwr_ratio`'yu okumamalı; skor anında `calculate_acwr(athlete_id, date)` çağırmalı. Aksi halde readiness skoru bayat bir orana dayanır. (§6.3)

### 1.3 Mevcut RLS kalıbı — sağlam ve tekrar kullanılabilir

`acwr_select` ([002_rls.sql:182-193](supabase/migrations/002_rls.sql#L182-L193)) tam olarak ihtiyacımız olan kalıp:

```sql
is_super_admin()
or exists (
  select 1 from athletes a
  where a.id = athlete_id
  and (
    a.user_id = auth.uid()                                   -- sporcu: kendisi
    or my_role(a.org_id) = 'admin'                           -- admin: tüm org
    or (my_role(a.org_id) = 'coach'
        and a.team_id = my_team_id(a.org_id))                -- koç: kendi takımı
  )
)
```

Bu kalıbı `wellness_checkins` için **birebir** kullanacağız. Yeni helper fonksiyon gerekmiyor (§3).

---

## 2. ADIM 1+2 — ŞEMA VE RLS

### 2.1 Neden ayrı tablo? (`acwr_logs`'a kolon eklemek yerine)

Cazip görünen "wellness kolonlarını `acwr_logs`'a ekle" yaklaşımı **yanlış**:

| | `acwr_logs` | `wellness_checkins` |
|---|---|---|
| Ne ölçer | Sporcu ne **yaptı** (yük) | Sporcu nasıl **hissediyor** |
| Ne zaman | Antrenman **sonrası** (akşam) | **Sabah**, antrenmandan önce |
| Dinlenme günü | Satır yok (seans yok) | **Satır olmalı** (wellness her gün) |
| Kaynak | Koç veya sporcu | Sporcu (self-report) |

Birleştirmek, dinlenme günü check-in'inin sahte bir RPE satırı uydurmasını zorlar ve `unique(athlete_id, log_date)` semantik olarak çakışır. **Ayrı tablo, tarih üzerinden zamansal join.**

### 2.2 İlişki haritası

```
                    athletes (id, user_id, org_id, team_id)
                        │
        ┌───────────────┼────────────────┐
        │ FK cascade    │ FK cascade     │ FK cascade
        ▼               ▼                ▼
  wellness_checkins  acwr_logs      readiness_scores
  (sabah, öznel)    (akşam, yük)    (TÜRETİLMİŞ, cache)
        │               │                ▲
        └───────────────┴────────────────┘
          (athlete_id, date) üzerinden
          ZAMANSAL join — aralarında FK YOK
```

- `wellness_checkins` ↔ `acwr_logs`: **FK yok.** Biri diğeri olmadan var olabilir (dinlenme günü wellness'i var, yükü yok). Join yalnızca `(athlete_id, tarih)`.
- `readiness_scores`: **türetilmiş tablo (cache)**, doğruluk kaynağı değil. Her zaman `wellness_checkins` + `calculate_acwr()`'den yeniden üretilebilir olmalı.

### 2.3 `wellness_checkins` — SQL taslağı

```sql
-- =============================================
-- 012_wellness.sql — Readiness Katmanı Parça 1
-- Tamamen ADDITIVE: mevcut hiçbir tablo/politika değişmez.
-- =============================================

create table wellness_checkins (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  checkin_date  date not null default current_date,

  -- McLean (2010) 5 maddelik wellness seti — §4'te gerekçelendirildi.
  -- KRİTİK: TÜM maddeler AYNI YÖNDE. 1 = en kötü, 5 = en iyi.
  -- Reverse-coding YOK — bu, tüm bir hata sınıfını (ters puanlama) ortadan kaldırır.
  sleep_quality smallint not null check (sleep_quality between 1 and 5), -- 5 = çok dinlendirici
  soreness      smallint not null check (soreness between 1 and 5),      -- 5 = hiç ağrı yok
  stress        smallint not null check (stress between 1 and 5),        -- 5 = çok rahat
  fatigue       smallint not null check (fatigue between 1 and 5),       -- 5 = çok dinç
  mood          smallint not null check (mood between 1 and 5),          -- 5 = çok pozitif

  -- Uyku SÜRESİ, uyku KALİTESİNDEN farklı bir yapıdır. Opsiyonel, ucuz, değerli.
  sleep_hours   numeric(3,1) check (sleep_hours between 0 and 24),

  -- 5..25 — yüksek = iyi. integer seçildi: smallint toplamı PG'de integer döner,
  -- smallint'e cast etmek gereksiz belirsizlik yaratır.
  wellness_total integer generated always as
    (sleep_quality + soreness + stress + fatigue + mood) stored,

  -- Kanıt, serbest metnin sayılardan daha değerli olabileceğini söylüyor (§4.3).
  notes         text,

  -- Self-report ile koç-vekil girişini ASLA sessizce karıştırma. §0'daki
  -- 4/6 hesapsız sporcu gerçeği bunu zorunlu kılıyor.
  source        text not null default 'athlete'
                check (source in ('athlete', 'coach_proxy')),
  entered_by    uuid references auth.users(id),

  submitted_at  timestamptz default now(),  -- sabah uyumu (compliance) ölçümü için
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  unique (athlete_id, checkin_date)
);

-- Komuta merkezi "bugün takımım" sorgusu ve sporcu trend sorgusu için
create index idx_wellness_athlete_date on wellness_checkins (athlete_id, checkin_date desc);
create index idx_wellness_date         on wellness_checkins (checkin_date);

-- 009'daki update_updated_at() zaten var, yeniden kullan
create trigger wellness_updated_at
  before update on wellness_checkins
  for each row execute function update_updated_at();
```

### 2.4 RLS — mevcut fonksiyonlar yetiyor mu?

**Sorunun cevabı: Evet, `my_role` / `my_team_id` / `is_super_admin` yeterli. Yeni fonksiyon GEREKMİYOR.** Ama üç boşluk var:

#### 🔴 Boşluk 1 — UPDATE politikası (mevcut sistemde de bug var)

Canlı `pg_policies` sorgusu:

| Tablo | Politika | Komut |
|---|---|---|
| `acwr_logs` | `acwr_insert` | INSERT |
| `acwr_logs` | `acwr_select` | SELECT |
| | **(UPDATE yok)** | |

Ama [packages/db/queries/acwr.ts:22-34](packages/db/queries/acwr.ts#L22-L34) `upsert(..., { onConflict: "athlete_id,log_date" })` kullanıyor. Upsert çakışınca **UPDATE'e döner** → UPDATE politikası olmadığı için **RLS reddeder**. Yani bugün: *aynı güne ikinci kez ACWR logu girmek sessizce başarısız oluyor.*

> Bu, readiness planının kapsamı dışında **mevcut bir bug**. Ayrı olarak düzeltilmeli (§8'de listelendi). Buradaki dersi alıyoruz: **`wellness_checkins` UPDATE politikası olmadan doğmayacak.** Sporcu yanlış tuşa bastığında düzeltebilmeli.

#### 🟠 Boşluk 2 — Koç = tek takım

`my_team_id(org)` tek bir `team_id` döner (`memberships` üzerinde `unique(user_id, org_id)` + `limit 1`). **İki takımı çalıştıran koç şu an temsil edilemez.**

Bugünkü veri için sorun değil (komuta merkezi koça tam olarak bir takım gösterir). Ama bu bir **mimari tavan**: çok takımlı koç ileride `coach_teams` join tablosu + `my_team_ids(org) returns uuid[]` migration'ı gerektirir. **Bugün yapma** — sadece bilerek kabul et.

#### 🟢 Boşluk 3 — Yazma yetkisi: `acwr_insert`'ten bilinçli olarak AYRILIYORUZ

`acwr_insert` koç/admin'in sporcu adına yazmasına izin verir. Wellness için bu prensipte yanlış — self-report'un tüm değeri sporcunun kendi bildirimi olması. Ama §0'daki gerçek (4/6 hesapsız, genç sporcular) saf "yalnızca sporcu yazar" politikasını kullanılamaz kılıyor.

**Çözüm: koç vekil girişine izin ver, ama `source` ile damgala.** Böylece readiness motoru vekil veriyi ayrı ağırlıklandırabilir/işaretleyebilir ve sen "bu skor sporcunun mu, koçun tahmini mi?" sorusunu her zaman cevaplayabilirsin.

```sql
alter table wellness_checkins enable row level security;

-- SELECT — acwr_select kalıbıyla BİREBİR aynı (kanıtlanmış)
-- Sporcu: kendisi · Koç: kendi takımı · Admin: tüm org · Super admin: hepsi
create policy "wellness_select" on wellness_checkins for select using (
  is_super_admin()
  or exists (
    select 1 from athletes a
    where a.id = wellness_checkins.athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) = 'admin'
      or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
    )
  )
);

-- INSERT — source damgası politikanın İÇİNDE zorlanır.
-- Sporcu 'coach_proxy' yazamaz; koç 'athlete' yazamaz. Damga yalan söyleyemez.
create policy "wellness_insert" on wellness_checkins for insert with check (
  exists (
    select 1 from athletes a
    where a.id = wellness_checkins.athlete_id
    and (
      (a.user_id = auth.uid() and source = 'athlete')
      or (
        source = 'coach_proxy'
        and (
          my_role(a.org_id) = 'admin'
          or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
        )
      )
    )
  )
);

-- UPDATE — acwr_logs'ta EKSİK OLAN politika. Upsert ve düzeltme bunsuz çalışmaz.
-- using: hangi satıra dokunabilir · with check: dokunduktan sonra hâlâ geçerli mi
create policy "wellness_update" on wellness_checkins for update
using (
  exists (
    select 1 from athletes a
    where a.id = wellness_checkins.athlete_id
    and (
      (a.user_id = auth.uid() and source = 'athlete')
      or (
        source = 'coach_proxy'
        and (
          my_role(a.org_id) = 'admin'
          or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
        )
      )
    )
  )
  -- Geçmişi geriye dönük "düzeltmeyi" engelle: yalnızca bugün ve dün.
  -- Bayat wellness verisi, olmayan wellness verisinden daha kötüdür.
  and checkin_date >= current_date - 1
)
with check (checkin_date >= current_date - 1);

-- DELETE politikası YOK — bilinçli. Wellness geçmişi silinmez (audit izi).
```

**Realtime** (komuta merkezinin canlı güncellenmesi için — [011_realtime.sql](supabase/migrations/011_realtime.sql) kalıbı):

```sql
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'wellness_checkins'
  ) then
    alter publication supabase_realtime add table public.wellness_checkins;
  end if;
end $$;
```

> RLS realtime'da da geçerli: her abone yalnızca `wellness_select`'in izin verdiği satırların değişimini alır. Koç, başka takımın check-in'ini realtime'da göremez.

### 2.5 `readiness_scores` — şema şimdi, motor sonra

```sql
-- 013_readiness_scores.sql — ŞEMA ŞİMDİ, MOTOR SONRAKİ İTERASYON

create table readiness_scores (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  score_date    date not null,

  score         numeric(5,2) check (score between 0 and 100),
  status        text check (status in ('ready','caution','risk','insufficient_data')),

  wellness_component numeric(5,2),
  acwr_component     numeric(5,2),

  -- BİREYSEL taban çizgisi. Mutlak eşik DEĞİL — §4.4'teki kanıt bunu gerektiriyor.
  -- "Kendi 28 günlük ortalamasının 1.5 SD altında" > "15'in altında"
  wellness_z    numeric(5,2),
  baseline_mean numeric(5,2),
  baseline_sd   numeric(5,2),
  baseline_n    int,          -- kaç günlük geçmişe dayanıyor — GÜVEN göstergesi

  -- Skoru üreten girdilerin anlık görüntüsü. "Bu skor neden 42?" sorusu
  -- 3 ay sonra da cevaplanabilmeli.
  inputs        jsonb,

  -- KRİTİK: ağırlıkları her ayarladığında skorun ANLAMI değişir. Versiyon
  -- damgası olmadan geçmiş skorlar yorumlanamaz hale gelir.
  algorithm_version text not null,
  computed_at   timestamptz default now(),

  unique (athlete_id, score_date)
);

create index idx_readiness_athlete_date on readiness_scores (athlete_id, score_date desc);
create index idx_readiness_date_status  on readiness_scores (score_date, status);

alter table readiness_scores enable row level security;

-- SELECT: wellness_select ile aynı kalıp
create policy "readiness_select" on readiness_scores for select using (
  is_super_admin()
  or exists (
    select 1 from athletes a
    where a.id = readiness_scores.athlete_id
    and (
      a.user_id = auth.uid()
      or my_role(a.org_id) = 'admin'
      or (my_role(a.org_id) = 'coach' and a.team_id = my_team_id(a.org_id))
    )
  )
);

-- INSERT/UPDATE politikası YOK — bilinçli.
-- RLS açık + politika yok = normal kullanıcı yazamaz. Yalnızca service_role
-- (Edge Function) yazar. Türetilmiş tablo elle kurcalanmamalı.
```

**`insufficient_data` status'u neden şart:** 14 günden az geçmişle z-skoru gürültüdür. Ürün, "veri yetersiz" demek yerine uydurma bir renk gösterirse koç ona bir kez güvenir, yanılır ve bir daha hiç güvenmez. Az veri varken **gri** göster.

---

## 3. ADIM 2 CEVABI — RLS ÖZETİ

| Gereksinim | Karşılanıyor mu? | Nasıl |
|---|---|---|
| Sporcu kendi check-in'ini girer | ✅ | `wellness_insert`: `a.user_id = auth.uid() and source='athlete'` |
| Sadece kendisi + koç + admin görür | ✅ | `wellness_select`, `acwr_select` kalıbı birebir |
| Koç takımının tümünü görür | ✅ | `my_role(org)='coach' and a.team_id = my_team_id(org)` |
| Sporcu hatasını düzeltir | ⚠️ **Yeni politika şart** | `wellness_update` — `acwr_logs`'ta bu eksik (bug) |
| Hesapsız sporcu (4/6) | ⚠️ **Tasarım kararı** | `source='coach_proxy'` + RLS damga zorlaması |
| Çok takımlı koç | ❌ **Mimari tavan** | `my_team_id` tek değer döner — gelecek migration |
| Yeni helper fonksiyon | ✅ **Gerekmiyor** | Mevcut üçlü yeterli |

**Performans notu:** `my_role()`/`my_team_id()` `stable security definer`. Postgres bunları satır başına çağırabilir. Takım başına 5-30 sporcuda önemsiz. İleride büyürse `(select my_role(...))` sarmalı initplan cache'ini açar — şimdi gereksiz optimizasyon.

---

## 4. ADIM 3 — WELLNESS METRİKLERİ (KANITA DAYALI)

### 4.1 Önerdiğin sete dair dürüst değerlendirme

Önerin: uyku kalitesi, kas ağrısı, stres, **enerji**, ruh hali, yorgunluk → 6 madde, 1-5.

**Bulgu: 6 değil 5 madde olmalı. "Enerji" çıkarılmalı.**

`enerji/canlılık` ile `yorgunluk`, aynı yapının ters kutuplarıdır ("dinç hissediyorum" ↔ "yorgun hissediyorum"). İkisini birden sorup toplarsan:
- Sporcu neredeyse aynı iki soruyu cevaplar (anket yorgunluğu, 1 dakika hedefi zorlanır),
- İki madde ~-1 korelasyona sahip olur,
- Toplam skorda **yorgunluk boyutu çift ağırlık** alır — skor sessizce yorgunluk ağırlıklı hale gelir.

### 4.2 Doğrulanmış setler — hangisi?

| Set | Maddeler | Ölçek | Yön |
|---|---|---|---|
| **Hooper & Mackinnon (1995)** | uyku, stres, yorgunluk, kas ağrısı (**4**) | **1-7** | 1 = iyi, 7 = kötü |
| **McLean ve ark. (2010)** | yorgunluk, uyku kalitesi, kas ağrısı, stres, **ruh hali** (**5**) | **1-5** | 5 = iyi, 1 = kötü |

Senin istediğin **1-5 ölçek + ruh hali dahil** → bu tam olarak **McLean setidir**, Hooper değil.

### 4.3 ⚠️ "Hooper Index'e uygun mu?" — dürüst cevap: HAYIR, ve öyle demeyelim

Bu, araştırmanın en önemli uyarısı. Jeffries ve ark. (2020) sistematik derlemesi, tam olarak bizim yapmak üzere olduğumuz şeyi eleştiriyor:

> Çalışmalar "Hooper Index" / "Hooper Score" gibi **doğrulanmış bir yapı ima eden ama aslında var olmayan** terimler üretti. Ve: *"birden fazla ampirik ölçekten madde seçip birleştirmek, onların yerleşik psikometrik özelliklerini geçersiz kılar."*

**Karar:** 1-5 ölçekte 5 madde kullanacağız (McLean seti). Bunu ürün içinde **"Hooper Index" olarak ADLANDIRMAYACAĞIZ.** Dürüst etiket: *"Günlük wellness anketi (McLean ve ark. 2010 uyarlaması)"*.

Gerçek Hooper istiyorsak 1-7 ölçekte 4 madde olmalı — ama o zaman ruh halini kaybederiz ve 1-7 ölçek mobilde tek elle daha zor. **1-5 / 5 madde önerimizdir.**

> 📌 **Tutarlılık notu:** `Oto-program-agent` projende Hooper Index zaten uygulanmış durumda (hafıza kaydı, 2026-06-24). O ayrı bir proje ama aynı sporcuları ölçüyorsa **iki farklı ölçek iki farklı sayı üretir ve karşılaştırılamaz.** İki sistem birleşecekse bu bilinçli bir karar olmalı, kaza olmamalı.

### 4.4 🔴 En kritik kanıt: mutlak eşik kullanma

İki derlemenin ortak sonucu:

- **Saw, Main & Gastin (2016, BJSM):** Öznel ölçümler, akut ve kronik yükü objektif ölçümlerden **daha hassas ve tutarlı** yansıtır. (Yani: wellness anketi, WHOOP'tan daha iyi bir yük göstergesi olabilir — bu katmanın değerini doğruluyor.)
- **Jeffries ve ark. (2020):** Ama yükle ilişkiler **önemsizden çok büyüğe** kadar değişiyor; hiçbir madde tek başına tutarlı değil. Öneri: **korelasyonlara değil, bireysel "trafik ışığı" yaklaşımına** yaslan. Ve bu araçların birincil rolü *"iletişimi kolaylaştırmak ve bilgi paylaşımını tetiklemek."*

**Bunun tasarıma üç doğrudan yansıması:**

1. **Renk kodu, sporcunun KENDİ taban çizgisine göre** hesaplanır (`wellness_z`), takım geneli sabit eşiğe göre değil. Kronik olarak 16 puan veren sporcu için 16 normaldir; 22 veren sporcu için 16 alarmdır.
2. **`notes` alanı muhtemelen en değerli kolon.** Skor konuşmayı *başlatır*; kararı koç verir. Komuta merkezinde not ikonu belirgin olmalı.
3. **Bu bir teşhis aracı değil.** Ürün dili "risk altında" değil, "konuş" demeli. Sağlık iddiası yapmayan bir dil seç.

### 4.5 Nihai metrik seti

| Alan | Soru (TR) | 1 | 5 |
|---|---|---|---|
| `sleep_quality` | Uykun nasıldı? | Hiç dinlenemedim | Çok dinlendirici |
| `fatigue` | Bugün ne kadar dinçsin? | Sürekli yorgun | Çok dinç |
| `soreness` | Kas ağrın var mı? | Çok ağrılı | Hiç ağrı yok |
| `stress` | Stres seviyen? | Çok stresli | Çok rahat |
| `mood` | Ruh halin? | Çok kötü / gergin | Çok pozitif |
| `sleep_hours` | Kaç saat uyudun? *(ops.)* | — | — |
| `notes` | Eklemek istediğin? *(ops.)* | — | — |

**Tümü aynı yönde: 5 = daima iyi.** Toplam 5-25, yüksek = iyi. Ters puanlama yok → ters puanlama bug'ı da yok.

---

## 5. ADIM 4 — KOÇ KOMUTA MERKEZİ

### 5.1 🔴 Route kararı — `/dashboard` KULLANILAMAZ

[middleware.ts:168-174](apps/web/middleware.ts#L168-L174):

```ts
// /dashboard sadece admin rolüne açık
if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
  if (role !== "admin") {
    const dest = role === "athlete" ? "/programs" : "/athletes";
    return NextResponse.redirect(new URL(dest, request.url));  // koç → /athletes
  }
}
```

Ayrıca [sidebar.tsx:23-37](apps/web/components/shared/sidebar.tsx#L23-L37) `/dashboard`'ı **hiç listelemiyor** — koç oraya bir link bile göremiyor. Bu zaten PROGRESS.md § Bilinen Sorunlar #2'de "confusion yaratabilir" diye kayıtlı.

**Karar: yeni route `/readiness`** (`roles: ["admin", "coach"]`), sidebar'a eklenir.

**Neden `/dashboard`'ı koça açmıyoruz:**
- Admin guard'ını gevşetmek, tam da logout-guard bug'ında yaşadığımız sınıfta bir regresyon riski (middleware'de rol yönlendirmesi oynamak bize zaten bir kez pahalıya patladı).
- Admin'in org istatistikleri ayrı ve geçerli bir işlev — üzerine yazmak kayıp.
- İleride admin `/dashboard`'ına "takım readiness özeti" kartı **eklenebilir** (`/readiness`'e link). Additive, risksiz.

### 5.2 Layout — kart grid mi, tablo mu, ısı haritası mı?

**Öneri: risk-sıralı liste/tablo birincil. Isı haritası ikincil sekme. Kart grid hayır.**

Gerekçe — koçun sabah 08:00'de sorduğu soru şu değil: *"takımımın 7 günlük deseni nedir?"* Şu: **"bugün kiminle konuşmam lazım?"** Bu bir **triyaj listesi** sorusudur.

| Seçenek | Değerlendirme |
|---|---|
| **Sıralı tablo** ✅ | Triyaj sorusunu doğrudan cevaplar. 5-30 satır tek ekranda taranır. Sıralama = önceliklendirme. |
| Kart grid ❌ | Dikey alanı harcar, 6 karttan sonra kaydırma başlar, sinyali gömer. Kart eşit önem ima eder — oysa mesele önem sırası. |
| Isı haritası 🟡 | *Desen* sorusu için mükemmel (bu sporcu 4 gündür düşüyor mu?), *bugün* sorusu için değil. **İkinci sekme olarak değerli.** |

### 5.3 Ekran taslağı

```
┌──────────────────────────────────────────────────────────────────┐
│  Takım Readiness — Artistik Takım          15 Temmuz, Salı       │
│  ● Canlı                                    [Bugün] [7 Gün]      │
├──────────────────────────────────────────────────────────────────┤
│  Check-in: 14/24        ⚠ 2 dikkat    ● 12 normal    ○ 10 eksik  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠ DİKKAT — konuşulacak                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ⚠ Ayşe Y.    12/25  ▼ -5.2 kendi ort.  Uyku 1  ACWR 1.４ 📝│  │
│  │ ⚠ Mehmet K.  15/25  ▼ -3.1 kendi ort.  Ağrı 2  ACWR 1.1   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ● NORMAL                                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ● Zeynep A.  21/25  ▲ +1.0             —       ACWR 0.9   │  │
│  │ ● Can B.     19/25  ≈  0.0             —       ACWR 1.0   │  │
│  │ … 10 sporcu daha                                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ○ CHECK-IN YOK  (risk değil — veri yok)                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ○ Elif D.     —   Son: dün 07:40                           │  │
│  │ ○ Ali K.      —   ⓘ Hesabı yok — davet gönder →            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Tasarımı yöneten kurallar:**

1. **Eksik check-in ≠ kırmızı.** Ayrı, gri bölüm. "Veri yok"u "tehlike" ile karıştırmak, koçun araca güvenini yok eder — en sık yapılan hata. Eksik olan *uyum* sorunudur, *risk* sinyali değil.
2. **Delta, mutlak skordan önce gelir.** `12/25` tek başına anlamsız; `-5.2 kendi ortalamasından` eyleme dönüştürülebilir (§4.4).
3. **En kötü madde chip'i** (`Uyku 1`) — koç satıra tıklamadan konuşmanın konusunu görür.
4. **Not ikonu (📝) belirgin** — kanıt, serbest metnin skordan değerli olabileceğini söylüyor.
5. **Renk asla tek başına taşımaz** — ikon + metin eşlik eder (renk körlüğü + siyah-beyaz çıktı).
6. **`insufficient_data` → gri**, uydurma yeşil değil. `baseline_n < 14` ise delta gösterme.
7. **"Hesabı yok" satırı doğrudan davet eylemine bağlanır** — §0'daki 4/6 sorununu ürünün içinde görünür ve çözülebilir kılar.

**7 Gün sekmesi (ikincil):** sporcu satırları × 7 gün sütunu ısı haritası. Desen avı için. Renk paleti için `dataviz` skill'i uygulama aşamasında okunmalı (sıralı palet + erişilebilirlik).

### 5.4 Veri erişimi

- **Server component** ile ilk yükleme (mevcut `athletes`/`programs` sayfalarının kalıbı).
- Sorgu: takımın tüm aktif sporcuları **LEFT JOIN** bugünün check-in'i → eksikler doğal olarak null gelir. RLS zaten kapsamı daraltır; `team_id` filtresi bile teknik olarak gereksiz (ama açıkça yazmak sorguyu hızlandırır ve niyeti belgeler).
- **Realtime**: `wellness_checkins` publication'a eklenir; check-in gelince `router.refresh()` — [athletes-client.tsx](apps/web/app/(dashboard)/athletes/) ve [programs-client.tsx](apps/web/app/(dashboard)/programs/) kalıbının aynısı.
- Admin için takım seçici (admin tüm org'u görür, koç tek takım — §3).

---

## 6. ADIM 5 — MOBİL CHECK-IN AKIŞI

### 6.1 Nereye oturur? — Yeni tab değil, zorunlu modal değil, **banner**

| Seçenek | Karar | Gerekçe |
|---|---|---|
| **Program ekranında banner** ✅ | **Seçilen** | Sporcu zaten oraya iniyor ([index.tsx](apps/mobile/app/index.tsx) → `/(tabs)/program`). Tamamlanınca **kendini siler** → tamamlandıktan sonra sıfır maliyet. |
| Yeni tab ❌ | Hayır | 60 saniyelik günlük bir iş için **kalıcı** navigasyon maliyeti. Tamamlandıktan sonra ölü ağırlık. 4 tab → 5 tab hepsini seyreltir. |
| Zorunlu modal ❌ | Hayır | Akşam 17:00'de "bugünkü seansım neydi?" diye açan sporcuyu rehin alır. Güveni yıkar ve **tıkla-geç çöp verisi** üretir — self-report'un tek değerini yok eder. |

**Akış:**

```
Uygulama açılır → /(tabs)/program
   │
   ├─ bugün check-in YOK  → "Aktif Program"ın ÜSTÜNDE belirgin kart
   │                         "☀️ Günaydın — 1 dakikada check-in yap →"
   │                              │ dokun
   │                              ▼
   │                         /(tabs)/program/checkin  (AYRI ROUTE)
   │                         5 soru × 5 seçenek, tek ekran, kaydırmasız
   │                         + uyku saati (ops.) + not (ops.)
   │                              │ gönder → upsert
   │                              ▼
   │                         program'a dön, banner → yeşil özet satırı
   │
   └─ bugün check-in VAR  → ince özet: "✓ Check-in yapıldı · 19/25"
                             (dokunulursa düzenle — UPDATE politikası bunu sağlar)
```

### 6.2 🔴 Projeye özgü risk — banner'ı Program ekranına koymak

**Program ekranı, tam da `printUpgradeWarning` donma bug'ının yaşandığı ekran.** MOBILE_STATUS.md'nin tespiti aynen:

> *"Sadece haftalık görünüm (7 gün × iç içe dinamik className) css-interop 'upgrade' uyarısını tetikleyecek yoğunlukta. Recovery/Yarışmalar/Profil sorunsuz."*

Yani bu ekran, className yoğunluğuna karşı **kanıtlanmış şekilde hassas**. Oraya bir banner + (daha kötüsü) inline form eklemek, bilinen bir dev-mode hang'in olduğu tek ekranı yeniden yoğunlaştırır.

**Azaltıcı önlemler:**
1. **Form ASLA `program/index.tsx` içinde inline olmasın** — ayrı route (`program/checkin`). Banner sadece birkaç node'luk basit bir kart olsun.
2. Patch yerinde (`patches/react-native-css-interop@0.2.6.patch`) ve `printUpgradeWarning` artık derin stringify yapmıyor → risk teorik olarak kapalı.
3. **Ama cihazda doğrula.** Bu ekranda "statikte temiz" iki kez yanılttı. Teşhis yöntemi hazır: *1 sn'lik sayaç + render log — log artıyor ama ekran donuksa native donma.*
4. Etki yalnızca dev/Expo Go (`NODE_ENV !== "production"`) — prod build'i bloklamaz.

### 6.3 Wellness geçmişi → Recovery tab'ına

**Recovery tab'ı şu an fiilen boş** (wearable sync kapalı, `wearable_daily_metrics` 0 satır → sporcu sürekli boş-durum görüyor).

Wellness trendi (son 7-14 gün, kendi taban çizgisiyle) **oraya** konur. İki kazanç:
- Recovery tab'ı wearable'lardan **önce** gerçek içerik kazanır,
- Program ekranı yoğunlaşmaz (§6.2).

Wearable'lar açıldığında Recovery doğal olarak "öznel + objektif" birleşimi olur — ki bu zaten doğru son hâl.

### 6.4 🟡 Push bildirimi — bugün mümkün değil

`athlete_push_tokens` tablosu var (0 satır) ama [notifications.ts](apps/mobile/lib/notifications.ts) **bilinçli olarak no-op** (`undefined` döner, dev build sonraki sprint). Expo Go SDK 53+ push'u zaten desteklemiyor.

**Sonuç:** "Sabah 07:00 check-in hatırlatması" bu iterasyonda **yok**. Uyum tamamen sporcunun uygulamayı açmasına + banner'a bağlı. Bu, check-in oranının başlangıçta düşük olacağı anlamına gelir — **beklenti olarak şimdi kabul et**, sonra dev build ile çöz. Bunu bilmeden "özellik çalışmıyor" sonucuna varmayalım.

---

## 7. ADIM 6 — UYGULAMA SIRASI

Her adım tek başına sevk edilebilir ve doğrulanabilir. **Ölçüt: her adımdan sonra sistem çalışır durumda.**

| # | Adım | Neden bu sırada | Risk |
|---|---|---|---|
| **0** | 🔴 **`RESEND_API_KEY` set et + 1 sporcuyu davet et, hesabını doğrula** | §0'daki zincir. Bu olmadan katmanın demo değeri yok. Ucuz. | Yok |
| **1** | `012_wellness.sql` — tablo + RLS + index + realtime | Şema önce. Tamamen additive. | ~Yok |
| **2** | `packages/db/types.ts` regen + `queries/wellness.ts` + `validators/wellness.ts` | Web ve mobil paylaşır — ikisinden önce | Düşük (§8) |
| **3** | 📱 Mobil: `program/checkin` route + banner | **Önce veri üretimi.** Komuta merkezini boş veriyle inşa etmek onu doğrulanamaz kılar. | Orta (§6.2) |
| **4** | 🖥️ Web: `/readiness` + sidebar girişi (salt-okunur) | Artık gösterecek gerçek veri var | Düşük |
| **5** | 📱 Recovery tab'ına wellness trendi | Bağımsız, bekleyebilir | Düşük |
| **6** | ⏭️ **Sonraki iterasyon:** `013_readiness_scores.sql` + motor | 14+ günlük gerçek veri **birikmeden** taban çizgisi ayarlanamaz | — |

**Neden mobil (3) web'den (4) önce:** Komuta merkezini önce yaparsak boş bir ekranı test etmiş oluruz — mobil bug'ında öğrendiğimiz ders: *gerçek veriyle cihazda doğrulamadan "tamam" deme.*

**Neden readiness motoru (6) gerçekten sonraya kalmalı:** Motor bireysel taban çizgisine dayanıyor (§4.4). Taban çizgisi ≥14 gün veri istiyor. Bugün 1 satır `acwr_logs` ve 0 satır wellness var. **Motoru şimdi yazmak, ayarlanamayan ve doğrulanamayan bir formül yazmaktır.** Şema bugün hazır (§2.5) — motor veri birikince.

---

## 8. MEVCUT SİSTEMİ BOZMA RİSKİ

**Genel değerlendirme: düşük.** Plan neredeyse tamamen additive — yeni tablo, yeni route, yeni ekran. Mevcut hiçbir tablo, politika veya middleware kuralı değişmiyor.

| Risk | Seviye | Açıklama / Önlem |
|---|---|---|
| Yeni tablo + politika | 🟢 Yok | Additive. Mevcut tablolara dokunmuyor → regresyon yolu yok. |
| **Middleware** | 🟢 Yok | **Dokunmuyoruz.** `/readiness` normal koç route'u (§5.1). Logout-guard sınıfı regresyonun tekrarı önlenmiş oluyor. |
| `packages/db/types.ts` **regen** | 🟡 Düşük-Orta | Regen, web+mobil genelinde **mevcut** tip sapmalarını ortaya çıkarabilir (readiness'in sebep olmadığı hatalar). **Önlem: kendi commit'inde yap**, `tsc --noEmit`'i web ve mobilde ayrı çalıştır. Karışırsa nedeni bilirsin. |
| **Mobil Program ekranı yoğunluğu** | 🟡 Orta | Bilinen dev-mode donma bölgesi (§6.2). Önlem: form ayrı route, banner sığ, **cihazda doğrula**. |
| Sidebar değişikliği | 🟢 Düşük | Paylaşılan bileşen ama tek satır ekleme, `roles: ["admin","coach"]` ile kapsamlı. |
| Realtime publication | 🟢 Düşük | 011'in kanıtlanmış kalıbı. RLS geçerliliğini koruyor. |
| Seed / test verisi | 🟡 Düşük | Komuta merkezinin gerçekten test edilmesi için birden fazla sporcunun **birden fazla günlük** wellness'i gerekir. Elle üretmek yavaş → seed script gerekebilir. |

### 8.1 Bu planın ortaya çıkardığı, kapsam DIŞI mevcut buglar

Readiness çalışmasında bulundu, ayrı ele alınmalı:

1. 🔴 **`acwr_logs` UPDATE politikası eksik** ama `upsertAcwrLog` upsert yapıyor → aynı güne ikinci ACWR logu **sessizce RLS'e takılıyor**. (§2.4) — *Muhtemelen bugün canlıda kırık, kimse fark etmemiş çünkü `acwr_logs`'ta 1 satır var.*
2. 🟡 **`calculate_acwr()` ölü kod** — DB'de duruyor, uygulama ACWR'yi client-side JS'te hesaplıyor. İki farklı doğruluk kaynağı, biri kullanılmıyor. Readiness motoru bunu netleştirmek zorunda kalacak. (§1.2)
3. 🟡 **`acwr_ratio` snapshot** — yazıldığı anda donuyor, sonraki günlerde yeniden hesaplanmıyor. Readiness'in yük bileşeni buna güvenmemeli. (§1.2)

---

## 9. AÇIK KARARLAR — Onayın Gerekiyor

Uygulamaya geçmeden netleşmesi gerekenler:

1. **Enerji maddesi çıkarılsın mı?** (6 → 5 madde, McLean seti). Öneri: **evet** (§4.1).
2. **Koç vekil girişi (`coach_proxy`) bu iterasyonda olsun mu?** Hesapsız 4 sporcu için tek yol. Öneri: **şema + RLS'e şimdi koy, web UI'ını sonraya bırak** — böylece kapı açık ama önce gerçek self-report'u test ederiz.
3. **`Oto-program-agent` ile ölçek tutarlılığı** — o proje Hooper (1-7 / 4 madde) kullanıyor, biz McLean (1-5 / 5 madde) öneriyoruz. Aynı sporcular ölçülecekse iki sayı karşılaştırılamaz. Birleşme planı var mı? (§4.3)
4. **Komuta merkezi "risk" dili** — kanıt teşhis iddiasını desteklemiyor (§4.4). "Risk altında" yerine "konuşulacak" öneriyorum. Onay?

---

## 10. KAYNAKLAR

- Saw AE, Main LC, Gastin PB (2016). *Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures: a systematic review.* Br J Sports Med 50:281-291. — [PMC4789708](https://pmc.ncbi.nlm.nih.gov/articles/PMC4789708/) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/26423706/)
- Jeffries AC ve ark. (2020). *Single-Item Self-Report Measures of Team-Sport Athlete Wellbeing and Their Relationship With Training Load: A Systematic Review.* — [PMC7534939](https://pmc.ncbi.nlm.nih.gov/articles/PMC7534939/) — *"Hooper Index" adlandırma eleştirisi ve bireysel trafik-ışığı önerisi buradan.*
- McLean BD ve ark. (2010). 5 maddelik wellness anketi (1-5 ölçek: yorgunluk, uyku, ağrı, stres, ruh hali). — [Global Performance Insights özeti](https://www.globalperformanceinsights.com/post/wellness-questionnaires-for-athlete-monitoring) · [Adam Virgile Sports Science](https://adamvirgile.com/2019/04/22/everything-you-need-to-know-about-using-wellness-questionnaires-in-sport/)
- Hooper SL, Mackinnon LT (1995). 4 maddelik indeks (1-7 ölçek). Uygulama örneği: [Frontiers in Physiology (2019) — Hooper Index & HRV, profesyonel futbol](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2019.00109/full)

---

*AŞAMA 1 tamamlandı — kod yazılmadı. AŞAMA 2 için §9'daki kararlar + §7 Adım 0 gerekiyor.*
