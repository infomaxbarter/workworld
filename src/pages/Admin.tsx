import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, Trash2, ShieldAlert, CheckCircle, XCircle, Clock, Users, CalendarDays, FileText, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Submission { id: string; name: string; email: string; message: string; created_at: string; }
interface UserMarker { id: string; name: string; lat: number; lng: number; }
interface EventMarker { id: string; title: string; date: string | null; description: string | null; lat: number; lng: number; }
interface ProfileRow { id: string; user_id: string; display_name: string; bio: string | null; location: string | null; approved: boolean; created_at: string; }

const Admin = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin');
      if (data && data.length > 0) setAuthorized(true);
      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <ShieldAlert className="w-10 h-10 mx-auto text-destructive mb-2" />
            <CardTitle>{t('admin.access_denied')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t('admin.no_privileges')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
};

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserMarker[]>([]);
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [profileFilter, setProfileFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const reload = async () => {
    const [{ data: s }, { data: u }, { data: e }, { data: p }] = await Promise.all([
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('user_markers').select('*'),
      supabase.from('event_markers').select('*'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    if (s) setSubmissions(s);
    if (u) setUsers(u);
    if (e) setEvents(e);
    if (p) setProfiles(p as unknown as ProfileRow[]);
  };

  useEffect(() => { reload(); }, []);

  const exportCSV = () => {
    const header = 'Name,Email,Message,Date\n';
    const rows = submissions.map(s => `"${s.name}","${s.email}","${s.message}","${s.created_at}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'submissions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSubmission = async (id: string) => {
    await supabase.from('submissions').delete().eq('id', id);
    setSubmissions(prev => prev.filter(s => s.id !== id));
  };

  // Profile approval
  const approveProfile = async (userId: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('user_id', userId);
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, approved: true } : p));
    toast.success('Profile approved');
  };

  const rejectProfile = async (userId: string) => {
    await supabase.from('profiles').update({ approved: false }).eq('user_id', userId);
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, approved: false } : p));
    toast.success('Profile rejected');
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  // User markers CRUD
  const addUser = async () => {
    const { error } = await supabase.from('user_markers').insert({ name: 'New Member', lat: 0, lng: 0 });
    if (error) toast.error('Failed');
    else reload();
  };

  const updateUser = async (id: string, field: string, value: string) => {
    const val = field === 'lat' || field === 'lng' ? parseFloat(value) || 0 : value;
    await supabase.from('user_markers').update({ [field]: val }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: val } : u));
  };

  const removeUser = async (id: string) => {
    await supabase.from('user_markers').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Event markers CRUD
  const addEvent = async () => {
    const { error } = await supabase.from('event_markers').insert({ title: 'New Event', lat: 0, lng: 0 });
    if (error) toast.error('Failed');
    else reload();
  };

  const updateEvent = async (id: string, field: string, value: string) => {
    const val = field === 'lat' || field === 'lng' ? parseFloat(value) || 0 : value;
    await supabase.from('event_markers').update({ [field]: val }).eq('id', id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const removeEvent = async (id: string) => {
    await supabase.from('event_markers').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const filteredProfiles = profiles.filter(p => {
    if (profileFilter === 'pending') return !p.approved;
    if (profileFilter === 'approved') return p.approved;
    return true;
  });

  const pendingCount = profiles.filter(p => !p.approved).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{profiles.length}</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />{events.length}</span>
            <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{submissions.length}</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" />{pendingCount} {t('admin.pending')}</Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="profiles">
          <TabsList className="mb-4">
            <TabsTrigger value="profiles" className="gap-1.5">
              <Users className="w-4 h-4" /> {t('admin.profiles')}
              {pendingCount > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-1.5"><FileText className="w-4 h-4" /> {t('admin.submissions')}</TabsTrigger>
            <TabsTrigger value="markers" className="gap-1.5"><MapPin className="w-4 h-4" /> {t('admin.members')}</TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5"><CalendarDays className="w-4 h-4" /> {t('admin.events')}</TabsTrigger>
          </TabsList>

          {/* Profiles Tab */}
          <TabsContent value="profiles">
            <div className="flex gap-2 mb-4">
              {(['all', 'pending', 'approved'] as const).map(f => (
                <Button key={f} variant={profileFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setProfileFilter(f)}>
                  {t(`admin.${f}`)} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredProfiles.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground truncate">{p.display_name || '(unnamed)'}</span>
                        {p.approved ? (
                          <Badge variant="default" className="gap-1 text-xs"><CheckCircle className="w-3 h-3" />{t('admin.approved')}</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-xs"><Clock className="w-3 h-3" />{t('admin.pending')}</Badge>
                        )}
                      </div>
                      {p.location && <p className="text-xs text-muted-foreground">{p.location}</p>}
                      {p.bio && <p className="text-xs text-muted-foreground truncate max-w-md">{p.bio}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!p.approved && (
                        <Button size="sm" onClick={() => approveProfile(p.user_id)} className="gap-1">
                          <CheckCircle className="w-4 h-4" /> {t('admin.approve')}
                        </Button>
                      )}
                      {p.approved && (
                        <Button variant="outline" size="sm" onClick={() => rejectProfile(p.user_id)} className="gap-1">
                          <XCircle className="w-4 h-4" /> {t('admin.reject')}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteProfile(p.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProfiles.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No profiles found.</p>
              )}
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{submissions.length} submission(s)</p>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!submissions.length}>
                <Download className="w-4 h-4 mr-1" /> {t('admin.export_csv')}
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.message}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteSubmission(s.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!submissions.length && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Map Markers Tab */}
          <TabsContent value="markers">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{users.length} member(s)</p>
              <Button size="sm" onClick={addUser}><Plus className="w-4 h-4 mr-1" /> {t('admin.add_member')}</Button>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <Card key={u.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <Input value={u.name} onChange={e => updateUser(u.id, 'name', e.target.value)} placeholder="Name" className="flex-1" />
                    <Input value={u.lat} onChange={e => updateUser(u.id, 'lat', e.target.value)} placeholder="Lat" className="w-28" />
                    <Input value={u.lng} onChange={e => updateUser(u.id, 'lng', e.target.value)} placeholder="Lng" className="w-28" />
                    <Button variant="ghost" size="icon" onClick={() => removeUser(u.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{events.length} event(s)</p>
              <Button size="sm" onClick={addEvent}><Plus className="w-4 h-4 mr-1" /> {t('admin.add_event')}</Button>
            </div>
            <div className="space-y-3">
              {events.map(e => (
                <Card key={e.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input value={e.title} onChange={ev => updateEvent(e.id, 'title', ev.target.value)} placeholder="Title" className="flex-1" />
                      <Input type="date" value={e.date || ''} onChange={ev => updateEvent(e.id, 'date', ev.target.value)} className="w-40" />
                    </div>
                    <Textarea value={e.description || ''} onChange={ev => updateEvent(e.id, 'description', ev.target.value)} placeholder="Description" rows={2} />
                    <div className="flex gap-3 items-center">
                      <Input value={e.lat} onChange={ev => updateEvent(e.id, 'lat', ev.target.value)} placeholder="Lat" className="w-28" />
                      <Input value={e.lng} onChange={ev => updateEvent(e.id, 'lng', ev.target.value)} placeholder="Lng" className="w-28" />
                      <Button variant="ghost" size="icon" onClick={() => removeEvent(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
