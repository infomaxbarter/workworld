import { useEffect, useRef, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';

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

const professionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface WorldMapProps {
  showSidebar?: boolean;
}

const WorldMap = ({ showSidebar = false }: WorldMapProps) => {
  const { lang, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    profiles: L.MarkerClusterGroup;
    anon: L.MarkerClusterGroup;
    events: L.MarkerClusterGroup;
    professions: L.MarkerClusterGroup;
  } | null>(null);
  // Store raw markers with metadata for filtering
  const markersDataRef = useRef<{
    profiles: { marker: L.Marker; data: any }[];
    anon: { marker: L.Marker; data: any }[];
    events: { marker: L.Marker; data: any }[];
    professions: { marker: L.Marker; data: any }[];
  }>({ profiles: [], anon: [], events: [], professions: [] });

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'profiles' | 'anon' | 'events' | 'professions'>('all');
  const [allData, setAllData] = useState<{ profiles: any[]; anon: any[]; events: any[]; professions: any[] }>({ profiles: [], anon: [], events: [], professions: [] });
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [professionsList, setProfessionsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedProfession, setSelectedProfession] = useState('');
  const [profileProfessions, setProfileProfessions] = useState<Map<string, string[]>>(new Map());
  const [anonProfessions, setAnonProfessions] = useState<Map<string, string[]>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ profiles: 0, anon: 0, events: 0, professions: 0, total: 0 });

  // Build markers
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { center: [30, 20], zoom: 2, scrollWheelZoom: true });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const profilesLayer = L.markerClusterGroup();
    const anonLayer = L.markerClusterGroup();
    const eventsLayer = L.markerClusterGroup();
    const professionsLayer = L.markerClusterGroup();
    layersRef.current = { profiles: profilesLayer, anon: anonLayer, events: eventsLayer, professions: professionsLayer };

    const loadMarkers = async () => {
      const [{ data: profiles }, { data: anonMarkers }, { data: events }, { data: profs }, { data: pp }, { data: ump }] = await Promise.all([
        supabase.from('profiles').select('*').eq('approved', true).not('lat', 'is', null).not('lng', 'is', null),
        supabase.from('user_markers').select('*'),
        supabase.from('event_markers').select('*'),
        supabase.from('professions').select('*').eq('status', 'active').order('name'),
        supabase.from('profile_professions').select('profile_id, profession_id'),
        supabase.from('user_marker_professions' as any).select('user_marker_id, profession_id'),
      ]);

      if (profs) setProfessionsList((profs as any[]).map(p => ({ id: p.id, name: pickI18n(p.name_i18n, p.name, lang) })));

      // Profile → professions map
      const ppMap = new Map<string, string[]>();
      (pp as any[] | null)?.forEach((item: any) => {
        const arr = ppMap.get(item.profile_id) || [];
        arr.push(item.profession_id);
        ppMap.set(item.profile_id, arr);
      });
      setProfileProfessions(ppMap);

      // Anon → professions map
      const umpMap = new Map<string, string[]>();
      (ump as any[] | null)?.forEach((item: any) => {
        const arr = umpMap.get(item.user_marker_id) || [];
        arr.push(item.profession_id);
        umpMap.set(item.user_marker_id, arr);
      });
      setAnonProfessions(umpMap);

      const allCountries = new Set<string>();
      const pMarkers: { marker: L.Marker; data: any }[] = [];
      const aMarkers: { marker: L.Marker; data: any }[] = [];
      const eMarkers: { marker: L.Marker; data: any }[] = [];
      const prMarkers: { marker: L.Marker; data: any }[] = [];

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
            <a href="/humans/${p.slug || p.user_id}" style="display:block;text-align:center;padding:6px 12px;background:hsl(152,60%,36%);color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">${t('map.view_profile_btn')}</a>
          </div>
        `);
        pMarkers.push({ marker, data: { ...p, _type: 'profile', _professions: ppMap.get(p.id) || [] } });
        profilesLayer.addLayer(marker);
      });

      (anonMarkers as any[] | null)?.forEach((u) => {
        if (u.country) allCountries.add(u.country);
        const loc = u.city && u.country ? `${u.city}, ${u.country}` : 'Unverified';
        const marker = L.marker([u.lat, u.lng], { icon: anonIcon });
        marker.bindPopup(`
          <div style="padding:12px;min-width:160px;font-family:inherit;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:32px;height:32px;border-radius:50%;background:#888;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;">${pickI18n(u.name_i18n, u.name, lang).charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight:600;font-size:14px;">${pickI18n(u.name_i18n, u.name, lang)}</div>
                <div style="font-size:11px;color:#888;">${loc}</div>
              </div>
              </div>
            </div>
            <a href="/members/${u.slug || u.id}" style="display:block;text-align:center;padding:6px 12px;background:#888;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">${t('map.view_member_btn')}</a>
          </div>
        `);
        aMarkers.push({ marker, data: { ...u, _type: 'anon', _professions: umpMap.get(u.id) || [] } });
        anonLayer.addLayer(marker);
      });

      (events as any[] | null)?.forEach((e) => {
        if (e.country) allCountries.add(e.country);
        const loc = e.city && e.country ? `${e.city}, ${e.country}` : '';
        const marker = L.marker([e.lat, e.lng], { icon: eventIcon });
        marker.bindPopup(`
          <div style="padding:12px;min-width:200px;font-family:inherit;">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${pickI18n(e.title_i18n, e.title, lang)}</div>
            ${e.start_date ? `<div style="font-size:12px;color:#888;margin-bottom:2px;">📅 ${e.start_date}${e.end_date ? ' — ' + e.end_date : ''}</div>` : e.date ? `<div style="font-size:12px;color:#888;margin-bottom:2px;">📅 ${e.date}</div>` : ''}
            ${loc ? `<div style="font-size:12px;color:#888;margin-bottom:4px;">📍 ${loc}</div>` : ''}
            <a href="/events/${e.slug || e.id}" style="display:block;text-align:center;padding:6px 12px;background:hsl(152,60%,36%);color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">${t('map.view_details')}</a>
          </div>
        `);
        eMarkers.push({ marker, data: { ...e, _type: 'event' } });
        eventsLayer.addLayer(marker);
      });

      // Profession markers
      (profs as any[] | null)?.forEach((pr) => {
        if (!pr.lat || !pr.lng) return;
        const marker = L.marker([pr.lat, pr.lng], { icon: professionIcon });
        marker.bindPopup(`
          <div style="padding:12px;min-width:180px;font-family:inherit;">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">💼 ${pickI18n(pr.name_i18n, pr.name, lang)}</div>
            ${(() => { const d = pickI18n(pr.description_i18n, pr.description, lang); return d ? `<div style="font-size:12px;color:#666;margin-bottom:6px;">${d.substring(0, 120)}${d.length > 120 ? '...' : ''}</div>` : ''; })()}
            <a href="/professions/${pr.slug || pr.id}" style="display:block;text-align:center;padding:6px 12px;background:#f97316;color:white;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">${t('map.view_details')}</a>
          </div>
        `);
        prMarkers.push({ marker, data: { ...pr, _type: 'profession' } });
        professionsLayer.addLayer(marker);
      });

      markersDataRef.current = { profiles: pMarkers, anon: aMarkers, events: eMarkers, professions: prMarkers };

      map.addLayer(profilesLayer);
      map.addLayer(anonLayer);
      map.addLayer(eventsLayer);
      map.addLayer(professionsLayer);

      const profData = (profs as any[] || []).filter(p => p.lat && p.lng);
      setAllData({ profiles: profiles || [], anon: anonMarkers || [], events: events || [], professions: profData });
      setCountries(Array.from(allCountries).sort());
      setStats({
        profiles: (profiles || []).filter((p: any) => p.lat && p.lng).length,
        anon: (anonMarkers || []).length,
        events: (events || []).length,
        professions: profData.length,
        total: (profiles || []).filter((p: any) => p.lat && p.lng).length + (anonMarkers || []).length + (events || []).length + profData.length,
      });
    };

    loadMarkers();
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Reactive filtering: rebuild layers when filter/country/profession changes
  useEffect(() => {
    if (!layersRef.current || !mapRef.current) return;
    const map = mapRef.current;
    const layers = layersRef.current;
    const md = markersDataRef.current;

    // Helper: should this item show?
    const shouldShow = (data: any): boolean => {
      // Type filter
      const typeOk = filterType === 'all' || filterType === data._type || (filterType === 'professions' && data._type === 'profession');
      if (!typeOk) return false;

      // Country filter - hide everything not matching
      if (selectedCountry && (data.country || '') !== selectedCountry) return false;

      // Profession filter - only show profiles/anon with that profession + the profession itself
      if (selectedProfession) {
        if (data._type === 'profile' || data._type === 'anon') {
          const profs = data._professions || [];
          if (!profs.includes(selectedProfession)) return false;
        } else if (data._type === 'profession') {
          if (data.id !== selectedProfession) return false;
        } else {
          return false; // hide events when profession filter active
        }
      }

      return true;
    };

    // Clear and rebuild each layer, collect visible bounds
    const allBounds: L.LatLng[] = [];
    (['profiles', 'anon', 'events', 'professions'] as const).forEach(key => {
      const layer = layers[key];
      layer.clearLayers();
      md[key].forEach(({ marker, data }) => {
        if (shouldShow(data)) {
          layer.addLayer(marker);
          allBounds.push(marker.getLatLng());
        }
      });
      if (!map.hasLayer(layer)) map.addLayer(layer);
    });

    // Fly to filtered bounds
    if ((selectedCountry || selectedProfession) && allBounds.length > 0) {
      const bounds = L.latLngBounds(allBounds);
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 6, duration: 1 });
    } else if (!selectedCountry && !selectedProfession) {
      map.flyTo([30, 20], 2, { duration: 0.5 });
    }
  }, [filterType, selectedCountry, selectedProfession]);

  const getFilteredItems = () => {
    let items: any[] = [];
    if (filterType === 'all' || filterType === 'profiles') items.push(...allData.profiles.filter(p => p.lat && p.lng).map(p => ({ ...p, _type: 'profile', _professions: profileProfessions.get(p.id) || [] })));
    if (filterType === 'all' || filterType === 'anon') items.push(...allData.anon.map(a => ({ ...a, _type: 'anon', _professions: anonProfessions.get(a.id) || [] })));
    if (filterType === 'all' || filterType === 'events') items.push(...allData.events.map(e => ({ ...e, _type: 'event' })));
    if (filterType === 'all' || filterType === 'professions') items.push(...allData.professions.map(p => ({ ...p, _type: 'profession' })));

    if (selectedCountry) items = items.filter(i => i.country === selectedCountry);
    if (selectedProfession) {
      items = items.filter(i => {
        if (i._type === 'profile' || i._type === 'anon') return (i._professions || []).includes(selectedProfession);
        if (i._type === 'profession') return i.id === selectedProfession;
        return false;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => {
        const name = (i.display_name || pickI18n(i.name_i18n, i.name, lang) || pickI18n(i.title_i18n, i.title, lang) || '').toLowerCase();
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

  // Stats panel component
  const StatsPanel = () => (
    <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg text-xs space-y-1 min-w-[160px]">
      <div className="font-semibold text-foreground text-sm mb-1.5">📊 {t('map.stats_title')}</div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">👤 {t('map.stats_profiles')}</span>
        <span className="font-medium text-foreground">{stats.profiles}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">👻 {t('map.stats_anon')}</span>
        <span className="font-medium text-foreground">{stats.anon}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">📅 {t('map.stats_events')}</span>
        <span className="font-medium text-foreground">{stats.events}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">💼 {t('map.stats_professions')}</span>
        <span className="font-medium text-foreground">{stats.professions}</span>
      </div>
      <div className="border-t border-border pt-1 mt-1 flex items-center justify-between gap-4">
        <span className="text-muted-foreground font-medium">{t('map.stats_total')}</span>
        <span className="font-bold text-foreground">{stats.total}</span>
      </div>
    </div>
  );

  if (!showSidebar) {
    return (
      <div className="w-full h-[70vh] md:h-[75vh] rounded-xl overflow-hidden shadow-lg border border-border relative">
        <div ref={containerRef} className="w-full h-full" />
        <StatsPanel />
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
              placeholder={t('map.search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'profiles', 'anon', 'events', 'professions'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${filterType === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {f === 'all' ? t('map.filter_all') : f === 'profiles' ? '👤' : f === 'anon' ? '👻' : f === 'events' ? '📅' : '💼'}
                <span className="hidden sm:inline ml-1">{f === 'all' ? '' : f === 'profiles' ? t('map.filter_profiles') : f === 'anon' ? t('map.filter_anon') : f === 'events' ? t('map.filter_events') : t('map.filter_professions')}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {countries.length > 0 && (
              <select
                value={selectedCountry}
                onChange={e => { setSelectedCountry(e.target.value); }}
                className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground"
              >
                <option value="">{t('map.all_countries')}</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {professionsList.length > 0 && (
              <select
                value={selectedProfession}
                onChange={e => { setSelectedProfession(e.target.value); }}
                className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground"
              >
                <option value="">{t('map.all_professions')}</option>
                {professionsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t('map.no_results')}</p>}
          {filteredItems.map((item, i) => {
            const isProfile = item._type === 'profile';
            const isEvent = item._type === 'event';
            const isProfession = item._type === 'profession';
            const name = item.display_name || pickI18n(item.name_i18n, item.name, lang) || pickI18n(item.title_i18n, item.title, lang) || '';
            const loc = item.city && item.country ? `${item.city}, ${item.country}` : item.location || '';
            return (
              <button
                key={`${item._type}-${item.id}-${i}`}
                onClick={() => { flyTo(item.lat, item.lng); setSidebarOpen(false); }}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{isProfession ? '💼' : isEvent ? '📅' : isProfile ? '👤' : '👻'}</span>
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
      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-border min-h-[50vh] relative">
        <div ref={containerRef} className="w-full h-full" />
        <StatsPanel />
      </div>
    </div>
  );
};

export default WorldMap;
