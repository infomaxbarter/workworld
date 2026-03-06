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
import { Download, Plus, Trash2, ShieldAlert, CheckCircle, XCircle, Clock, Users, CalendarDays, FileText, MapPin, GitCompare, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/LocationPicker';

interface Submission { id: string; name: string; email: string; message: string; created_at: string; }
interface UserMarker { id: string; name: string; lat: number; lng: number; }
interface EventMarker { id: string; title: string; date: string | null; description: string | null; lat: number; lng: number; slug: string | null; }
interface ProfileRow { id: string; user_id: string; display_name: string; bio: string | null; location: string | null; approved: boolean; slug: string | null; created_at: string; }
interface EditRequest { id: string; profile_id: string; user_id: string; old_data: Record<string, any>; new_data: Record<string, any>; status: string; admin_response: string | null; created_at: string; reviewed_at: string | null; profile_name?: string; }

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
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [profileFilter, setProfileFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  // New member/event forms
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberLat, setNewMemberLat] = useState<number | null>(null);
  const [newMemberLng, setNewMemberLng] = useState<number | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventLat, setNewEventLat] = useState<number | null>(null);
  const [newEventLng, setNewEventLng] = useState<number | null>(null);
  const [showEventPicker, setShowEventPicker] = useState(false);

  // Edit request review
  const [reviewResponse, setReviewResponse] = useState<Record<string, string>>({});

  const reload = async () => {
    const [{ data: s }, { data: u }, { data: e }, { data: p }, { data: er }] = await Promise.all([
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('user_markers').select('*'),
      supabase.from('event_markers').select('*'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('profile_edit_requests').select('*').order('created_at', { ascending: false }),
    ]);
    if (s) setSubmissions(s);
    if (u) setUsers(u);
    if (e) setEvents(e as unknown as EventMarker[]);
    if (p) setProfiles(p as unknown as ProfileRow[]);
    if (er) {
      // Enrich with profile names
      const requests = (er as unknown as EditRequest[]);
      const profileMap = new Map((p as unknown as ProfileRow[])?.map(pr => [pr.id, pr.display_name]) || []);
      requests.forEach(r => { r.profile_name = profileMap.get(r.profile_id) || 'Unknown'; });
      setEditRequests(requests);
    }
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

  const approveProfile = async (userId: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('user_id', userId);
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, approved: true } : p));
    await supabase.rpc('create_notification', { _user_id: userId, _type: 'approval', _title: 'Profiliniz onaylandı! 🎉', _message: 'Profiliniz artık topluluk sayfasında görünüyor.', _link: '/humans' } as any);
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

  // User markers CRUD with map picker
  const addUser = async () => {
    if (!newMemberName.trim()) { toast.error('Name required'); return; }
    const { error } = await supabase.from('user_markers').insert({ name: newMemberName, lat: newMemberLat || 0, lng: newMemberLng || 0 });
    if (error) toast.error('Failed');
    else {
      setNewMemberName(''); setNewMemberLat(null); setNewMemberLng(null); setShowMemberPicker(false);
      reload();
    }
  };

  const removeUser = async (id: string) => {
    await supabase.from('user_markers').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Event markers CRUD with map picker
  const addEvent = async () => {
    if (!newEventTitle.trim()) { toast.error('Title required'); return; }
    const { error } = await supabase.from('event_markers').insert({
      title: newEventTitle, date: newEventDate || null, description: newEventDesc || null,
      lat: newEventLat || 0, lng: newEventLng || 0,
    });
    if (error) toast.error('Failed');
    else {
      setNewEventTitle(''); setNewEventDate(''); setNewEventDesc(''); setNewEventLat(null); setNewEventLng(null); setShowEventPicker(false);
      reload();
    }
  };

  const removeEvent = async (id: string) => {
    await supabase.from('event_markers').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Edit request actions
  const approveEditRequest = async (req: EditRequest) => {
    // Apply changes to profile
    await supabase.from('profiles').update(req.new_data as any).eq('id', req.profile_id);
    await supabase.from('profile_edit_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() } as any).eq('id', req.id);
    await supabase.rpc('create_notification', { _user_id: req.user_id, _type: 'edit_approved', _title: 'Profil değişikliğiniz onaylandı ✅', _message: `${Object.keys(req.new_data).join(', ')} alanları güncellendi.`, _link: `/humans/${profiles.find(p => p.id === req.profile_id)?.slug || req.user_id}` } as any);
    toast.success('Edit request approved');
    reload();
  };

  const rejectEditRequest = async (req: EditRequest) => {
    const response = reviewResponse[req.id] || '';
    if (!response.trim()) { toast.error(t('admin.response_required')); return; }
    await supabase.from('profile_edit_requests').update({ status: 'rejected', admin_response: response, reviewed_at: new Date().toISOString() } as any).eq('id', req.id);
    await supabase.rpc('create_notification', { _user_id: req.user_id, _type: 'edit_rejected', _title: 'Profil değişikliğiniz reddedildi', _message: response, _link: `/humans/${profiles.find(p => p.id === req.profile_id)?.slug || req.user_id}` } as any);
    toast.success('Edit request rejected');
    reload();
  };

  const filteredProfiles = profiles.filter(p => {
    if (profileFilter === 'pending') return !p.approved;
    if (profileFilter === 'approved') return p.approved;
    return true;
  });

  const pendingCount = profiles.filter(p => !p.approved).length;
  const pendingEdits = editRequests.filter(r => r.status === 'pending').length;

  const fieldLabels: Record<string, string> = {
    display_name: t('profile.display_name'), bio: t('profile.bio'), location: t('profile.location'),
    website: t('profile.website'), twitter: 'Twitter', linkedin: 'LinkedIn', instagram: 'Instagram',
    lat: 'Lat', lng: 'Lng',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{profiles.length}</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />{events.length}</span>
            <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{submissions.length}</span>
            {pendingCount > 0 && <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" />{pendingCount} {t('admin.pending')}</Badge>}
            {pendingEdits > 0 && <Badge variant="destructive" className="gap-1"><GitCompare className="w-3 h-3" />{pendingEdits} {t('admin.edit_requests')}</Badge>}
          </div>
        </div>

        <Tabs defaultValue="edit_requests">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="edit_requests" className="gap-1.5">
              <GitCompare className="w-4 h-4" /> {t('admin.edit_requests')}
              {pendingEdits > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{pendingEdits}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="profiles" className="gap-1.5">
              <Users className="w-4 h-4" /> {t('admin.profiles')}
              {pendingCount > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-1.5"><FileText className="w-4 h-4" /> {t('admin.submissions')}</TabsTrigger>
            <TabsTrigger value="markers" className="gap-1.5"><MapPin className="w-4 h-4" /> {t('admin.members')}</TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5"><CalendarDays className="w-4 h-4" /> {t('admin.events')}</TabsTrigger>
          </TabsList>

          {/* Edit Requests Tab */}
          <TabsContent value="edit_requests">
            <div className="space-y-4">
              {editRequests.filter(r => r.status === 'pending').length === 0 && (
                <p className="text-center text-muted-foreground py-8">{t('admin.no_edit_requests')}</p>
              )}
              {editRequests.filter(r => r.status === 'pending').map(req => (
                <Card key={req.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-foreground">{req.profile_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{new Date(req.created_at).toLocaleString()}</span>
                      </div>
                      <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />{t('admin.pending')}</Badge>
                    </div>

                    {/* Diff view */}
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/4">{t('admin.field')}</TableHead>
                            <TableHead className="w-[37.5%]">{t('admin.old_value')}</TableHead>
                            <TableHead className="w-[37.5%]">{t('admin.new_value')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.keys(req.new_data).map(key => (
                            <TableRow key={key}>
                              <TableCell className="font-medium text-sm">{fieldLabels[key] || key}</TableCell>
                              <TableCell className="text-sm text-destructive/80 bg-destructive/5">
                                {String(req.old_data[key] ?? '—')}
                              </TableCell>
                              <TableCell className="text-sm text-primary bg-primary/5">
                                {String(req.new_data[key] ?? '—')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Admin response for rejection */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder={t('admin.reject_reason_placeholder')}
                        value={reviewResponse[req.id] || ''}
                        onChange={e => setReviewResponse(prev => ({ ...prev, [req.id]: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => rejectEditRequest(req)} className="gap-1">
                        <XCircle className="w-4 h-4" /> {t('admin.reject')}
                      </Button>
                      <Button size="sm" onClick={() => approveEditRequest(req)} className="gap-1">
                        <CheckCircle className="w-4 h-4" /> {t('admin.approve')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* History */}
              {editRequests.filter(r => r.status !== 'pending').length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('admin.review_history')}</h3>
                  {editRequests.filter(r => r.status !== 'pending').map(req => (
                    <Card key={req.id} className="mb-2 opacity-60">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{req.profile_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{Object.keys(req.new_data).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {req.admin_response && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />{req.admin_response}
                            </span>
                          )}
                          <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} className="text-xs">
                            {req.status === 'approved' ? t('admin.approved') : t('admin.rejected')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

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
              {filteredProfiles.length === 0 && <p className="text-center text-muted-foreground py-8">No profiles found.</p>}
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
                    <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead><TableHead></TableHead>
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
                        <Button variant="ghost" size="icon" onClick={() => deleteSubmission(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!submissions.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Map Markers Tab */}
          <TabsContent value="markers">
            <Card className="mb-4">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">{t('admin.add_member')}</h3>
                <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Name" />
                <Button variant="outline" size="sm" onClick={() => setShowMemberPicker(!showMemberPicker)} className="gap-1">
                  <MapPin className="w-4 h-4" /> {t('map.pick_location')}
                  {newMemberLat && newMemberLng && <span className="text-xs">({newMemberLat.toFixed(2)}, {newMemberLng.toFixed(2)})</span>}
                </Button>
                {showMemberPicker && (
                  <LocationPicker lat={newMemberLat} lng={newMemberLng} onChange={(lat, lng) => { setNewMemberLat(lat); setNewMemberLng(lng); }} />
                )}
                <Button size="sm" onClick={addUser}><Plus className="w-4 h-4 mr-1" /> {t('admin.add_member')}</Button>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground mb-3">{users.length} {t('admin.anonymous_members')}</p>
            <div className="space-y-2">
              {users.map(u => (
                <Card key={u.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{u.name}</span>
                      <span className="text-xs text-muted-foreground">📍 {u.lat.toFixed(2)}, {u.lng.toFixed(2)}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeUser(u.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="mb-4">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">{t('admin.add_event')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Title" />
                  <Input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                </div>
                <Textarea value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} placeholder="Description" rows={2} />
                <Button variant="outline" size="sm" onClick={() => setShowEventPicker(!showEventPicker)} className="gap-1">
                  <MapPin className="w-4 h-4" /> {t('map.pick_location')}
                  {newEventLat && newEventLng && <span className="text-xs">({newEventLat.toFixed(2)}, {newEventLng.toFixed(2)})</span>}
                </Button>
                {showEventPicker && (
                  <LocationPicker lat={newEventLat} lng={newEventLng} onChange={(lat, lng) => { setNewEventLat(lat); setNewEventLng(lng); }} />
                )}
                <Button size="sm" onClick={addEvent}><Plus className="w-4 h-4 mr-1" /> {t('admin.add_event')}</Button>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground mb-3">{events.length} event(s)</p>
            <div className="space-y-2">
              {events.map(e => (
                <Card key={e.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{e.title}</span>
                      {e.date && <span className="text-xs text-muted-foreground ml-2">📅 {e.date}</span>}
                      <span className="text-xs text-muted-foreground ml-2">📍 {e.lat.toFixed(2)}, {e.lng.toFixed(2)}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeEvent(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
