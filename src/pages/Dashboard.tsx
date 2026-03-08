import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Settings, LogOut, CheckCircle, Clock, Flag, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      const [{ data: p }, { data: rsvps }, { data: reqs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', session.user.id).single(),
        supabase.from('event_rsvps').select('event_id').eq('user_id', session.user.id),
        supabase.from('profile_edit_requests').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5),
      ]);
      if (p) setProfile(p);
      if (reqs) setEditRequests(reqs as any[]);
      if (rsvps && rsvps.length > 0) {
        const eventIds = rsvps.map((r: any) => r.event_id);
        const { data: evts } = await supabase.from('event_markers').select('*').in('id', eventIds);
        if (evts) setEvents(evts as any[]);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); toast.success(t('auth.logged_out')); };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  const pendingEdits = editRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t('nav.logout')}</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <CalendarDays className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{events.length}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.events_count')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              {profile?.approved ? <CheckCircle className="w-5 h-5 text-primary mx-auto mb-1" /> : <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />}
              <p className="text-lg font-bold text-foreground">{profile?.approved ? '✓' : '...'}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.profile_status')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Flag className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{pendingEdits}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.pending_edits')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile card */}
        {profile && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    {(profile.display_name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">{profile.display_name}</h2>
                  {(profile.city || profile.country || profile.location) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.location}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {profile.approved ? (
                      <Badge variant="default" className="text-xs">{t('profile.approved')}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">{t('profile.pending')}</Badge>
                    )}
                  </div>
                </div>
                <Link to={`/humans/${profile.slug || profile.user_id}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                    <Settings className="w-4 h-4" /> {t('profile.edit')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Requests */}
        {editRequests.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                {t('dashboard.edit_requests')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                {editRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{Object.keys(req.new_data || {}).join(', ')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                      {req.status === 'approved' ? t('profile.approved') : req.status === 'rejected' ? t('admin.rejected') : t('profile.pending')}
                    </Badge>
                  </div>
                ))}
              </div>
              {editRequests.some(r => r.status === 'rejected' && r.admin_response) && (
                <div className="mt-3 p-2 rounded-lg border border-destructive/20 bg-destructive/5">
                  <p className="text-xs text-destructive">{editRequests.find(r => r.status === 'rejected')?.admin_response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Events */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('dashboard.my_events')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.no_events')}</p>
            ) : (
              <div className="space-y-2">
                {events.map((e: any) => (
                  <Link key={e.id} to={`/events/${e.slug || e.id}`} className="block">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.city && e.country ? `${e.city}, ${e.country}` : ''}
                          {e.start_date ? ` • ${e.start_date}` : e.date ? ` • ${e.date}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{t('event.joined')}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default Dashboard;
