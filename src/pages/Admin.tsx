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
import { Label } from '@/components/ui/label';
import { Download, Plus, Trash2, ShieldAlert, CheckCircle, XCircle, Clock, Users, CalendarDays, FileText, MapPin, GitCompare, MessageSquare, Edit2, Save, X, Image, Video, Flag, AlertTriangle, Settings, Monitor, Tablet, Smartphone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/LocationPicker';
import { useNavigation, type NavMode, type NavSettings, type DeviceType } from '@/contexts/NavigationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Submission { id: string; name: string; email: string; message: string; created_at: string; }
interface UserMarker { id: string; name: string; lat: number; lng: number; city: string | null; country: string | null; slug: string | null; status: string; }
interface EventMarker { id: string; title: string; date: string | null; start_date: string | null; end_date: string | null; description: string | null; lat: number; lng: number; city: string | null; country: string | null; capacity: number | null; external_url: string | null; slug: string | null; status: string; }
interface GalleryItem { id: string; event_id: string; url: string; type: string; caption: string | null; sort_order: number; }
interface ProfileRow { id: string; user_id: string; display_name: string; bio: string | null; location: string | null; city: string | null; country: string | null; website: string | null; twitter: string | null; linkedin: string | null; instagram: string | null; github: string | null; approved: boolean; slug: string | null; created_at: string; status: string; }
interface EditRequest { id: string; profile_id: string; user_id: string; old_data: Record<string, any>; new_data: Record<string, any>; status: string; admin_response: string | null; created_at: string; reviewed_at: string | null; profile_name?: string; }
interface Report { id: string; type: string; target_id: string; reason: string; created_by: string; created_at: string; }
interface ProfessionRow { id: string; name: string; slug: string | null; description: string | null; icon: string; status: string; created_at: string; }
interface PostRow { id: string; author_id: string; title: string; content: string; slug: string | null; status: string; target_type: string; target_id: string | null; created_at: string; author_name?: string; }
interface CommentRow { id: string; user_id: string; target_type: string; target_id: string; content: string; status: string; created_at: string; author_name?: string; }

const STATUS_OPTIONS = ['active', 'coming_soon', 'inactive'] as const;
type StatusType = typeof STATUS_OPTIONS[number];

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
  if (!authorized) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader><ShieldAlert className="w-10 h-10 mx-auto text-destructive mb-2" /><CardTitle>{t('admin.access_denied')}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">{t('admin.no_privileges')}</p></CardContent>
      </Card>
    </div>
  );

  return <AdminDashboard />;
};

const StatusSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const { t } = useLanguage();
  return (
    <Select value={value || 'active'} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(s => (
          <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  const s = status || 'active';
  if (s === 'coming_soon') return <Badge className="text-xs bg-amber-500/15 text-amber-600 border-amber-500/30">{t('status.coming_soon')}</Badge>;
  if (s === 'inactive') return <Badge variant="secondary" className="text-xs opacity-60">{t('status.inactive')}</Badge>;
  return <Badge className="text-xs bg-emerald-500/15 text-emerald-600 border-emerald-500/30">{t('status.active')}</Badge>;
};

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserMarker[]>([]);
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [professions, setProfessions] = useState<ProfessionRow[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PostRow[]>([]);
  const [pendingComments, setPendingComments] = useState<CommentRow[]>([]);
  const [profileFilter, setProfileFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCity, setNewMemberCity] = useState('');
  const [newMemberCountry, setNewMemberCountry] = useState('');
  const [newMemberLat, setNewMemberLat] = useState<number | null>(null);
  const [newMemberLng, setNewMemberLng] = useState<number | null>(null);
  const [newMemberStatus, setNewMemberStatus] = useState<string>('active');
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const [newEvent, setNewEvent] = useState({ title: '', date: '', start_date: '', end_date: '', description: '', city: '', country: '', capacity: '', external_url: '', status: 'active' });
  const [newEventLat, setNewEventLat] = useState<number | null>(null);
  const [newEventLng, setNewEventLng] = useState<number | null>(null);
  const [showEventPicker, setShowEventPicker] = useState(false);

  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editMemberForm, setEditMemberForm] = useState<Partial<UserMarker>>({});
  const [showEditMemberPicker, setShowEditMemberPicker] = useState(false);

  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editEventForm, setEditEventForm] = useState<Partial<EventMarker>>({});
  const [showEditEventPicker, setShowEditEventPicker] = useState(false);

  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editProfileForm, setEditProfileForm] = useState<Partial<ProfileRow>>({});

  const [reviewResponse, setReviewResponse] = useState<Record<string, string>>({});

  const [galleryEventId, setGalleryEventId] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryType, setNewGalleryType] = useState<'image' | 'video'>('image');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');

  const [newProfName, setNewProfName] = useState('');
  const [newProfDesc, setNewProfDesc] = useState('');
  const [newProfStatus, setNewProfStatus] = useState('active');

  const reload = async () => {
    const [{ data: s }, { data: u }, { data: e }, { data: p }, { data: er }, { data: r }, { data: profs }, { data: posts }, { data: comments }] = await Promise.all([
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('user_markers').select('*'),
      supabase.from('event_markers').select('*'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('profile_edit_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('professions').select('*').order('name'),
      supabase.from('posts').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('comments').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);
    if (s) setSubmissions(s);
    if (u) setUsers(u as unknown as UserMarker[]);
    if (e) setEvents(e as unknown as EventMarker[]);
    if (p) setProfiles(p as unknown as ProfileRow[]);
    if (r) setReports(r as unknown as Report[]);
    if (profs) setProfessions(profs as unknown as ProfessionRow[]);
    if (posts) {
      const postRows = posts as unknown as PostRow[];
      const authorIds = [...new Set(postRows.map(pp => pp.author_id))];
      if (authorIds.length > 0) {
        const { data: prs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', authorIds);
        const nameMap = new Map((prs as any[] || []).map(pr => [pr.user_id, pr.display_name]));
        postRows.forEach(pp => { pp.author_name = nameMap.get(pp.author_id) || '?'; });
      }
      setPendingPosts(postRows);
    }
    if (comments) {
      const commentRows = comments as unknown as CommentRow[];
      const cUserIds = [...new Set(commentRows.map(c => c.user_id))];
      if (cUserIds.length > 0) {
        const { data: prs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', cUserIds);
        const nameMap = new Map((prs as any[] || []).map(pr => [pr.user_id, pr.display_name]));
        commentRows.forEach(c => { c.author_name = nameMap.get(c.user_id) || '?'; });
      }
      setPendingComments(commentRows);
    }
    if (er) {
      const requests = er as unknown as EditRequest[];
      const profileMap = new Map((p as unknown as ProfileRow[])?.map(pr => [pr.id, pr.display_name]) || []);
      requests.forEach(req => { req.profile_name = profileMap.get(req.profile_id) || 'Unknown'; });
      setEditRequests(requests);
    }
  };

  useEffect(() => { reload(); }, []);

  const exportCSV = () => {
    const header = 'Name,Email,Message,Date\n';
    const rows = submissions.map(s => `"${s.name}","${s.email}","${s.message}","${s.created_at}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'submissions.csv'; a.click();
    URL.revokeObjectURL(url);
  };
  const deleteSubmission = async (id: string) => { await supabase.from('submissions').delete().eq('id', id); setSubmissions(prev => prev.filter(s => s.id !== id)); };

  const approveProfile = async (userId: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('user_id', userId);
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, approved: true } : p));
    await supabase.rpc('create_notification', { _user_id: userId, _type: 'approval', _title: 'Profiliniz onaylandı! 🎉', _message: 'Profiliniz artık topluluk sayfasında görünüyor.', _link: '/humans' } as any);
    toast.success('Profile approved');
  };
  const rejectProfile = async (userId: string) => { await supabase.from('profiles').update({ approved: false }).eq('user_id', userId); setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, approved: false } : p)); toast.success('Profile rejected'); };
  const deleteProfile = async (id: string) => { await supabase.from('profiles').delete().eq('id', id); setProfiles(prev => prev.filter(p => p.id !== id)); };
  const startEditProfile = (p: ProfileRow) => { setEditingProfile(p.id); setEditProfileForm(p); };
  const saveProfile = async () => {
    if (!editingProfile) return;
    const f = editProfileForm;
    await supabase.from('profiles').update({ display_name: f.display_name || '', bio: f.bio, location: f.location, city: f.city, country: f.country, website: f.website, twitter: f.twitter, linkedin: f.linkedin, instagram: f.instagram, github: f.github, status: f.status || 'active' } as any).eq('id', editingProfile);
    setEditingProfile(null); toast.success('Profile updated'); reload();
  };

  const updateProfileStatus = async (id: string, status: string) => {
    await supabase.from('profiles').update({ status } as any).eq('id', id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast.success(`Status: ${status}`);
  };

  const addUser = async () => {
    if (!newMemberName.trim()) { toast.error('Name required'); return; }
    await supabase.from('user_markers').insert({ name: newMemberName, lat: newMemberLat || 0, lng: newMemberLng || 0, city: newMemberCity || null, country: newMemberCountry || null, status: newMemberStatus } as any);
    setNewMemberName(''); setNewMemberCity(''); setNewMemberCountry(''); setNewMemberLat(null); setNewMemberLng(null); setNewMemberStatus('active'); setShowMemberPicker(false);
    reload();
  };
  const removeUser = async (id: string) => { await supabase.from('user_markers').delete().eq('id', id); setUsers(prev => prev.filter(u => u.id !== id)); };
  const startEditMember = (u: UserMarker) => { setEditingMember(u.id); setEditMemberForm(u); setShowEditMemberPicker(false); };
  const saveMember = async () => {
    if (!editingMember) return;
    await supabase.from('user_markers').update({ name: editMemberForm.name || '', lat: editMemberForm.lat || 0, lng: editMemberForm.lng || 0, city: (editMemberForm as any).city || null, country: (editMemberForm as any).country || null, status: editMemberForm.status || 'active' } as any).eq('id', editingMember);
    setEditingMember(null); setShowEditMemberPicker(false); toast.success('Member updated'); reload();
  };

  const addEvent = async () => {
    if (!newEvent.title.trim()) { toast.error('Title required'); return; }
    await supabase.from('event_markers').insert({
      title: newEvent.title, date: newEvent.date || null, start_date: newEvent.start_date || null, end_date: newEvent.end_date || null,
      description: newEvent.description || null, lat: newEventLat || 0, lng: newEventLng || 0,
      city: newEvent.city || null, country: newEvent.country || null,
      capacity: newEvent.capacity ? parseInt(newEvent.capacity) : null, external_url: newEvent.external_url || null,
      status: newEvent.status || 'active',
    } as any);
    setNewEvent({ title: '', date: '', start_date: '', end_date: '', description: '', city: '', country: '', capacity: '', external_url: '', status: 'active' });
    setNewEventLat(null); setNewEventLng(null); setShowEventPicker(false); reload();
  };
  const removeEvent = async (id: string) => { await supabase.from('event_markers').delete().eq('id', id); setEvents(prev => prev.filter(e => e.id !== id)); };
  const startEditEvent = (e: EventMarker) => { setEditingEvent(e.id); setEditEventForm(e); setShowEditEventPicker(false); };
  const saveEvent = async () => {
    if (!editingEvent) return;
    const f = editEventForm;
    await supabase.from('event_markers').update({
      title: f.title || '', date: f.date || null, start_date: (f as any).start_date || null, end_date: (f as any).end_date || null,
      description: f.description || null, lat: f.lat || 0, lng: f.lng || 0,
      city: (f as any).city || null, country: (f as any).country || null,
      capacity: (f as any).capacity || null, external_url: (f as any).external_url || null,
      status: f.status || 'active',
    } as any).eq('id', editingEvent);
    setEditingEvent(null); setShowEditEventPicker(false); toast.success('Event updated'); reload();
  };

  const openGallery = async (eventId: string) => {
    setGalleryEventId(eventId);
    const { data } = await supabase.from('event_gallery').select('*').eq('event_id', eventId).order('sort_order');
    if (data) setGalleryItems(data as unknown as GalleryItem[]);
  };
  const addGalleryItem = async () => {
    if (!newGalleryUrl.trim() || !galleryEventId) return;
    await supabase.from('event_gallery').insert({ event_id: galleryEventId, url: newGalleryUrl, type: newGalleryType, caption: newGalleryCaption || null, sort_order: galleryItems.length } as any);
    setNewGalleryUrl(''); setNewGalleryCaption('');
    openGallery(galleryEventId);
  };
  const removeGalleryItem = async (id: string) => {
    await supabase.from('event_gallery').delete().eq('id', id);
    setGalleryItems(prev => prev.filter(g => g.id !== id));
  };

  const approveEditRequest = async (req: EditRequest) => {
    await supabase.from('profiles').update(req.new_data as any).eq('id', req.profile_id);
    await supabase.from('profile_edit_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() } as any).eq('id', req.id);
    await supabase.rpc('create_notification', { _user_id: req.user_id, _type: 'edit_approved', _title: 'Profil değişikliğiniz onaylandı ✅', _message: `${Object.keys(req.new_data).join(', ')} alanları güncellendi.`, _link: `/humans/${profiles.find(p => p.id === req.profile_id)?.slug || req.user_id}` } as any);
    toast.success('Approved'); reload();
  };
  const rejectEditRequest = async (req: EditRequest) => {
    const response = reviewResponse[req.id] || '';
    if (!response.trim()) { toast.error(t('admin.response_required')); return; }
    await supabase.from('profile_edit_requests').update({ status: 'rejected', admin_response: response, reviewed_at: new Date().toISOString() } as any).eq('id', req.id);
    await supabase.rpc('create_notification', { _user_id: req.user_id, _type: 'edit_rejected', _title: 'Profil değişikliğiniz reddedildi', _message: response, _link: `/humans/${profiles.find(p => p.id === req.profile_id)?.slug || req.user_id}` } as any);
    toast.success('Rejected'); reload();
  };

  const deleteReport = async (id: string) => {
    await supabase.from('reports').delete().eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
    toast.success('Report dismissed');
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
    website: t('profile.website'), twitter: 'Twitter', linkedin: 'LinkedIn', instagram: 'Instagram', github: 'GitHub', lat: 'Lat', lng: 'Lng', city: t('admin.city'), country: t('admin.country'),
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-3 text-center"><Users className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-xl font-bold text-foreground">{profiles.length}</p><p className="text-xs text-muted-foreground">{t('admin.profiles')}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><CalendarDays className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-xl font-bold text-foreground">{events.length}</p><p className="text-xs text-muted-foreground">{t('admin.events')}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><FileText className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-xl font-bold text-foreground">{submissions.length}</p><p className="text-xs text-muted-foreground">{t('admin.submissions')}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" /><p className="text-xl font-bold text-foreground">{reports.length}</p><p className="text-xs text-muted-foreground">{t('admin.reports')}</p></CardContent></Card>
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
            <TabsTrigger value="reports" className="gap-1.5">
              <Flag className="w-4 h-4" /> {t('admin.reports')}
              {reports.length > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-1.5"><FileText className="w-4 h-4" /> {t('admin.submissions')}</TabsTrigger>
            <TabsTrigger value="markers" className="gap-1.5"><MapPin className="w-4 h-4" /> {t('admin.members')}</TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5"><CalendarDays className="w-4 h-4" /> {t('admin.events')}</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" /> {t('admin.settings')}</TabsTrigger>
          </TabsList>

          {/* Edit Requests */}
          <TabsContent value="edit_requests">
            <div className="space-y-4">
              {editRequests.filter(r => r.status === 'pending').length === 0 && <p className="text-center text-muted-foreground py-8">{t('admin.no_edit_requests')}</p>}
              {editRequests.filter(r => r.status === 'pending').map(req => (
                <Card key={req.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div><span className="font-semibold text-foreground">{req.profile_name}</span><span className="text-xs text-muted-foreground ml-2">{new Date(req.created_at).toLocaleString()}</span></div>
                      <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />{t('admin.pending')}</Badge>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-1/4">{t('admin.field')}</TableHead><TableHead className="w-[37.5%]">{t('admin.old_value')}</TableHead><TableHead className="w-[37.5%]">{t('admin.new_value')}</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {Object.keys(req.new_data).map(key => (
                            <TableRow key={key}>
                              <TableCell className="font-medium text-sm">{fieldLabels[key] || key}</TableCell>
                              <TableCell className="text-sm text-destructive/80 bg-destructive/5">{String(req.old_data[key] ?? '—')}</TableCell>
                              <TableCell className="text-sm text-primary bg-primary/5">{String(req.new_data[key] ?? '—')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Textarea placeholder={t('admin.reject_reason_placeholder')} value={reviewResponse[req.id] || ''} onChange={e => setReviewResponse(prev => ({ ...prev, [req.id]: e.target.value }))} rows={2} />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => rejectEditRequest(req)} className="gap-1"><XCircle className="w-4 h-4" /> {t('admin.reject')}</Button>
                      <Button size="sm" onClick={() => approveEditRequest(req)} className="gap-1"><CheckCircle className="w-4 h-4" /> {t('admin.approve')}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {editRequests.filter(r => r.status !== 'pending').length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('admin.review_history')}</h3>
                  {editRequests.filter(r => r.status !== 'pending').map(req => (
                    <Card key={req.id} className="mb-2 opacity-60">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div><span className="text-sm font-medium">{req.profile_name}</span><span className="text-xs text-muted-foreground ml-2">{Object.keys(req.new_data).join(', ')}</span></div>
                        <div className="flex items-center gap-2">
                          {req.admin_response && <span className="text-xs text-muted-foreground max-w-[200px] truncate flex items-center gap-1"><MessageSquare className="w-3 h-3" />{req.admin_response}</span>}
                          <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} className="text-xs">{req.status === 'approved' ? t('admin.approved') : t('admin.rejected')}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            {reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('admin.no_reports')}</p>
            ) : (
              <div className="space-y-3">
                {reports.map(r => (
                  <Card key={r.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{r.type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-foreground">{r.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">Target: {r.target_id.substring(0, 8)}...</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteReport(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profiles */}
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
                  <CardContent className="p-4">
                    {editingProfile === p.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>{t('profile.display_name')}</Label><Input value={editProfileForm.display_name || ''} onChange={e => setEditProfileForm({ ...editProfileForm, display_name: e.target.value })} /></div>
                          <div className="space-y-1"><Label>{t('profile.location')}</Label><Input value={editProfileForm.location || ''} onChange={e => setEditProfileForm({ ...editProfileForm, location: e.target.value })} /></div>
                          <div className="space-y-1"><Label>{t('admin.city')}</Label><Input value={editProfileForm.city || ''} onChange={e => setEditProfileForm({ ...editProfileForm, city: e.target.value })} /></div>
                          <div className="space-y-1"><Label>{t('admin.country')}</Label><Input value={editProfileForm.country || ''} onChange={e => setEditProfileForm({ ...editProfileForm, country: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1"><Label>{t('profile.bio')}</Label><Textarea value={editProfileForm.bio || ''} onChange={e => setEditProfileForm({ ...editProfileForm, bio: e.target.value })} rows={2} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>{t('profile.website')}</Label><Input value={editProfileForm.website || ''} onChange={e => setEditProfileForm({ ...editProfileForm, website: e.target.value })} /></div>
                          <div className="space-y-1"><Label>GitHub</Label><Input value={editProfileForm.github || ''} onChange={e => setEditProfileForm({ ...editProfileForm, github: e.target.value })} /></div>
                          <div className="space-y-1"><Label>Twitter</Label><Input value={editProfileForm.twitter || ''} onChange={e => setEditProfileForm({ ...editProfileForm, twitter: e.target.value })} /></div>
                          <div className="space-y-1"><Label>LinkedIn</Label><Input value={editProfileForm.linkedin || ''} onChange={e => setEditProfileForm({ ...editProfileForm, linkedin: e.target.value })} /></div>
                          <div className="space-y-1"><Label>Instagram</Label><Input value={editProfileForm.instagram || ''} onChange={e => setEditProfileForm({ ...editProfileForm, instagram: e.target.value })} /></div>
                          <div className="space-y-1"><Label>{t('admin.status')}</Label><StatusSelect value={editProfileForm.status || 'active'} onChange={v => setEditProfileForm({ ...editProfileForm, status: v })} /></div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingProfile(null)} className="gap-1"><X className="w-4 h-4" />{t('profile.cancel')}</Button>
                          <Button size="sm" onClick={saveProfile} className="gap-1"><Save className="w-4 h-4" />{t('profile.save')}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground truncate">{p.display_name || '(unnamed)'}</span>
                            {p.approved ? <Badge variant="default" className="gap-1 text-xs"><CheckCircle className="w-3 h-3" />{t('admin.approved')}</Badge> : <Badge variant="secondary" className="gap-1 text-xs"><Clock className="w-3 h-3" />{t('admin.pending')}</Badge>}
                            <StatusBadge status={p.status} />
                          </div>
                          {(p.city || p.country) && <p className="text-xs text-muted-foreground">📍 {[p.city, p.country].filter(Boolean).join(', ')}</p>}
                          {p.bio && <p className="text-xs text-muted-foreground truncate max-w-md">{p.bio}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => startEditProfile(p)}><Edit2 className="w-4 h-4" /></Button>
                          {!p.approved && <Button size="sm" onClick={() => approveProfile(p.user_id)} className="gap-1"><CheckCircle className="w-4 h-4" />{t('admin.approve')}</Button>}
                          {p.approved && <Button variant="outline" size="sm" onClick={() => rejectProfile(p.user_id)} className="gap-1"><XCircle className="w-4 h-4" />{t('admin.reject')}</Button>}
                          <Button variant="ghost" size="icon" onClick={() => deleteProfile(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredProfiles.length === 0 && <p className="text-center text-muted-foreground py-8">No profiles found.</p>}
            </div>
          </TabsContent>

          {/* Submissions */}
          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{submissions.length} submission(s)</p>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!submissions.length}><Download className="w-4 h-4 mr-1" /> {t('admin.export_csv')}</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {submissions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.message}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteSubmission(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {!submissions.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Members (Anonymous) */}
          <TabsContent value="markers">
            <Card className="mb-4">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">{t('admin.add_member')}</h3>
                <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Name" />
                <div className="grid grid-cols-2 gap-3">
                  <Input value={newMemberCity} onChange={e => setNewMemberCity(e.target.value)} placeholder={t('admin.city')} />
                  <Input value={newMemberCountry} onChange={e => setNewMemberCountry(e.target.value)} placeholder={t('admin.country')} />
                </div>
                <div className="space-y-1">
                  <Label>{t('admin.status')}</Label>
                  <StatusSelect value={newMemberStatus} onChange={setNewMemberStatus} />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowMemberPicker(!showMemberPicker)} className="gap-1">
                  <MapPin className="w-4 h-4" /> {t('map.pick_location')}
                  {newMemberLat != null && newMemberLng != null && <span className="text-xs">({newMemberLat.toFixed(2)}, {newMemberLng.toFixed(2)})</span>}
                </Button>
                {showMemberPicker && <LocationPicker lat={newMemberLat} lng={newMemberLng} onChange={(lat, lng) => { setNewMemberLat(lat); setNewMemberLng(lng); }} />}
                <Button size="sm" onClick={addUser}><Plus className="w-4 h-4 mr-1" /> {t('admin.add_member')}</Button>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mb-3">{users.length} {t('admin.anonymous_members')}</p>
            <div className="space-y-3">
              {users.map(u => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    {editingMember === u.id ? (
                      <div className="space-y-3">
                        <div className="space-y-1"><Label>Name</Label><Input value={editMemberForm.name || ''} onChange={e => setEditMemberForm({ ...editMemberForm, name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>{t('admin.city')}</Label><Input value={(editMemberForm as any).city || ''} onChange={e => setEditMemberForm({ ...editMemberForm, city: e.target.value } as any)} /></div>
                          <div className="space-y-1"><Label>{t('admin.country')}</Label><Input value={(editMemberForm as any).country || ''} onChange={e => setEditMemberForm({ ...editMemberForm, country: e.target.value } as any)} /></div>
                        </div>
                        <div className="space-y-1"><Label>{t('admin.status')}</Label><StatusSelect value={editMemberForm.status || 'active'} onChange={v => setEditMemberForm({ ...editMemberForm, status: v })} /></div>
                        <Button variant="outline" size="sm" onClick={() => setShowEditMemberPicker(!showEditMemberPicker)} className="gap-1">
                          <MapPin className="w-4 h-4" /> {t('map.pick_location')}
                          {editMemberForm.lat != null && editMemberForm.lng != null && <span className="text-xs">({editMemberForm.lat.toFixed(2)}, {editMemberForm.lng.toFixed(2)})</span>}
                        </Button>
                        {showEditMemberPicker && <LocationPicker lat={editMemberForm.lat ?? null} lng={editMemberForm.lng ?? null} onChange={(lat, lng) => setEditMemberForm({ ...editMemberForm, lat, lng })} />}
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingMember(null)} className="gap-1"><X className="w-4 h-4" />{t('profile.cancel')}</Button>
                          <Button size="sm" onClick={saveMember} className="gap-1"><Save className="w-4 h-4" />{t('profile.save')}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{u.name}</span>
                          <StatusBadge status={u.status} />
                          <span className="text-xs text-muted-foreground">📍 {u.city && u.country ? `${u.city}, ${u.country}` : `${u.lat.toFixed(2)}, ${u.lng.toFixed(2)}`}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEditMember(u)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => removeUser(u.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <Card className="mb-4">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">{t('admin.add_event')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Title" />
                  <Input value={newEvent.external_url} onChange={e => setNewEvent({ ...newEvent, external_url: e.target.value })} placeholder="External URL (optional)" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>{t('event.start')}</Label><Input type="date" value={newEvent.start_date} onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })} /></div>
                  <div className="space-y-1"><Label>{t('event.end')}</Label><Input type="date" value={newEvent.end_date} onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })} /></div>
                  <div className="space-y-1"><Label>{t('event.capacity')}</Label><Input type="number" value={newEvent.capacity} onChange={e => setNewEvent({ ...newEvent, capacity: e.target.value })} placeholder="0 = unlimited" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input value={newEvent.city} onChange={e => setNewEvent({ ...newEvent, city: e.target.value })} placeholder={t('admin.city')} />
                  <Input value={newEvent.country} onChange={e => setNewEvent({ ...newEvent, country: e.target.value })} placeholder={t('admin.country')} />
                </div>
                <div className="space-y-1">
                  <Label>{t('admin.status')}</Label>
                  <StatusSelect value={newEvent.status} onChange={v => setNewEvent({ ...newEvent, status: v })} />
                </div>
                <Textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Description" rows={2} />
                <Button variant="outline" size="sm" onClick={() => setShowEventPicker(!showEventPicker)} className="gap-1">
                  <MapPin className="w-4 h-4" /> {t('map.pick_location')}
                  {newEventLat != null && newEventLng != null && <span className="text-xs">({newEventLat.toFixed(2)}, {newEventLng.toFixed(2)})</span>}
                </Button>
                {showEventPicker && <LocationPicker lat={newEventLat} lng={newEventLng} onChange={(lat, lng) => { setNewEventLat(lat); setNewEventLng(lng); }} />}
                <Button size="sm" onClick={addEvent}><Plus className="w-4 h-4 mr-1" /> {t('admin.add_event')}</Button>
              </CardContent>
            </Card>

            {galleryEventId && (
              <Card className="mb-4 border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><Image className="w-4 h-4" /> {t('event.gallery')} — {events.find(e => e.id === galleryEventId)?.title}</h3>
                    <Button variant="ghost" size="icon" onClick={() => setGalleryEventId(null)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={newGalleryUrl} onChange={e => setNewGalleryUrl(e.target.value)} placeholder="URL (image or video)" className="flex-1" />
                    <select value={newGalleryType} onChange={e => setNewGalleryType(e.target.value as any)} className="px-2 py-1 border border-border rounded text-sm bg-background text-foreground">
                      <option value="image">📷 Image</option>
                      <option value="video">🎬 Video</option>
                    </select>
                  </div>
                  <Input value={newGalleryCaption} onChange={e => setNewGalleryCaption(e.target.value)} placeholder="Caption (optional)" />
                  <Button size="sm" onClick={addGalleryItem}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                  {galleryItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {galleryItems.map(g => (
                        <div key={g.id} className="relative group">
                          {g.type === 'image' ? (
                            <img src={g.url} alt={g.caption || ''} className="w-full aspect-video object-cover rounded border border-border" />
                          ) : (
                            <div className="w-full aspect-video bg-muted rounded border border-border flex items-center justify-center text-muted-foreground text-xs"><Video className="w-5 h-5" /></div>
                          )}
                          <button onClick={() => removeGalleryItem(g.id)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-muted-foreground mb-3">{events.length} event(s)</p>
            <div className="space-y-3">
              {events.map(e => (
                <Card key={e.id}>
                  <CardContent className="p-4">
                    {editingEvent === e.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>Title</Label><Input value={editEventForm.title || ''} onChange={ev => setEditEventForm({ ...editEventForm, title: ev.target.value })} /></div>
                          <div className="space-y-1"><Label>External URL</Label><Input value={(editEventForm as any).external_url || ''} onChange={ev => setEditEventForm({ ...editEventForm, external_url: ev.target.value } as any)} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1"><Label>{t('event.start')}</Label><Input type="date" value={(editEventForm as any).start_date || ''} onChange={ev => setEditEventForm({ ...editEventForm, start_date: ev.target.value } as any)} /></div>
                          <div className="space-y-1"><Label>{t('event.end')}</Label><Input type="date" value={(editEventForm as any).end_date || ''} onChange={ev => setEditEventForm({ ...editEventForm, end_date: ev.target.value } as any)} /></div>
                          <div className="space-y-1"><Label>{t('event.capacity')}</Label><Input type="number" value={(editEventForm as any).capacity || ''} onChange={ev => setEditEventForm({ ...editEventForm, capacity: ev.target.value ? parseInt(ev.target.value) : null } as any)} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>{t('admin.city')}</Label><Input value={(editEventForm as any).city || ''} onChange={ev => setEditEventForm({ ...editEventForm, city: ev.target.value } as any)} /></div>
                          <div className="space-y-1"><Label>{t('admin.country')}</Label><Input value={(editEventForm as any).country || ''} onChange={ev => setEditEventForm({ ...editEventForm, country: ev.target.value } as any)} /></div>
                        </div>
                        <div className="space-y-1"><Label>{t('admin.status')}</Label><StatusSelect value={editEventForm.status || 'active'} onChange={v => setEditEventForm({ ...editEventForm, status: v })} /></div>
                        <div className="space-y-1"><Label>Description</Label><Textarea value={editEventForm.description || ''} onChange={ev => setEditEventForm({ ...editEventForm, description: ev.target.value })} rows={3} /></div>
                        <Button variant="outline" size="sm" onClick={() => setShowEditEventPicker(!showEditEventPicker)} className="gap-1">
                          <MapPin className="w-4 h-4" /> {t('map.pick_location')}
                          {editEventForm.lat != null && editEventForm.lng != null && <span className="text-xs">({editEventForm.lat.toFixed(2)}, {editEventForm.lng.toFixed(2)})</span>}
                        </Button>
                        {showEditEventPicker && <LocationPicker lat={editEventForm.lat ?? null} lng={editEventForm.lng ?? null} onChange={(lat, lng) => setEditEventForm({ ...editEventForm, lat, lng })} />}
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingEvent(null)} className="gap-1"><X className="w-4 h-4" />{t('profile.cancel')}</Button>
                          <Button size="sm" onClick={saveEvent} className="gap-1"><Save className="w-4 h-4" />{t('profile.save')}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{e.title}</span>
                            <StatusBadge status={e.status} />
                          </div>
                          {(e.start_date || e.date) && <span className="text-xs text-muted-foreground ml-0">📅 {e.start_date || e.date}{e.end_date ? ` — ${e.end_date}` : ''}</span>}
                          <span className="text-xs text-muted-foreground ml-2">📍 {e.city && e.country ? `${e.city}, ${e.country}` : `${e.lat.toFixed(2)}, ${e.lng.toFixed(2)}`}</span>
                          {e.capacity && <span className="text-xs text-muted-foreground ml-2">👥 {e.capacity}</span>}
                          {e.description && <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{e.description}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openGallery(e.id)} title="Gallery"><Image className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => startEditEvent(e)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => removeEvent(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Navigation Settings */}
          <TabsContent value="settings">
            <NavSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const NavSettingsPanel = () => {
  const { t } = useLanguage();
  const { settings, updateSettings } = useNavigation();

  const devices: { key: DeviceType; icon: any; label: string }[] = [
    { key: 'desktop', icon: Monitor, label: t('admin.nav_desktop') },
    { key: 'tablet', icon: Tablet, label: t('admin.nav_tablet') },
    { key: 'mobile', icon: Smartphone, label: t('admin.nav_mobile') },
  ];

  const modeLabels: Record<NavMode, string> = {
    header: t('admin.nav_mode_header'),
    sidebar: t('admin.nav_mode_sidebar'),
    mega: t('admin.nav_mode_mega'),
  };

  const handleChange = (device: DeviceType, mode: NavMode) => {
    updateSettings({ ...settings, [device]: mode });
    toast.success(`${devices.find(d => d.key === device)?.label}: ${modeLabels[mode]}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('admin.nav_settings_title')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('admin.nav_settings_desc')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {devices.map(({ key, icon: Icon, label }) => (
          <Card key={key}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm text-foreground">{label}</span>
              </div>
              <Select value={settings[key]} onValueChange={(v) => handleChange(key, v as NavMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">{modeLabels.header}</SelectItem>
                  <SelectItem value="sidebar">{modeLabels.sidebar}</SelectItem>
                  <SelectItem value="mega">{modeLabels.mega}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t(`admin.nav_mode_${settings[key]}_desc`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Admin;
