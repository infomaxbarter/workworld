import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  date: string | null;
  description: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

const EventsPage = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('event_markers').select('*').order('date', { ascending: false }).then(({ data }) => {
      if (data) setEvents(data as EventData[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground">{t('events.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('events.subtitle')}</p>
      </div>

      {events.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('events.no_events')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <Link key={e.id} to={`/event/${e.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg text-foreground mb-2">{e.title}</h3>
                  {e.date && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />{e.date}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" />{e.lat.toFixed(2)}, {e.lng.toFixed(2)}
                  </p>
                  {e.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
