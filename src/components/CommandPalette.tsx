import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, CalendarDays, Map, Info, LayoutDashboard, Shield, User, Home, MapPin, Clock,
  Briefcase, Newspaper, Building2, Play, Headphones, FileText, X,
} from 'lucide-react';

type Facet = 'all' | 'humans' | 'events' | 'professions' | 'cities' | 'media' | 'places';

interface ProfileHit { id: string; display_name: string; slug: string | null; user_id: string; city: string | null; country: string | null; avatar_url: string | null; }
interface EventHit { id: string; title: string; slug: string | null; city: string | null; country: string | null; start_date: string | null; title_i18n?: any; }
interface AnonHit { id: string; name: string; slug: string | null; city: string | null; country: string | null; name_i18n?: any; }
interface ProfHit { id: string; name: string; slug: string | null; name_i18n?: any; description_i18n?: any; description: string | null; }
interface CityHit { id: string; city: string; country_code: string; slug: string | null; cp_final: number | null; seat_quota: number | null; }
interface MediaHit { id: string; slug: string | null; title: string; type: 'blog' | 'video' | 'podcast'; title_i18n?: any; }

const RECENT_KEY = 'cmd_palette_recent';
const MAX_RECENT = 5;

interface RecentItem { path: string; label: string; timestamp: number; }

