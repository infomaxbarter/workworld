
# Plan: WorkWorldMap Upgrade

Bu çok kapsamlı bir istek — 5 ayrı iş paketi. Küçük parçalara ayırıp sırayla uyguluyorum. Onay verirsen her paket ~1-2 turda tamamlanır.

## 1) Marka: WorkWorld → WorkWorldMap
- `index.html` title + meta description + og:title
- Header logosu: `Work` + `WorldMap` (renkli span)
- Footer, About, Auth, boş durum metinleri
- i18n anahtarlarında geçen "WorkWorld" ibareleri (TR/EN/DE)

## 2) İçerik türleri: Blog / Video / Podcast
Yeni tablo `media_content`:
```
id, type ('blog'|'video'|'podcast'), status,
title_i18n jsonb, description_i18n jsonb, body_i18n jsonb,
cover_url, media_url (video/audio için), duration_seconds,
author_id, tags text[], published_at, slug,
created_at, updated_at
```
RLS: herkes onaylıları okur; admin CRUD; auth kullanıcılar taslak oluşturabilir → admin onayı.
Yeni sayfalar: `/blog`, `/videos`, `/podcast` + detay `/{type}/:slug` (i18n route'ları ile TR/DE).
Detayda mevcut `PostsSection` + `CommentsSection` yeniden kullanılır.

## 3) Header: Mega menü (varsayılan)
`NavigationContext.defaultSettings.desktop = 'mega'`.
Mega menü grupları:
- **Community**: Humans, Members, Professions
- **Events**: Events, Map
- **Media**: Blog, Videos, Podcast
- **Data**: MCI, Analytics (yeni), Reports
- **About**: About, Volunteer

Mevcut mega yapıyı (`Header.tsx` `megaItems`) genişletiyorum; mobile Sheet aynı gruplarla.

## 4) Analitik sayfası (şeffaflık)
Yeni `/analytics` sayfası — herkese açık, hiç hesap gerekmez.
- **Chart.js** (`react-chartjs-2`): 
  - Ülke başına üye dağılımı (bar)
  - Aylık büyüme (line)
  - Meslek popülerliği (doughnut)
  - MCI şehir skorları karşılaştırması (radar)
  - Etkinlik durum dağılımı (pie)
- **MapLibre GL JS**: Choropleth benzeri — ülke başına yoğunluk heatmap katmanı (mevcut Leaflet haritasını korurken, analytics'te MapLibre kullanıyorum).
- Tüm veriler public read RLS ile canlı Supabase'den.
- "Kaynakça" bölümü: her grafiğin altında `mciSources.ts` benzeri referans.

## 5) Admin paneli genişletme
Yeni sekmeler:
- **Media** — blog/video/podcast CRUD (mevcut `useAdminTable` + `AdminToolbar` desenini kullanır; bulk approve/delete, i18n çeviri butonu ile).
- **Analytics Config** — hangi grafiklerin public gösterileceğinin toggle'ları (opsiyonel, isterse).

## 6) i18n temizliği
- Tüm eksik anahtarları tarayıp (`rg "t\\('[^']+'\\)"`) TR/EN/DE üçünde de olmasını sağla.
- Yeni eklenen media/analytics anahtarları üç dilde.
- Marka değişiminden etkilenen metinler.

## Teknik notlar
- Migration: `media_content` tablosu + GRANT + RLS + slug trigger.
- Depend.: `chart.js`, `react-chartjs-2`, `maplibre-gl`.
- SPA route'ları `routes.ts` altında `blog`/`videos`/`podcast`/`analytics` anahtarları ile — TR: `/blog`,`/videolar`,`/podcast`,`/analitik`; DE: `/blog`,`/videos`,`/podcast`,`/analysen`.

## Sıra
1. Marka değişimi + i18n taraması (hızlı, düşük risk)
2. `media_content` migration + Blog/Video/Podcast sayfaları + Admin sekmesi
3. Mega menü default + Header grupları güncelleme
4. Analytics sayfası (Chart.js + MapLibre)

## Sana soru
- Media içeriklerinde **video/podcast** için: kullanıcılar YouTube/Spotify **URL** mi girecek yoksa dosya **upload** mu (Supabase Storage bucket)? Önerim: MVP için URL — hızlı ve ücretsiz. Onaylar mısın?
- Analytics'te MapLibre için ücretsiz tile source (**OpenFreeMap** veya **MapTiler free tier, API key gerekli**) — OpenFreeMap key'siz gidebiliriz. Onay?
- 4 paketin **hepsini tek seferde** mi uygulayayım, yoksa **paket paket onay** mı vereceksin?
