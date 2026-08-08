import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import Footer from '@/components/Footer';
import PageSeo from '@/components/PageSeo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, PieChart as PieIcon, Radar as RadarIcon, Activity, Globe2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Radar, Pie } from 'react-chartjs-2';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import RelatedContent from '@/components/RelatedContent';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler
);

const chartColors = [
  'hsl(217 91% 60%)',
  'hsl(280 70% 60%)',
  'hsl(160 70% 45%)',
  'hsl(30 90% 55%)',
  'hsl(0 75% 60%)',
  'hsl(190 80% 50%)',
  'hsl(340 75% 55%)',
  'hsl(50 90% 55%)',
];

type Aggregates = {
  byCountry: { country: string; count: number }[];
  monthly: { month: string; count: number }[];
  topProfessions: { name: string; count: number }[];
  mciCities: { name: string; scores: Record<string, number> }[];
  eventStatus: { status: string; count: number }[];
  markerPoints: { lat: number; lng: number }[];
};

const AnalyticsPage = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<Aggregates | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    (async () => {
      const [profilesRes, professionsRes, mciRes, eventsRes, markersRes, profProfRes] = await Promise.all([
        supabase.from('profiles').select('country, created_at, lat, lng').eq('status', 'active'),
        supabase.from('professions').select('id, name, status').eq('status', 'active'),
        supabase
          .from('mci_cities')
          .select('city, country_code, cp_final, ai_index, esg_score, h_vc_access, t_flow, p_search, g_gdp_per_capita')
          .eq('approved', true)
          .order('cp_final', { ascending: false })
          .limit(20),
        supabase.from('event_markers').select('status, lat, lng'),
        supabase.from('user_markers').select('lat, lng, country').eq('status', 'active'),
        supabase.from('profile_professions').select('profession_id'),
      ]);

      const profiles = (profilesRes.data || []) as any[];
      const professions = (professionsRes.data || []) as any[];
      const mciCities = (mciRes.data || []) as any[];
      const events = (eventsRes.data || []) as any[];
      const markers = (markersRes.data || []) as any[];

      // Country distribution (profiles + markers)
      const countryMap = new Map<string, number>();
      [...profiles, ...markers].forEach((r) => {
        const c = r.country || 'Unknown';
        countryMap.set(c, (countryMap.get(c) || 0) + 1);
      });
      const byCountry = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Monthly growth (profiles created_at)
      const monthMap = new Map<string, number>();
      profiles.forEach((p) => {
        if (!p.created_at) return;
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      });
      const monthly = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, count]) => ({ month, count }));

      // Top professions — real member counts from profile_professions
      const profLinks = (profProfRes.data || []) as any[];
      const linkCount = new Map<string, number>();
      profLinks.forEach((l) => linkCount.set(l.profession_id, (linkCount.get(l.profession_id) || 0) + 1));
      const topProfessions = professions
        .map((p) => ({ name: p.name, count: linkCount.get(p.id) || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Event status
      const statusMap = new Map<string, number>();
      events.forEach((e) => {
        const s = e.status || 'active';
        statusMap.set(s, (statusMap.get(s) || 0) + 1);
      });
      const eventStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

      // MCI radar — top 5 cities, real metrics normalized 0-100 against the sample max
      const radarKeys: [string, string][] = [
        ['AI', 'ai_index'],
        ['ESG', 'esg_score'],
        ['VC', 'h_vc_access'],
        ['Flow', 't_flow'],
        ['Search', 'p_search'],
        ['GDP', 'g_gdp_per_capita'],
      ];
      const maxOf = new Map<string, number>();
      radarKeys.forEach(([, col]) => {
        maxOf.set(col, Math.max(1, ...mciCities.map((c) => Number(c[col]) || 0)));
      });
      const mciSel = mciCities.slice(0, 5).map((c) => ({
        name: `${c.city}`,
        scores: Object.fromEntries(
          radarKeys.map(([label, col]) => [
            label,
            Math.round(((Number(c[col]) || 0) / (maxOf.get(col) || 1)) * 100),
          ])
        ) as Record<string, number>,
      }));

      // Map points
      const markerPoints = [...markers, ...events, ...profiles]
        .filter((r) => r.lat && r.lng)
        .map((r) => ({ lat: r.lat, lng: r.lng }));

      setData({ byCountry, monthly, topProfessions, mciCities: mciSel, eventStatus, markerPoints });
    })();
  }, []);

  // MapLibre density map
  useEffect(() => {
    if (!data || !mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [20, 30],
      zoom: 1.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: data.markerPoints.map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            properties: {},
          })),
        },
      });
      map.addLayer({
        id: 'points-heat',
        type: 'heatmap',
        source: 'points',
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 9, 30],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)',
          ],
          'heatmap-opacity': 0.75,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading analytics…</div>
    );
  }

  const commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: 'hsl(var(--foreground))' } } },
    scales: {
      x: { ticks: { color: 'hsl(var(--muted-foreground))' }, grid: { color: 'hsl(var(--border))' } },
      y: { ticks: { color: 'hsl(var(--muted-foreground))' }, grid: { color: 'hsl(var(--border))' } },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageSeo title={`${t('analytics.title')} — WorkWorldMap`} description={t('analytics.subtitle')} />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-3">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">{t('analytics.title')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-3">{t('analytics.subtitle')}</p>
          <Badge variant="outline" className="gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t('analytics.live')}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground text-center mb-8 max-w-3xl mx-auto">
          {t('analytics.transparency_note')}
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <ChartCard title={t('analytics.members_by_country')} icon={<BarChart3 className="w-4 h-4" />} source="profiles + user_markers">
            <Bar
              data={{
                labels: data.byCountry.map((c) => c.country),
                datasets: [{
                  label: t('analytics.members_by_country'),
                  data: data.byCountry.map((c) => c.count),
                  backgroundColor: chartColors[0],
                }],
              }}
              options={commonOpts as any}
            />
          </ChartCard>

          <ChartCard title={t('analytics.monthly_growth')} icon={<TrendingUp className="w-4 h-4" />} source="profiles.created_at">
            <Line
              data={{
                labels: data.monthly.map((m) => m.month),
                datasets: [{
                  label: t('analytics.monthly_growth'),
                  data: data.monthly.map((m) => m.count),
                  borderColor: chartColors[1],
                  backgroundColor: 'hsla(280, 70%, 60%, 0.2)',
                  fill: true,
                  tension: 0.35,
                }],
              }}
              options={commonOpts as any}
            />
          </ChartCard>

          <ChartCard title={t('analytics.top_professions')} icon={<PieIcon className="w-4 h-4" />} source="professions">
            <Doughnut
              data={{
                labels: data.topProfessions.map((p) => p.name),
                datasets: [{
                  data: data.topProfessions.map((p) => p.count),
                  backgroundColor: chartColors,
                }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'hsl(var(--foreground))' } } } }}
            />
          </ChartCard>

          <ChartCard title={t('analytics.events_by_status')} icon={<PieIcon className="w-4 h-4" />} source="event_markers.status">
            <Pie
              data={{
                labels: data.eventStatus.map((e) => e.status),
                datasets: [{
                  data: data.eventStatus.map((e) => e.count),
                  backgroundColor: chartColors,
                }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'hsl(var(--foreground))' } } } }}
            />
          </ChartCard>
        </div>

        {data.mciCities.length > 0 && (
          <ChartCard title={t('analytics.mci_compare')} icon={<RadarIcon className="w-4 h-4" />} source="mci_cities" className="mb-6">
            <Radar
              data={{
                labels: ['AI', 'ESG', 'VC', 'Flow', 'Search', 'GDP'],
                datasets: data.mciCities.map((c, i) => ({
                  label: c.name,
                  data: [c.scores.AI, c.scores.ESG, c.scores.VC, c.scores.Flow, c.scores.Search, c.scores.GDP],
                  backgroundColor: chartColors[i] + '33',
                  borderColor: chartColors[i],
                  borderWidth: 2,
                })),
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: 'hsl(var(--foreground))' } } },
                scales: { r: { angleLines: { color: 'hsl(var(--border))' }, grid: { color: 'hsl(var(--border))' }, pointLabels: { color: 'hsl(var(--foreground))' }, ticks: { display: false } } },
              }}
            />
          </ChartCard>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe2 className="w-4 h-4 text-primary" />
                {t('analytics.density_map')}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{t('analytics.data_source')}: user_markers + event_markers</span>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={mapContainer} className="w-full h-[500px] rounded-lg overflow-hidden border border-border" />
          </CardContent>
        </Card>
      </div>
      <div className="max-w-6xl mx-auto w-full px-4 pb-12">
        <RelatedContent kinds={['cities', 'professions', 'media']} />
      </div>
      <Footer />
    </div>
  );
};

const ChartCard = ({ title, icon, source, children, className, empty }: { title: string; icon: React.ReactNode; source: string; children: React.ReactNode; className?: string; empty?: boolean }) => {
  const { t } = useLanguage();
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <span className="text-primary">{icon}</span>
            {title}
          </CardTitle>
          <span className="text-[10px] sm:text-xs text-muted-foreground">{t('analytics.data_source')}: {source}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-72">
          {empty ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              {t('analytics.no_data')}
            </div>
          ) : children}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsPage;
