## Çok Dilli URL Sistemi

Tüm sayfa rotalarını dil bazlı slug'larla erişilebilir hale getireceğim. Aynı sayfa farklı dillerden açılabilecek; dil değiştirildiğinde URL de o dile dönüşecek.

### Hedef davranış

```
EN:  /about              /humans   /events   /map   /professions   /dashboard   /admin
TR:  /hakkimizda         /insanlar /etkinlikler /harita /meslekler /panel       /yonetim
DE:  /ueber-uns          /menschen /veranstaltungen /karte /berufe /dashboard   /admin
```

Detay sayfaları:
```
/humans/:slug → /insanlar/:slug → /menschen/:slug
/events/:slug → /etkinlikler/:slug → /veranstaltungen/:slug
/professions/:slug → /meslekler/:slug → /berufe/:slug
/members/:slug → /uyeler/:slug → /mitglieder/:slug
```

Yasal sayfalar (`/kvkk`, `/cookies`, `/consent`) ve `/auth`, `/` aynı kalır.

### Çalışma mantığı

1. **Route registry** (`src/i18n/routes.ts`): Her sayfa için canonical key + dil başına slug haritası. Örn:
   ```ts
   { key: 'about', paths: { en: 'about', tr: 'hakkimizda', de: 'ueber-uns' } }
   ```
2. **Router**: Her sayfa, üç dildeki path için de aynı component'e bağlanır (`<Route path="/about" />`, `<Route path="/hakkimizda" />`, `<Route path="/ueber-uns" />`).
3. **Dil değişimi**: `LanguageContext.setLang` çağrıldığında mevcut URL'i registry üzerinden tespit edip yeni dilin path'ine `navigate` ile yönlendirir. Detay sayfalarında `:slug` parametresi korunur.
4. **Link helper**: `useLocalizedPath('about')` → aktif dile uygun path döner. `Header`, `Footer`, `AppSidebar`, `CommandPalette`, `MegaMenu` ve diğer dahili `<Link>`'ler bunu kullanır.
5. **SEO**: Her sayfada üç dil için `<link rel="alternate" hreflang="...">` etiketleri eklenir (react-helmet kullanmadan, `useEffect` ile head'e enjekte). Canonical aktif dilin URL'i olur.

### Etkilenen dosyalar

- yeni: `src/i18n/routes.ts`, `src/hooks/useLocalizedPath.ts`, `src/components/HrefLangTags.tsx`
- güncelle: `src/App.tsx` (rota tanımları), `src/i18n/LanguageContext.tsx` (dil değişiminde redirect), `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/AppSidebar.tsx`, `src/components/CommandPalette.tsx`
- detay sayfaları (`ProfileDetail`, `EventDetail`, `MemberDetail`, `ProfessionDetail`) ve liste sayfalarındaki dahili `<Link to="...">` çağrıları helper'a geçirilir.

### Geri uyumluluk

Eski (İngilizce) URL'ler her zaman geçerli kalır — sadece dil değiştirildiğinde kullanıcı yeni slug'a taşınır. Doğrudan `/hakkimizda` linkini paylaşan biri TR diliyle açar; dil otomatik TR'ye çevrilir.
