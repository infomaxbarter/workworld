import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, FileText } from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  date: string | null;
  description: string | null;
  lat: number;
  lng: number;
  slug: string | null;
  created_at: string;
}

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let { data } = await supabase.from('event_markers').select('*').eq('slug', slug!).single();
      if (!data) {
        const res = await supabase.from('event_markers').select('*').eq('id', slug!).single();
        data = res.data;
      }
      if (data) setEvent(data as unknown as EventData);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!event) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Event not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('event.back')}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{t('event.date')}: {event.date}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{t('event.location')}: {event.lat.toFixed(2)}, {event.lng.toFixed(2)}</span>
          </div>
          {event.description && (
            <div className="pt-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium">{t('event.description')}</span>
              </div>
              <p className="text-foreground leading-relaxed">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetail;
