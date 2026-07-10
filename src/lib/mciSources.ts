/**
 * MCI v7.0 — Açık kaynak veri kaynakları (data provenance).
 * Her değişken için: kaynak adı, canlı/statik URL, yenileme sıklığı, lisans.
 * Tüm kaynaklar CC-BY, ODbL veya kamu domain – ticari kullanıma uygun.
 */
export type Cadence = 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DataSource {
  name: string;
  url: string;
  cadence: Cadence;
  license?: string;
  note?: string;
}

export interface VariableSource {
  key: string;               // formül sembolü
  label: string;             // insan-okur ad
  cadence: Cadence;          // önerilen genel yenileme
  sources: DataSource[];
}

export const MCI_SOURCES: VariableSource[] = [
  {
    key: 'N', label: 'Nüfus (metropol/şehir)', cadence: 'yearly',
    sources: [
      { name: 'World Bank — Urban Population', url: 'https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS', cadence: 'yearly', license: 'CC-BY-4.0' },
      { name: 'UN DESA World Urbanization Prospects', url: 'https://population.un.org/wup/', cadence: 'yearly', license: 'CC-BY-3.0-IGO' },
      { name: 'Wikidata SPARQL (P1082)', url: 'https://query.wikidata.org/', cadence: 'monthly', license: 'CC0' },
    ],
  },
  {
    key: 'G', label: 'Kişi başı GSYH (nominal USD)', cadence: 'yearly',
    sources: [
      { name: 'World Bank — GDP per capita', url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD', cadence: 'yearly', license: 'CC-BY-4.0' },
      { name: 'OECD Regional Statistics', url: 'https://stats.oecd.org/Index.aspx?DataSetCode=REGION_ECONOM', cadence: 'yearly', license: 'OECD Terms' },
      { name: 'Eurostat NUTS3 GDP', url: 'https://ec.europa.eu/eurostat/web/regions/data/database', cadence: 'yearly', license: 'Reuse allowed' },
    ],
  },
  {
    key: 'F', label: 'Aktif firma sayısı', cadence: 'quarterly',
    sources: [
      { name: 'OECD Structural & Demographic Business Stats', url: 'https://stats.oecd.org/Index.aspx?DataSetCode=SSIS_BSC_ISIC4', cadence: 'yearly', license: 'OECD Terms' },
      { name: 'OpenCorporates', url: 'https://opencorporates.com/', cadence: 'daily', license: 'ODbL' },
      { name: 'TR — TOBB Firma İstatistikleri', url: 'https://www.tobb.org.tr/BilgiErisimMudurlugu/Sayfalar/KurulanKapananSirketistatistikleri.php', cadence: 'monthly', license: 'Public' },
    ],
  },
  {
    key: 'U', label: 'Üniversite sayısı', cadence: 'yearly',
    sources: [
      { name: 'QS World University Rankings API', url: 'https://www.topuniversities.com/', cadence: 'yearly' },
      { name: 'ETER (European Tertiary Education Register)', url: 'https://www.eter-project.com/', cadence: 'yearly', license: 'CC-BY' },
      { name: 'Wikidata (P31 → Q3918)', url: 'https://query.wikidata.org/', cadence: 'monthly', license: 'CC0' },
    ],
  },
  {
    key: 'S', label: 'Organize Sanayi Bölgesi', cadence: 'quarterly',
    sources: [
      { name: 'TR — OSBÜK Bölge Rehberi', url: 'https://osbuk.org/', cadence: 'quarterly', license: 'Public' },
      { name: 'UNIDO Industrial Statistics', url: 'https://stat.unido.org/', cadence: 'yearly', license: 'CC-BY-3.0-IGO' },
    ],
  },
  {
    key: 'T', label: 'Teknokent / Ar-Ge merkezi', cadence: 'quarterly',
    sources: [
      { name: 'TR — Sanayi ve Teknoloji Bakanlığı TGB Portalı', url: 'https://tgb.sanayi.gov.tr/', cadence: 'monthly', license: 'Public' },
      { name: 'IASP World Science Park Directory', url: 'https://www.iasp.ws/our-members/directory', cadence: 'yearly' },
    ],
  },
  {
    key: 'P_search', label: 'Google arama ivmesi', cadence: 'weekly',
    sources: [
      { name: 'Google Trends (daily search interest)', url: 'https://trends.google.com/trends/', cadence: 'daily', license: 'Google ToS' },
      { name: 'DataForSEO Trends API', url: 'https://dataforseo.com/apis/google-trends-api', cadence: 'daily' },
      { name: 'Wikimedia Pageviews API', url: 'https://wikimedia.org/api/rest_v1/', cadence: 'daily', license: 'CC-BY-SA' },
    ],
  },
  {
    key: 'M_loc', label: 'Profesyonel yoğunluk (km²)', cadence: 'monthly',
    sources: [
      { name: 'OpenStreetMap Overpass API (amenity=office|coworking_space)', url: 'https://overpass-turbo.eu/', cadence: 'realtime', license: 'ODbL' },
      { name: 'Google Places API — Places Density', url: 'https://developers.google.com/maps/documentation/places/web-service', cadence: 'realtime', license: 'Google ToS' },
    ],
  },
  {
    key: 'H', label: 'VC / hibe erişimi', cadence: 'monthly',
    sources: [
      { name: 'Crunchbase Discover (city funding rounds)', url: 'https://www.crunchbase.com/discover/funding_rounds', cadence: 'daily' },
      { name: 'Dealroom City Rankings', url: 'https://dealroom.co/', cadence: 'weekly' },
      { name: 'KPMG Venture Pulse (quarterly)', url: 'https://kpmg.com/xx/en/home/campaigns/2024/01/q4-venture-pulse-report.html', cadence: 'quarterly' },
    ],
  },
  {
    key: 'T_flow', label: 'Yetenek / beyin göçü', cadence: 'quarterly',
    sources: [
      { name: 'LinkedIn Economic Graph — Talent Migration', url: 'https://economicgraph.linkedin.com/', cadence: 'quarterly' },
      { name: 'INSEAD Global Talent Competitiveness Index', url: 'https://www.insead.edu/global-indices/gtci', cadence: 'yearly', license: 'CC-BY-NC' },
      { name: 'OECD Migration Database', url: 'https://www.oecd.org/migration/mig/oecdmigrationdatabases.htm', cadence: 'yearly' },
    ],
  },
  {
    key: 'AI_index', label: 'Yapay zeka adaptasyonu', cadence: 'yearly',
    sources: [
      { name: 'Stanford HAI — AI Index Report', url: 'https://aiindex.stanford.edu/report/', cadence: 'yearly', license: 'CC-BY-ND-4.0' },
      { name: 'Tortoise Global AI Index', url: 'https://www.tortoisemedia.com/intelligence/global-ai/', cadence: 'yearly' },
      { name: 'OECD.AI Policy Observatory', url: 'https://oecd.ai/', cadence: 'monthly', license: 'CC-BY-4.0' },
    ],
  },
  {
    key: 'ESG_score', label: 'Ekolojik direnç', cadence: 'yearly',
    sources: [
      { name: 'Yale Environmental Performance Index', url: 'https://epi.yale.edu/', cadence: 'yearly', license: 'CC-BY-NC' },
      { name: 'CDP Cities Open Data Portal', url: 'https://data.cdp.net/', cadence: 'yearly', license: 'CC-BY-4.0' },
      { name: 'Copernicus Climate Data Store', url: 'https://cds.climate.copernicus.eu/', cadence: 'daily', license: 'Copernicus License' },
    ],
  },
  {
    key: 'Exp / Imp', label: 'İhracat / ithalat (milyar USD)', cadence: 'monthly',
    sources: [
      { name: 'UN Comtrade Database', url: 'https://comtradeplus.un.org/', cadence: 'monthly', license: 'Free for non-commercial' },
      { name: 'WTO Stats Portal', url: 'https://stats.wto.org/', cadence: 'quarterly', license: 'Public' },
      { name: 'TR — TÜİK Dış Ticaret İstatistikleri', url: 'https://data.tuik.gov.tr/', cadence: 'monthly', license: 'Public' },
    ],
  },
  {
    key: 'Y_ratio', label: 'Genç nüfus oranı (15-34)', cadence: 'yearly',
    sources: [
      { name: 'UN DESA — Population Division', url: 'https://population.un.org/wpp/', cadence: 'yearly', license: 'CC-BY-3.0-IGO' },
      { name: 'World Bank — Age dependency', url: 'https://data.worldbank.org/indicator/SP.POP.DPND.YG', cadence: 'yearly', license: 'CC-BY-4.0' },
      { name: 'Eurostat Demography', url: 'https://ec.europa.eu/eurostat/web/population-demography', cadence: 'yearly' },
    ],
  },
  {
    key: 'E_ratio', label: 'Eğitim oranı (tersiyer)', cadence: 'yearly',
    sources: [
      { name: 'UNESCO Institute for Statistics', url: 'http://data.uis.unesco.org/', cadence: 'yearly', license: 'CC-BY-SA-3.0-IGO' },
      { name: 'OECD Education at a Glance', url: 'https://www.oecd.org/education/education-at-a-glance/', cadence: 'yearly' },
    ],
  },
  {
    key: 'B_rate', label: 'Girişimcilik oranı', cadence: 'yearly',
    sources: [
      { name: 'Global Entrepreneurship Monitor (GEM)', url: 'https://www.gemconsortium.org/data', cadence: 'yearly', license: 'CC-BY-NC' },
      { name: 'StartupBlink Ecosystem Rankings', url: 'https://www.startupblink.com/', cadence: 'yearly' },
      { name: 'World Bank — Doing Business Legacy', url: 'https://archive.doingbusiness.org/', cadence: 'yearly', license: 'CC-BY-4.0' },
    ],
  },
  {
    key: 'σ', label: 'Risk volatilitesi', cadence: 'weekly',
    sources: [
      { name: 'ACLED — Armed Conflict Location & Event Data', url: 'https://acleddata.com/data-export-tool/', cadence: 'weekly', license: 'CC-BY-NC-SA' },
      { name: 'GDELT Project', url: 'https://www.gdeltproject.org/', cadence: 'realtime', license: 'CC-BY' },
      { name: 'World Bank Governance Indicators', url: 'https://info.worldbank.org/governance/wgi/', cadence: 'yearly', license: 'CC-BY-4.0' },
    ],
  },
  {
    key: 'ΔPulse', label: 'Canlı nabız (aktivite)', cadence: 'realtime',
    sources: [
      { name: 'WorkWorld internal — user_markers + event_markers + profile deltas', url: '/map', cadence: 'realtime', license: 'AGPL-3.0', note: 'Sistem içinden hesaplanır: son 30 gün aktif marker/event/RSVP artışı.' },
      { name: 'Meetup.com Pro API', url: 'https://www.meetup.com/api/schema/', cadence: 'daily' },
      { name: 'Eventbrite Public API', url: 'https://www.eventbrite.com/platform/api', cadence: 'daily' },
    ],
  },
  {
    key: 'Net_syn', label: 'Nodal sinerji (ağ)', cadence: 'monthly',
    sources: [
      { name: 'OpenFlights — Airport Route Network', url: 'https://openflights.org/data.html', cadence: 'monthly', license: 'ODbL' },
      { name: 'CEPII BACI Bilateral Trade Matrix', url: 'http://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37', cadence: 'yearly', license: 'CC-BY' },
      { name: 'WorkWorld internal — approved city cross-links', url: '/mci', cadence: 'weekly', license: 'AGPL-3.0' },
    ],
  },
];
