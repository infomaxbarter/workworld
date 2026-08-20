import type { Lang } from '@/i18n/translations';

export interface Province {
  id: string;
  plate_no: number;
  name: string;
  slug: string | null;
  region: string;
  tier: string;
  focus_sectors: string | null;
  target_representatives: number;
  local_hubs: string | null;
  community_channels: string | null;
  value_proposition: string | null;
  lat: number | null;
  lng: number | null;
  active: boolean;
}

export interface Vertical {
  id: string;
  code: string;
  name: string;
  slug: string | null;
  target_roles: string | null;
  barter_supply: string | null;
  typical_demand: string | null;
  ideal_representative: string | null;
  discovery_channels: string | null;
  sort_order: number;
  active: boolean;
}

export interface AmbassadorLevel {
  id: string;
  code: string;
  title: string;
  requirements: string | null;
  rights: string | null;
  badges: string | null;
  motivation: string | null;
  sort_order: number;
}

export interface OutreachTemplate {
  id: string;
  code: string;
  audience: string;
  channel: string | null;
  subject: string | null;
  body: string | null;
  sort_order: number;
}

export interface CrmLead {
  id: string;
  code: string | null;
  full_name: string;
  city: string | null;
  region: string | null;
  tier: string | null;
  vertical: string | null;
  current_title: string | null;
  target_role: string | null;
  quality_score: number;
  channel: string | null;
  stage: string;
  owner: string | null;
  last_contact_at: string | null;
  notes: string | null;
}

export const LEAD_STAGES = [
  '1. Aday Havuzu',
  '2. İletişim Kuruldu',
  '3. Görüşme Yapıldı',
  '4. Onboarding',
  '5. Aktif Temsilci',
  '0. Pasif / Ret',
];

export const tierKey = (tier: string) =>
  tier.startsWith('Tier 1') ? 1 : tier.startsWith('Tier 2') ? 2 : 3;

export const tierClass = (tier: string) =>
  tierKey(tier) === 1
    ? 'bg-primary/15 text-primary border-primary/30'
    : tierKey(tier) === 2
      ? 'bg-accent text-accent-foreground border-border'
      : 'bg-muted text-muted-foreground border-border';

/** Tiny local dictionary so the ecosystem module stays fully multilingual. */
export const ecoT = {
  title: { tr: 'Türkiye Ekosistem Haritası', en: 'Türkiye Ecosystem Map', de: 'Türkiye-Ökosystemkarte' },
  subtitle: {
    tr: '81 il, meslek dikeyleri ve temsilcilik kademeleri tek haritada.',
    en: '81 provinces, professional verticals and representation tiers in one map.',
    de: '81 Provinzen, Berufsvertikale und Vertretungsstufen auf einer Karte.',
  },
  provinces: { tr: 'İller', en: 'Provinces', de: 'Provinzen' },
  verticals: { tr: 'Meslek Dikeyleri', en: 'Professional Verticals', de: 'Berufsvertikale' },
  levels: { tr: 'Elçi Seviyeleri', en: 'Ambassador Levels', de: 'Botschafter-Stufen' },
  templates: { tr: 'İletişim Şablonları', en: 'Outreach Templates', de: 'Outreach-Vorlagen' },
  search: { tr: 'İl, sektör veya hub ara…', en: 'Search province, sector or hub…', de: 'Provinz, Sektor oder Hub suchen…' },
  allRegions: { tr: 'Tüm bölgeler', en: 'All regions', de: 'Alle Regionen' },
  allTiers: { tr: 'Tüm kademeler', en: 'All tiers', de: 'Alle Stufen' },
  region: { tr: 'Bölge', en: 'Region', de: 'Region' },
  tier: { tr: 'Ekosistem kademesi', en: 'Ecosystem tier', de: 'Ökosystem-Stufe' },
  sectors: { tr: 'Odak sektörler', en: 'Focus sectors', de: 'Fokussektoren' },
  targetReps: { tr: 'Hedef temsilci', en: 'Target representatives', de: 'Zielvertreter' },
  hubs: { tr: 'Yerel hub & teknokent', en: 'Local hubs & tech parks', de: 'Lokale Hubs & Technoparks' },
  channels: { tr: 'Topluluk kanalları', en: 'Community channels', de: 'Community-Kanäle' },
  value: { tr: 'Yerel değer önerisi', en: 'Local value proposition', de: 'Lokales Wertversprechen' },
  roles: { tr: 'Hedef roller', en: 'Target roles', de: 'Zielrollen' },
  supply: { tr: 'Takas arzı', en: 'Barter supply', de: 'Barter-Angebot' },
  demand: { tr: 'Tipik talep', en: 'Typical demand', de: 'Typische Nachfrage' },
  idealRep: { tr: 'İdeal temsilci profili', en: 'Ideal representative', de: 'Idealer Vertreter' },
  discovery: { tr: 'Keşif kanalları', en: 'Discovery channels', de: 'Entdeckungskanäle' },
  requirements: { tr: 'Gereksinimler & görevler', en: 'Requirements & missions', de: 'Anforderungen & Aufgaben' },
  rights: { tr: 'Yetkiler & haklar', en: 'Rights & privileges', de: 'Rechte & Befugnisse' },
  badges: { tr: 'Rozetler', en: 'Badges', de: 'Abzeichen' },
  motivation: { tr: 'Motivasyon', en: 'Motivation', de: 'Motivation' },
  totalReps: { tr: 'Toplam hedef temsilci', en: 'Total target representatives', de: 'Zielvertreter gesamt' },
  provinceCount: { tr: 'İl', en: 'Provinces', de: 'Provinzen' },
  noResult: { tr: 'Sonuç bulunamadı.', en: 'No results found.', de: 'Keine Ergebnisse.' },
  back: { tr: 'Ekosistem haritasına dön', en: 'Back to ecosystem map', de: 'Zurück zur Ökosystemkarte' },
} satisfies Record<string, Record<Lang, string>>;

export const et = (key: keyof typeof ecoT, lang: Lang) => ecoT[key][lang] ?? ecoT[key].en;
