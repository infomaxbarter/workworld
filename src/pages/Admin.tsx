import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Download, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Submission { id: string; name: string; email: string; message: string; created_at: string; }
interface UserMarker { id: string; name: string; lat: number; lng: number; }
interface EventMarker { id: string; title: string; date: string | null; description: string | null; lat: number; lng: number; }

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin');
      if (data && data.length > 0) {
        setAuthorized(true);
      }
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
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">You don't have admin privileges.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
};

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserMarker[]>([]);
  const [events, setEvents] = useState<EventMarker[]>([]);

  const reload = async () => {
    const [{ data: s }, { data: u }, { data: e }] = await Promise.all([
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('user_markers').select('*'),
      supabase.from('event_markers').select('*'),
    ]);
    if (s) setSubmissions(s);
    if (u) setUsers(u);
    if (e) setEvents(e);
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

  const addUser = async () => {
    const { error } = await supabase.from('user_markers').insert({ name: 'New Member', lat: 0, lng: 0 });
    if (error) toast.error('Failed to add member');
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

  const addEvent = async () => {
    const { error } = await supabase.from('event_markers').insert({ title: 'New Event', lat: 0, lng: 0 });
    if (error) toast.error('Failed to add event');
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Admin Panel</h1>

        <Tabs defaultValue="submissions">
          <TabsList className="mb-4">
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="users">Map Data</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{submissions.length} submission(s)</p>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!submissions.length}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.message}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {!submissions.length && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No submissions yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{users.length} member(s)</p>
              <Button size="sm" onClick={addUser}><Plus className="w-4 h-4 mr-1" /> Add Member</Button>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <Card key={u.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <Input value={u.name} onChange={e => updateUser(u.id, 'name', e.target.value)} placeholder="Name" className="flex-1" />
                    <Input value={u.lat} onChange={e => updateUser(u.id, 'lat', e.target.value)} placeholder="Latitude" className="w-28" />
                    <Input value={u.lng} onChange={e => updateUser(u.id, 'lng', e.target.value)} placeholder="Longitude" className="w-28" />
                    <Button variant="ghost" size="icon" onClick={() => removeUser(u.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{events.length} event(s)</p>
              <Button size="sm" onClick={addEvent}><Plus className="w-4 h-4 mr-1" /> Add Event</Button>
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
