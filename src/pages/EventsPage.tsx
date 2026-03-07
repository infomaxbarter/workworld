import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';

interface EventData {
  id: string; title: string; date: string | null; start_date: string | null; end_date: string | null;
  description: string | null; lat: number; lng: number; slug: string | null; city: string | null;
  country: string | null; capacity: number | null; external_url: string | null; created_at: string;
}

const EventsPage = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('event_markers').select('*').order('date', { ascending: false }).then(({ data }) => {
      if (data) setEvents(data as unknown as EventData[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('events.title')}</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">{t('events.subtitle')}</p>
      </div>

      {events.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('events.no_events')}</p>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {events.map((e) => {
            const loc = e.city && e.country ? `${e.city}, ${e.country}` : `${e.lat.toFixed(2)}, ${e.lng.toFixed(2)}`;
            return (
              <Link key={e.id} to={`/events/${e.slug || e.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base sm:text-lg text-foreground">{e.title}</h3>
                      {e.capacity && <Badge variant="outline" className="shrink-0 text-xs">👥 {e.capacity}</Badge>}
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
  );
};

export default EventsPage;