const FACETS: Array<{ key: Facet; label: string; Icon: any }> = [
  { key: 'all',         label: 'All',         Icon: null as any },
  { key: 'humans',      label: 'Community',   Icon: Users },
  { key: 'events',      label: 'Events',      Icon: CalendarDays },
  { key: 'professions', label: 'Professions', Icon: Briefcase },
  { key: 'cities',      label: 'Cities',      Icon: Building2 },
  { key: 'media',       label: 'Media',       Icon: Newspaper },
  { key: 'places',      label: 'Places',      Icon: MapPin },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState<Facet>('all');
  const [profiles, setProfiles] = useState<ProfileHit[]>([]);
  const [events, setEvents] = useState<EventHit[]>([]);
  const [anons, setAnons] = useState<AnonHit[]>([]);
  const [profs, setProfs] = useState<ProfHit[]>([]);
  const [cities, setCities] = useState<CityHit[]>([]);
  const [media, setMedia] = useState<MediaHit[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const lp = useLocalizedPath();

  useEffect(() => {
    try { setRecents(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')); } catch { setRecents([]); }
  }, [open]);

  const addRecent = (path: string, label: string) => {
    const updated = [{ path, label, timestamp: Date.now() }, ...recents.filter(r => r.path !== path)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecents(updated);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(o => !o); }
    };
    const onOpen = (e: any) => {
      setOpen(true);
      const f = e?.detail?.facet as Facet | undefined;
      if (f) setFacet(f);
    };
    document.addEventListener('keydown', down);
    window.addEventListener('open-command-palette', onOpen as any);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-command-palette', onOpen as any);
    };
  }, []);

  // Load data when opened
  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from('profiles').select('id,display_name,slug,user_id,city,country,avatar_url').eq('approved', true).limit(500),
      supabase.from('event_markers').select('id,title,title_i18n,slug,city,country,start_date').limit(500),
      supabase.from('user_markers').select('id,name,name_i18n,slug,city,country').limit(500),
      supabase.from('professions').select('id,name,name_i18n,description,description_i18n,slug').eq('status', 'active').limit(300),
      supabase.from('mci_cities').select('id,city,country_code,slug,cp_final,seat_quota').eq('approved', true).order('cp_final', { ascending: false, nullsFirst: false }).limit(200),
      supabase.from('media_content').select('id,slug,title,title_i18n,type').eq('status', 'approved').limit(200),
    ]).then(([p, e, a, pr, ct, md]) => {
      if (p.data) setProfiles(p.data as unknown as ProfileHit[]);
      if (e.data) setEvents(e.data as unknown as EventHit[]);
      if (a.data) setAnons(a.data as unknown as AnonHit[]);
      if (pr.data) setProfs(pr.data as unknown as ProfHit[]);
      if (ct.data) setCities(ct.data as unknown as CityHit[]);
      if (md.data) setMedia(md.data as unknown as MediaHit[]);
    });
  }, [open]);

  const go = (path: string, label?: string) => { if (label) addRecent(path, label); navigate(path); setOpen(false); setQuery(''); };

  const q = query.toLowerCase();
  const show = (f: Facet) => facet === 'all' || facet === f;

  const pages = useMemo(() => [
    { path: lp('home'), label: t('nav.home'), icon: Home },
    { path: lp('humans'), label: t('nav.humans'), icon: Users },
    { path: lp('events'), label: t('nav.events'), icon: CalendarDays },
    { path: lp('professions'), label: t('nav.professions'), icon: Briefcase },
    { path: lp('map'), label: t('nav.map'), icon: Map },
    { path: lp('mci'), label: 'MCI', icon: Building2 },
    { path: lp('blog'), label: t('blog.title') || 'Blog', icon: FileText },
    { path: lp('videos'), label: t('videos.title') || 'Videos', icon: Play },
    { path: lp('podcast'), label: t('podcast.title') || 'Podcast', icon: Headphones },
    { path: lp('analytics'), label: t('nav.analytics') || 'Analytics', icon: LayoutDashboard },
    { path: lp('about'), label: t('nav.about'), icon: Info },
    { path: lp('dashboard'), label: t('nav.dashboard') || 'Dashboard', icon: LayoutDashboard },
    { path: lp('admin'), label: t('nav.admin') || 'Admin', icon: Shield },
    { path: lp('auth'), label: t('nav.login'), icon: User },
  ], [lp, t]);

  const filteredProfiles = useMemo(() => {
    if (!show('humans')) return [];
    if (!q) return profiles.slice(0, 5);
    return profiles.filter(p =>
      p.display_name.toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.country || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [profiles, q, facet]);

  const filteredEvents = useMemo(() => {
    if (!show('events')) return [];
    if (!q) return events.slice(0, 5);
    return events.filter(e =>
      pickI18n(e.title_i18n, e.title, lang).toLowerCase().includes(q) ||
      (e.city || '').toLowerCase().includes(q) ||
      (e.country || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [events, q, facet, lang]);

  const filteredAnons = useMemo(() => {
    if (!show('humans')) return [];
    if (!q) return [];
    return anons.filter(a =>
      pickI18n(a.name_i18n, a.name, lang).toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q) ||
      (a.country || '').toLowerCase().includes(q)
    ).slice(0, 5);
  }, [anons, q, facet, lang]);

  const filteredProfs = useMemo(() => {
    if (!show('professions')) return [];
    if (!q) return profs.slice(0, 5);
    return profs.filter(p =>
      pickI18n(p.name_i18n, p.name, lang).toLowerCase().includes(q) ||
      pickI18n(p.description_i18n, p.description, lang).toLowerCase().includes(q)
    ).slice(0, 10);
  }, [profs, q, facet, lang]);

  const filteredCities = useMemo(() => {
    if (!show('cities') && !show('places')) return [];
    if (!q) return cities.slice(0, 6);
    return cities.filter(c =>
      c.city.toLowerCase().includes(q) || c.country_code.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [cities, q, facet]);

  const filteredMedia = useMemo(() => {
    if (!show('media')) return [];
    if (!q) return media.slice(0, 5);
    return media.filter(m =>
      pickI18n(m.title_i18n, m.title, lang).toLowerCase().includes(q)
    ).slice(0, 10);
  }, [media, q, facet, lang]);

  const loc = (city: string | null, country: string | null) => city && country ? `${city}, ${country}` : city || country || '';

  const mediaPath = (m: MediaHit) => {
    const k = m.type === 'blog' ? 'blogDetail' : m.type === 'video' ? 'videoDetail' : 'podcastDetail';
    return lp(k as any, { slug: m.slug || m.id });
  };
  const mediaIcon = (t: MediaHit['type']) => t === 'blog' ? FileText : t === 'video' ? Play : Headphones;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('search.hero_placeholder') || 'Search people, events, cities, professions, media…'} value={query} onValueChange={setQuery} />

      {/* Facet chips */}
      <div className="flex flex-wrap gap-1 px-3 pt-2 pb-2 border-b border-border">
        {FACETS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setFacet(key)}
            className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] transition-colors ${
              facet === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {t(`search.facet_${key}`) || label}
          </button>
        ))}
        {facet !== 'all' && (
          <button onClick={() => setFacet('all')} className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <CommandList>
        <CommandEmpty>{t('humans.no_results') || 'No results found.'}</CommandEmpty>

        {!q && recents.length > 0 && facet === 'all' && (
          <CommandGroup heading="Recent">
            {recents.map(r => (
              <CommandItem key={r.path} onSelect={() => go(r.path, r.label)} className="gap-2 cursor-pointer">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{r.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {facet === 'all' && (
          <CommandGroup heading="Pages">
            {pages.map(p => (
              <CommandItem key={p.path} onSelect={() => go(p.path, p.label)} className="gap-2 cursor-pointer">
                <p.icon className="w-4 h-4 text-muted-foreground" />
                <span>{p.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredProfiles.length > 0 && (
          <CommandGroup heading={t('nav.humans') || 'Members'}>
            {filteredProfiles.map(p => (
              <CommandItem key={p.id} onSelect={() => go(lp('humanDetail', { slug: p.slug || p.user_id }), p.display_name)} className="gap-2 cursor-pointer">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{p.display_name}</span>
                {loc(p.city, p.country) && (
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <MapPin className="w-3 h-3" />{loc(p.city, p.country)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredEvents.length > 0 && (
          <CommandGroup heading={t('nav.events') || 'Events'}>
            {filteredEvents.map(e => (
              <CommandItem key={e.id} onSelect={() => go(lp('eventDetail', { slug: e.slug || e.id }), e.title)} className="gap-2 cursor-pointer">
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{pickI18n(e.title_i18n, e.title, lang)}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">{e.start_date || loc(e.city, e.country)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredProfs.length > 0 && (
          <CommandGroup heading={t('nav.professions') || 'Professions'}>
            {filteredProfs.map(p => (
              <CommandItem key={p.id} onSelect={() => go(lp('professionDetail', { slug: p.slug || p.id }), pickI18n(p.name_i18n, p.name, lang))} className="gap-2 cursor-pointer">
                <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{pickI18n(p.name_i18n, p.name, lang)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredCities.length > 0 && (
          <CommandGroup heading="Cities (MCI)">
            {filteredCities.map(c => (
              <CommandItem key={c.id} onSelect={() => go(`${lp('mci')}/${c.slug || c.id}`, c.city)} className="gap-2 cursor-pointer">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{c.city} · {c.country_code}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0 font-mono">
                  K{c.seat_quota ?? '—'} · {c.cp_final?.toFixed(0) ?? '—'}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredMedia.length > 0 && (
          <CommandGroup heading="Media">
            {filteredMedia.map(m => {
              const Icon = mediaIcon(m.type);
              return (
                <CommandItem key={m.id} onSelect={() => go(mediaPath(m), pickI18n(m.title_i18n, m.title, lang))} className="gap-2 cursor-pointer">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{pickI18n(m.title_i18n, m.title, lang)}</span>
                  <span className="ml-auto text-[10px] uppercase text-muted-foreground shrink-0">{m.type}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredAnons.length > 0 && (
          <CommandGroup heading={t('humans.anonymous_title') || 'Anonymous'}>
            {filteredAnons.map(a => (
              <CommandItem key={a.id} onSelect={() => go(lp('memberDetail', { slug: a.slug || a.id }), pickI18n(a.name_i18n, a.name, lang))} className="gap-2 cursor-pointer">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{pickI18n(a.name_i18n, a.name, lang)}</span>
                {loc(a.city, a.country) && (
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <MapPin className="w-3 h-3" />{loc(a.city, a.country)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
