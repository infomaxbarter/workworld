import { useState, useEffect } from 'react';
import { store, UserMarker, EventMarker, Submission } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Download, Plus, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PASS = 'workworld2026';

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (pass === ADMIN_PASS ? setAuthed(true) : toast.error('Wrong password'))}
            />
            <Button className="w-full" onClick={() => pass === ADMIN_PASS ? setAuthed(true) : toast.error('Wrong password')}>
              Enter
            </Button>
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

  useEffect(() => {
    setSubmissions(store.getSubmissions());
    setUsers(store.getUsers());
    setEvents(store.getEvents());
  }, []);

  const exportCSV = () => {
    const header = 'Name,Email,Message,Date\n';
    const rows = submissions.map(s => `"${s.name}","${s.email}","${s.message}","${s.createdAt}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'submissions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addUser = () => {
    const u: UserMarker = { id: crypto.randomUUID(), name: 'New Member', lat: 0, lng: 0 };
    const updated = [...users, u];
    setUsers(updated);
    store.setUsers(updated);
  };

  const updateUser = (id: string, field: keyof UserMarker, value: string) => {
    const updated = users.map(u => u.id === id ? { ...u, [field]: field === 'lat' || field === 'lng' ? parseFloat(value) || 0 : value } : u);
    setUsers(updated);
    store.setUsers(updated);
  };

  const removeUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    store.setUsers(updated);
  };

  const addEvent = () => {
    const e: EventMarker = { id: crypto.randomUUID(), title: 'New Event', date: '', description: '', lat: 0, lng: 0 };
    const updated = [...events, e];
    setEvents(updated);
    store.setEvents(updated);
  };

  const updateEvent = (id: string, field: keyof EventMarker, value: string) => {
    const updated = events.map(e => e.id === id ? { ...e, [field]: field === 'lat' || field === 'lng' ? parseFloat(value) || 0 : value } : e);
    setEvents(updated);
    store.setEvents(updated);
  };

  const removeEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    store.setEvents(updated);
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
                      <TableCell className="text-muted-foreground text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
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
                      <Input type="date" value={e.date} onChange={ev => updateEvent(e.id, 'date', ev.target.value)} className="w-40" />
                    </div>
                    <Textarea value={e.description} onChange={ev => updateEvent(e.id, 'description', ev.target.value)} placeholder="Description" rows={2} />
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
