import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, MapPin, FileText, UserPlus, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';

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

interface RsvpProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  slug: string | null;
}

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<RsvpProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Load event
      let { data } = await supabase.from('event_markers').select('*').eq('slug', slug!).single();
      if (!data) {
        const res = await supabase.from('event_markers').select('*').eq('id', slug!).single();
        data = res.data;
      }
      if (data) {
        const ev = data as unknown as EventData;
        setEvent(ev);
        // Load RSVPs
        const { data: rsvpData } = await supabase.from('event_rsvps').select('user_id').eq('event_id', ev.id);
        if (rsvpData && rsvpData.length > 0) {
          const userIds = rsvpData.map(r => (r as any).user_id);
          const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url, slug').in('user_id', userIds);
          if (profiles) setRsvps(profiles as unknown as RsvpProfile[]);
        }
        // Check current user RSVP
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const { data: existing } = await supabase.from('event_rsvps').select('id').eq('event_id', ev.id).eq('user_id', session.user.id);
          setHasRsvped(!!(existing && existing.length > 0));
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleRsvp = async () => {
    if (!event || !currentUserId) return;
    setRsvpLoading(true);
    if (hasRsvped) {
      await supabase.from('event_rsvps').delete().eq('event_id', event.id).eq('user_id', currentUserId);
      setHasRsvped(false);
      setRsvps(prev => prev.filter(r => r.user_id !== currentUserId));
      toast.success(t('event.rsvp_cancelled'));
    } else {
      const { error } = await supabase.from('event_rsvps').insert({ event_id: event.id, user_id: currentUserId } as any);
      if (error) { toast.error(error.message); }
      else {
        setHasRsvped(true);
        const { data: profile } = await supabase.from('profiles').select('user_id, display_name, avatar_url, slug').eq('user_id', currentUserId).single();
        if (profile) setRsvps(prev => [...prev, profile as unknown as RsvpProfile]);
        toast.success(t('event.rsvp_confirmed'));
      }
    }
    setRsvpLoading(false);
  };

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

          {/* RSVP Section */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{t('event.participants')} ({rsvps.length})</span>
              </div>
              {currentUserId && (
                <Button
                  size="sm"
                  variant={hasRsvped ? 'outline' : 'default'}
                  onClick={handleRsvp}
                  disabled={rsvpLoading}
                  className="gap-1"
                >
                  {hasRsvped ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {hasRsvped ? t('event.leave') : t('event.join')}
                </Button>
              )}
              {!currentUserId && (
                <Link to="/auth">
                  <Button size="sm" variant="outline" className="gap-1">
                    <UserPlus className="w-4 h-4" /> {t('event.login_to_join')}
                  </Button>
                </Link>
              )}
            </div>

            {rsvps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rsvps.map(r => (
                  <Link key={r.user_id} to={`/humans/${r.slug || r.user_id}`}>
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2 cursor-pointer hover:bg-muted">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={r.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                          {r.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {r.display_name}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('event.no_participants')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetail;
