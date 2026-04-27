import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, CalendarDays, Clock } from 'lucide-react';
import Footer from '@/components/Footer';

interface EventData {
  id: string; title: string; date: string | null; start_date: string | null; end_date: string | null;
  description: string | null; lat: number; lng: number; slug: string | null; city: string | null;
  country: string | null; capacity: number | null; external_url: string | null; created_at: string;
  status: string;
  title_i18n?: any; description_i18n?: any;
}

const EventsPage = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'coming_soon' | 'past' | 'inactive'>('all');

  useEffect(() => {
    supabase.from('event_markers').select('*').order('start_date', { ascending: false }).then(({ data }) => {
      if (data) setEvents(data as unknown as EventData[]);
      setLoading(false);
    });
  }, []);

  const now = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let list = events;

    if (tab === 'active') {
      list = list.filter(e => (e.status || 'active') === 'active');
    } else if (tab === 'coming_soon') {
      list = list.filter(e => (e.status || 'active') === 'coming_soon');
    } else if (tab === 'inactive') {
      list = list.filter(e => (e.status || 'active') === 'inactive');
    } else if (tab === 'past') {
      list = list.filter(e => {
        const d = e.end_date || e.start_date || e.date;
        return d && d < now;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.city || '').toLowerCase().includes(q) ||
        (e.country || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [events, search, tab, now]);

  const getStatusBadge = (event: EventData) => {
    const status = event.status || 'active';
    const eventDate = event.end_date || event.start_date || event.date;
    const isPast = eventDate && eventDate < now;

    if (isPast) return <Badge variant="secondary" className="text-xs">{t('status.past')}</Badge>;
    if (status === 'coming_soon') return <Badge className="text-xs bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">{t('status.coming_soon')}</Badge>;
    if (status === 'inactive') return <Badge variant="secondary" className="text-xs opacity-60">{t('status.inactive')}</Badge>;
    return <Badge className="text-xs bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">{t('status.active')}</Badge>;
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('events.title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">{t('events.subtitle')}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{events.length} {t('events.total_events')}</span>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('events.search_placeholder')}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'active', 'coming_soon', 'past', 'inactive'] as const).map(f => (
              <Button
                key={f}
                variant={tab === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab(f)}
                className="text-xs"
              >
                {t(`status.tab_${f}`)}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{search ? t('events.no_results') : t('events.no_events')}</p>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {filtered.map((e) => {
              const loc = e.city && e.country ? `${e.city}, ${e.country}` : e.city || e.country || `${e.lat.toFixed(2)}, ${e.lng.toFixed(2)}`;
              const status = e.status || 'active';
              const eventDate = e.end_date || e.start_date || e.date;
              const isPast = eventDate && eventDate < now;
              return (
                <Link key={e.id} to={`/events/${e.slug || e.id}`}>
                  <Card className={`hover:shadow-md transition-shadow h-full ${status === 'inactive' || isPast ? 'opacity-70' : ''}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-base sm:text-lg text-foreground">{e.title}</h3>
                        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                          {getStatusBadge(e)}
                          {e.capacity && <Badge variant="outline" className="text-xs">👥 {e.capacity}</Badge>}
                        </div>
                      </div>
                      {(e.start_date || e.date) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          {e.start_date || e.date}
                          {e.end_date && ` — ${e.end_date}`}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />{loc}
                      </p>
                      {e.description && <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default EventsPage;
