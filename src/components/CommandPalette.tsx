import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, CalendarDays, Map, Info, LayoutDashboard, Shield, User, Home, MapPin } from 'lucide-react';

interface ProfileHit { id: string; display_name: string; slug: string | null; user_id: string; city: string | null; country: string | null; avatar_url: string | null; }
interface EventHit { id: string; title: string; slug: string | null; city: string | null; country: string | null; start_date: string | null; }
interface AnonHit { id: string; name: string; slug: string | null; city: string | null; country: string | null; }

const RECENT_KEY = 'cmd_palette_recent';
const MAX_RECENT = 5;

interface RecentItem { path: string; label: string; timestamp: number; }

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileHit[]>([]);
  const [events, setEvents] = useState<EventHit[]>([]);
  const [anons, setAnons] = useState<AnonHit[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      setRecents(stored);
    } catch { setRecents([]); }
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
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Load data when opened
  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from('profiles').select('id,display_name,slug,user_id,city,country,avatar_url').eq('approved', true),
      supabase.from('event_markers').select('id,title,slug,city,country,start_date'),
      supabase.from('user_markers').select('id,name,slug,city,country'),
    ]).then(([p, e, a]) => {
      if (p.data) setProfiles(p.data as unknown as ProfileHit[]);
      if (e.data) setEvents(e.data as unknown as EventHit[]);
      if (a.data) setAnons(a.data as unknown as AnonHit[]);
    });
  }, [open]);

  const go = (path: string) => { navigate(path); setOpen(false); setQuery(''); };

  const pages = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/humans', label: t('nav.humans'), icon: Users },
    { path: '/events', label: t('nav.events'), icon: CalendarDays },
    { path: '/map', label: t('nav.map'), icon: Map },
    { path: '/about', label: t('nav.about'), icon: Info },
    { path: '/dashboard', label: t('nav.dashboard') || 'Dashboard', icon: LayoutDashboard },
    { path: '/admin', label: t('nav.admin') || 'Admin', icon: Shield },
    { path: '/auth', label: t('nav.login'), icon: User },
  ];

  const q = query.toLowerCase();

  const filteredProfiles = useMemo(() => {
    if (!q) return profiles.slice(0, 5);
    return profiles.filter(p =>
      p.display_name.toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.country || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [profiles, q]);

  const filteredEvents = useMemo(() => {
    if (!q) return events.slice(0, 5);
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.city || '').toLowerCase().includes(q) ||
      (e.country || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [events, q]);

  const filteredAnons = useMemo(() => {
    if (!q) return [];
    return anons.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q) ||
      (a.country || '').toLowerCase().includes(q)
    ).slice(0, 5);
  }, [anons, q]);

  const loc = (city: string | null, country: string | null) => {
    if (city && country) return `${city}, ${country}`;
    return city || country || '';
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('humans.search_placeholder') || 'Search...'} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{t('humans.no_results') || 'No results found.'}</CommandEmpty>

        {/* Pages */}
        <CommandGroup heading={t('nav.home') || 'Pages'}>
          {pages.map(p => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-2 cursor-pointer">
              <p.icon className="w-4 h-4 text-muted-foreground" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Profiles */}
        {filteredProfiles.length > 0 && (
          <CommandGroup heading={t('nav.humans') || 'Members'}>
            {filteredProfiles.map(p => (
              <CommandItem key={p.id} onSelect={() => go(`/humans/${p.slug || p.user_id}`)} className="gap-2 cursor-pointer">
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

        {/* Events */}
        {filteredEvents.length > 0 && (
          <CommandGroup heading={t('nav.events') || 'Events'}>
            {filteredEvents.map(e => (
              <CommandItem key={e.id} onSelect={() => go(`/events/${e.slug || e.id}`)} className="gap-2 cursor-pointer">
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{e.title}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {e.start_date || loc(e.city, e.country)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Anonymous members */}
        {filteredAnons.length > 0 && (
          <CommandGroup heading={t('humans.anonymous_title') || 'Anonymous'}>
            {filteredAnons.map(a => (
              <CommandItem key={a.id} onSelect={() => go(`/members/${a.slug || a.id}`)} className="gap-2 cursor-pointer">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{a.name}</span>
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
