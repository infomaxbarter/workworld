import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { et, tierKey, type Province, type Vertical, type AmbassadorLevel } from '@/lib/ecosystem';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Users, Trophy, Briefcase } from 'lucide-react';

interface Props {
  provinces: Province[];
  verticals: Vertical[];
  levels: AmbassadorLevel[];
}

const tierColor = (tier: string) =>
  tierKey(tier) === 1 ? '#2563eb' : tierKey(tier) === 2 ? '#0ea5e9' : '#94a3b8';

const mapLabels = {
  mapTitle: { tr: 'Ekosistem Haritası', en: 'Ecosystem Map', de: 'Ökosystemkarte' },
  legend: { tr: 'Kademe göstergesi', en: 'Tier legend', de: 'Stufen-Legende' },
  selected: { tr: 'Seçili il', en: 'Selected province', de: 'Ausgewählte Provinz' },
  clickHint: { tr: 'Haritadan bir il seçin.', en: 'Select a province on the map.', de: 'Wählen Sie eine Provinz auf der Karte.' },
  detail: { tr: 'İl detayına git', en: 'Open province detail', de: 'Provinzdetail öffnen' },
  shown: { tr: 'gösterilen il', en: 'provinces shown', de: 'Provinzen angezeigt' },
};

const ml = (k: keyof typeof mapLabels, lang: 'tr' | 'en' | 'de') => mapLabels[k][lang];

const TurkeyEcosystemMap = ({ provinces, verticals, levels }: Props) => {
  const { lang } = useLanguage();
  const lp = useLocalizedPath();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const [q, setQ] = useState('');
  const [tier, setTier] = useState('');
  const [region, setRegion] = useState('');
  const [selected, setSelected] = useState<Province | null>(null);

  const regions = useMemo(() => Array.from(new Set(provinces.map(p => p.region))).sort(), [provinces]);
  const tiers = useMemo(() => Array.from(new Set(provinces.map(p => p.tier))).sort(), [provinces]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return provinces.filter(p => {
      if (p.lat == null || p.lng == null) return false;
      if (tier && p.tier !== tier) return false;
      if (region && p.region !== region) return false;
      if (!s) return true;
      return [p.name, p.focus_sectors, p.local_hubs, String(p.plate_no)]
        .some(f => (f || '').toString().toLowerCase().includes(s));
    });
  }, [provinces, q, tier, region]);

  // init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [39.0, 35.2], zoom: 5, scrollWheelZoom: true });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  // render markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    filtered.forEach(p => {
      const k = tierKey(p.tier);
      const marker = L.circleMarker([p.lat as number, p.lng as number], {
        radius: 6 + Math.min(10, (p.target_representatives || 0) / 6),
        color: tierColor(p.tier),
        fillColor: tierColor(p.tier),
        fillOpacity: 0.55,
        weight: 2,
      });
      marker.bindTooltip(`${p.name} · T${k} · ${p.target_representatives}`, { direction: 'top' });
      marker.on('click', () => setSelected(p));
      marker.addTo(layer);
    });

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(p => [p.lat as number, p.lng as number] as [number, number]));
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 8, duration: 0.6 });
    }
  }, [filtered]);

  const selectCls = 'h-9 px-2 rounded-md border border-border bg-background text-sm';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder={et('search', lang)} className="pl-8 h-9" />
        </div>
        <select value={region} onChange={e => setRegion(e.target.value)} className={selectCls}>
          <option value="">{et('allRegions', lang)}</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={tier} onChange={e => setTier(e.target.value)} className={selectCls}>
          <option value="">{et('allTiers', lang)}</option>
          {tiers.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} {ml('shown', lang)}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-3">
        <div className="relative rounded-lg border border-border overflow-hidden">
          <div ref={containerRef} className="h-[420px] sm:h-[560px] w-full z-0" />
          <div className="absolute bottom-3 left-3 z-[500] rounded-md border border-border bg-background/90 backdrop-blur px-3 py-2 text-[11px] space-y-1">
            <div className="font-medium text-foreground">{ml('legend', lang)}</div>
            {[1, 2, 3].map(k => (
              <div key={k} className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: k === 1 ? '#2563eb' : k === 2 ? '#0ea5e9' : '#94a3b8' }} />
                Tier {k}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> {ml('selected', lang)}
            </div>
            {selected ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selected.name}</span>
                  <Badge variant="outline">T{tierKey(selected.tier)}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">{selected.region}</div>
                {selected.focus_sectors && <p className="text-xs text-muted-foreground">{selected.focus_sectors}</p>}
                <div className="text-xs inline-flex items-center gap-1"><Users className="w-3 h-3" /> {selected.target_representatives}</div>
                <a className="block text-xs text-primary hover:underline pt-1"
                   href={lp('provinceDetail', { slug: selected.slug || String(selected.plate_no) })}>
                  {ml('detail', lang)} →
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">{ml('clickHint', lang)}</p>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <Briefcase className="w-3.5 h-3.5" /> {et('verticals', lang)} ({verticals.length})
            </div>
            <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
              {verticals.map(v => (
                <Badge key={v.id} variant="secondary" className="text-[10px] font-normal">{v.code} · {v.name}</Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <Trophy className="w-3.5 h-3.5" /> {et('levels', lang)} ({levels.length})
            </div>
            <ol className="space-y-1 text-xs">
              {levels.map(l => (
                <li key={l.id} className="flex items-start gap-2">
                  <Badge className="text-[10px] font-mono shrink-0">{l.code}</Badge>
                  <span className="text-muted-foreground line-clamp-2">{l.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TurkeyEcosystemMap;
