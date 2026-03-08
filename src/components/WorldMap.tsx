import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { supabase } from '@/integrations/supabase/client';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const eventIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const anonIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface WorldMapProps {
  showSidebar?: boolean;
}

const WorldMap = ({ showSidebar = false }: WorldMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ profiles: L.LayerGroup; anon: L.LayerGroup; events: L.LayerGroup } | null>(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'profiles' | 'anon' | 'events'>('all');
  const [allData, setAllData] = useState<{ profiles: any[]; anon: any[]; events: any[] }>({ profiles: [], anon: [], events: [] });
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { center: [30, 20], zoom: 2, scrollWheelZoom: true });
    mapRef.current = map;

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
    osmLayer.addTo(map);

    const profilesLayer = L.markerClusterGroup();
    const anonLayer = L.markerClusterGroup();
    const eventsLayer = L.markerClusterGroup();
    layersRef.current = { profiles: profilesLayer, anon: anonLayer, events: eventsLayer };

    const loadMarkers = async () => {
      const [{ data: profiles }, { data: anonMarkers }, { data: events }] = await Promise.all([
        supabase.from('profiles').select('*').eq('approved', true).not('lat', 'is', null).not('lng', 'is', null),
        supabase.from('user_markers').select('*'),
        supabase.from('event_markers').select('*'),
      ]);

      const allCountries = new Set<string>();

      (profiles as any[] | null)?.forEach((p) => {
        if (!p.lat || !p.lng) return;
        if (p.country) allCountries.add(p.country);
        const loc = p.city && p.country ? `${p.city}, ${p.country}` : p.location || 'Member';
        const marker = L.marker([p.lat, p.lng]);
        marker.bindPopup(`
          <div style="padding:12px;min-width:180px;font-family:inherit;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              ${p.avatar_url ? `<img src="${p.avatar_url}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />` : `<div style="width:36px;height:36px;border-radius:50%;background:hsl(152,60%,36%);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;">${(p.display_name || '?').charAt(0).toUpperCase()}</div>`}
              <div>
                <div style="font-weight:600;font-size:14px;">${p.display_name}</div>
                <div style="font-size:11px;color:#888;">${loc}</div>
              </div>
            </div>
            <a href="/humans/${p.slug || p.user_id}" style="display:block;text-align:center;padding:6px 12px;background:hsl(152,60%,36%);color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">View Profile →</a>
          </div>
        `);
        profilesLayer.addLayer(marker);
      });

      (anonMarkers as any[] | null)?.forEach((u) => {
        if (u.country) allCountries.add(u.country);
        const loc = u.city && u.country ? `${u.city}, ${u.country}` : 'Unverified';
        const marker = L.marker([u.lat, u.lng], { icon: anonIcon });
        marker.bindPopup(`
          <div style="padding:12px;min-width:160px;font-family:inherit;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:32px;height:32px;border-radius:50%;background:#888;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;">${u.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight:600;font-size:14px;">${u.name}</div>
                <div style="font-size:11px;color:#888;">${loc}</div>
              </div>
            </div>
            <a href="/members/${u.slug || u.id}" style="display:block;text-align:center;padding:6px 12px;background:#888;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">View →</a>
          </div>
        `);
        anonLayer.addLayer(marker);
      });

      (events as any[] | null)?.forEach((e) => {
        if (e.country) allCountries.add(e.country);
        const loc = e.city && e.country ? `${e.city}, ${e.country}` : '';
        const marker = L.marker([e.lat, e.lng], { icon: eventIcon });
        marker.bindPopup(`
          <div style="padding:12px;min-width:200px;font-family:inherit;">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${e.title}</div>
            ${e.start_date ? `<div style="font-size:12px;color:#888;margin-bottom:2px;">📅 ${e.start_date}${e.end_date ? ' — ' + e.end_date : ''}</div>` : e.date ? `<div style="font-size:12px;color:#888;margin-bottom:2px;">📅 ${e.date}</div>` : ''}
            ${loc ? `<div style="font-size:12px;color:#888;margin-bottom:4px;">📍 ${loc}</div>` : ''}
            ${e.capacity ? `<div style="font-size:12px;color:#888;margin-bottom:4px;">👥 Kontenjan: ${e.capacity}</div>` : ''}
            ${e.description ? `<div style="font-size:13px;color:#555;margin-bottom:8px;">${e.description.substring(0, 100)}${e.description.length > 100 ? '...' : ''}</div>` : ''}
            <a href="/events/${e.slug || e.id}" style="display:block;text-align:center;padding:6px 12px;background:hsl(152,60%,36%);color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">Details →</a>
          </div>
        `);
        eventsLayer.addLayer(marker);
      });

      map.addLayer(profilesLayer);
      map.addLayer(anonLayer);
      map.addLayer(eventsLayer);

      setAllData({ profiles: profiles || [], anon: anonMarkers || [], events: events || [] });
      setCountries(Array.from(allCountries).sort());
    };

    loadMarkers();

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Layer visibility
  useEffect(() => {
    if (!layersRef.current || !mapRef.current) return;
    const map = mapRef.current;
    const { profiles, anon, events } = layersRef.current;
    if (filterType === 'all' || filterType === 'profiles') { if (!map.hasLayer(profiles)) map.addLayer(profiles); } else { map.removeLayer(profiles); }
    if (filterType === 'all' || filterType === 'anon') { if (!map.hasLayer(anon)) map.addLayer(anon); } else { map.removeLayer(anon); }
    if (filterType === 'all' || filterType === 'events') { if (!map.hasLayer(events)) map.addLayer(events); } else { map.removeLayer(events); }
  }, [filterType]);

  const getFilteredItems = () => {
    let items: any[] = [];
    if (filterType === 'all' || filterType === 'profiles') items.push(...allData.profiles.map(p => ({ ...p, _type: 'profile' })));
    if (filterType === 'all' || filterType === 'anon') items.push(...allData.anon.map(a => ({ ...a, _type: 'anon' })));
    if (filterType === 'all' || filterType === 'events') items.push(...allData.events.map(e => ({ ...e, _type: 'event' })));

    if (selectedCountry) items = items.filter(i => i.country === selectedCountry);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => {
        const name = (i.display_name || i.name || i.title || '').toLowerCase();
        const city = (i.city || '').toLowerCase();
        const country = (i.country || '').toLowerCase();
        return name.includes(q) || city.includes(q) || country.includes(q);
      });
    }
    return items;
  };

  const flyTo = (lat: number, lng: number) => {
    mapRef.current?.flyTo([lat, lng], 12, { duration: 1 });
  };

  if (!showSidebar) {
    return (
      <div className="w-full h-[70vh] md:h-[75vh] rounded-xl overflow-hidden shadow-lg border border-border">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }

  const filteredItems = getFilteredItems();


  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-4 h-[calc(100vh-10rem)] md:h-[75vh] relative">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-3 right-3 z-[1000] bg-card border border-border rounded-lg p-2 shadow-lg"
      >
        {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Filter className="w-5 h-5 text-foreground" />}
      </button>

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        absolute md:relative z-[999] md:z-auto
        w-[85vw] sm:w-80 md:w-72 lg:w-80 shrink-0
        h-full flex flex-col
        border border-border rounded-xl bg-card overflow-hidden
        transition-transform duration-200 ease-in-out
        shadow-xl md:shadow-none
      `}>
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="🔍 Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'profiles', 'anon', 'events'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${filterType === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {f === 'all' ? 'Tümü' : f === 'profiles' ? '👤' : f === 'anon' ? '👻' : '📅'}
                <span className="hidden sm:inline ml-1">{f === 'all' ? '' : f === 'profiles' ? 'Profiller' : f === 'anon' ? 'Anonim' : 'Etkinlikler'}</span>
              </button>
            ))}
          </div>
          {countries.length > 0 && (
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">Tüm Ülkeler</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sonuç bulunamadı</p>}
          {filteredItems.map((item, i) => {
            const isProfile = item._type === 'profile';
            const isEvent = item._type === 'event';
            const name = item.display_name || item.name || item.title || '';
            const loc = item.city && item.country ? `${item.city}, ${item.country}` : item.location || '';
            return (
              <button
                key={`${item._type}-${item.id}-${i}`}
                onClick={() => { flyTo(item.lat, item.lng); setSidebarOpen(false); }}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{isEvent ? '📅' : isProfile ? '👤' : '👻'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    {loc && <p className="text-xs text-muted-foreground truncate">{loc}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[998] bg-black/30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-border min-h-[50vh]">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default WorldMap;
