## MCI v7.0 Entegrasyonu Planı

Yüklenen "WorkWorld MCI v7.0" spesifikasyonunu sisteme entegre edeceğim. Amaç: şehirlerin MCI puanına göre koltuk kontenjanı (3–65) belirlemek, pilot ülkelerle sınırlamak, formülü şeffaf olarak paylaşmak ve üye→admin onay akışı kurmak.

### 1. Veritabanı (yeni tablolar)
- **`pilot_countries`**: kod (TR, DE, NL vb.), isim_i18n, aktif.
- **`mci_cities`**: şehir, ülke_kodu, tüm 16 MCI değişkeni (N, G, F, U, S, T, P_search, M_loc, H, T_flow, AI_index, ESG_score, Exp, Imp, Y_ratio, E_ratio, B_rate, sigma, delta_pulse, net_syn), hesaplanmış `cp_final`, `seat_quota`, `approved`, `slug`.
- **`mci_submissions`**: üye tarafından önerilen şehir/güncelleme; `status` (pending/approved/rejected), `payload jsonb`, `reviewer_id`, `review_note`. Admin onayı sonrası `mci_cities`'e uygulanır.
- Mevcut `professions` ve `event_markers` tablolarına `country_code` alanı ekleyip pilot ülke filtresi uygulanır.
- RLS: herkes onaylı `mci_cities` okur; auth kullanıcı `mci_submissions` insert; sadece admin update/delete + `mci_cities` yazımı.

### 2. Hesaplama motoru
- `src/lib/mci.ts`: PDF'teki JS bloğunu birebir uygulayan `calculateMCI(metrics)` fonksiyonu (Faz A/B/C, D_dyn clamp 0.7–1.3, K clamp 3–65).
- Submission approve edildiğinde otomatik `cp_final` + `seat_quota` yeniden hesaplanır.

### 3. Sayfalar
- **`/mci` (Matris Şehir Endeksi)**: 
  - Formülü açık şekilde LaTeX benzeri render (KaTeX yerine sade Tailwind + `<code>`) + değişken sözlüğü tablosu + JS kod bloğu (copy button). "Açık kaynak formül" bölümü.
  - Pilot ülke sekmeleri → şehir kartları (CP_final, Koltuk K, dinamik renk).
  - "Şehir öner / veri güncelle" butonu → submission formu (16 alan, Zod validasyon, anlık MCI önizleme).
- **`/admin` MCI sekmesi**: 
  - Submissions kuyruğu: değişiklik diff'i, hesaplanan CP/K önizlemesi, Onayla/Reddet + not.
  - Şehir CRUD tablosu (arama+pagination, `useAdminTable`).
  - Pilot ülke CRUD.
- Etkinlik oluşturma / meslek ekleme formlarına pilot ülke seçici; olmayan ülke seçilemez.

### 4. i18n & Navigasyon
- Route registry'e `mci` eklenir: `/mci` (en) · `/matris-sehir-endeksi` (tr) · `/matrix-staedte-index` (de).
- Header/Footer/Sidebar/CommandPalette'e MCI linki.
- TR/EN/DE çeviri anahtarları.

### 5. Dosyalar
- **Yeni**: `src/lib/mci.ts`, `src/pages/MciPage.tsx`, `src/components/MciSubmissionForm.tsx`, `src/components/admin/MciAdmin.tsx`.
- **Güncelleme**: `src/App.tsx`, `src/i18n/routes.ts`, `src/i18n/translations.ts`, `src/pages/Admin.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/AppSidebar.tsx`, `src/components/CommandPalette.tsx`, event/profession formları.
- Migration: yukarıdaki tablolar + GRANT + RLS + updated_at trigger.

Onaylarsan migration ile başlıyorum.