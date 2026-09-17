import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ListChecks, Check, X, Ticket } from 'lucide-react';
import { toast } from 'sonner';

type Row = Record<string, any>;

const statuses = ['pending', 'invited', 'accepted', 'rejected'];

const WaitlistAdmin = () => {
  const [lists, setLists] = useState<Row[]>([]);
  const [entries, setEntries] = useState<Row[]>([]);
  const [listFilter, setListFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');

  const load = async () => {
    const [{ data: l }, { data: e }] = await Promise.all([
      (supabase as any).from('waitlist_lists').select('*').order('created_at'),
      (supabase as any).from('waitlist_entries').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setLists(l || []); setEntries(e || []);
  };
  useEffect(() => { load(); }, []);

  const saveList = async (row: Row) => {
    const { id, created_at, updated_at, ...payload } = row;
    const { error } = id
      ? await (supabase as any).from('waitlist_lists').update(payload).eq('id', id)
      : await (supabase as any).from('waitlist_lists').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved'); load();
  };

  const removeRow = async (table: string, id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted'); load();
  };

  const updateEntry = async (id: string, payload: Row) => {
    const { error } = await (supabase as any).from('waitlist_entries').update(payload).eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const invite = async (row: Row) => {
    const code = `WWM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await updateEntry(row.id, { status: 'invited', invite_code: code });
    navigator.clipboard?.writeText(code);
    toast.success(`Invite code ${code} copied`);
  };

  const patchList = (idx: number, key: string, value: any) => {
    const next = [...lists]; next[idx] = { ...next[idx], [key]: value }; setLists(next);
  };

  const filtered = useMemo(() => entries.filter(e =>
    (listFilter === 'all' || e.list_id === listFilter) &&
    (statusFilter === 'all' || e.status === statusFilter) &&
    (!q || `${e.full_name} ${e.email} ${e.profession || ''} ${e.city || ''} ${e.country || ''}`.toLowerCase().includes(q.toLowerCase()))
  ), [entries, listFilter, statusFilter, q]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><ListChecks className="w-4 h-4" /> Waitlists</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setLists([{ name: '', slug: '', mode: 'public', show_counter: true, invite_required: false, active: true, is_default: false }, ...lists])}>
            <Plus className="w-4 h-4 mr-1" /> New list
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lists.map((l, i) => (
            <div key={l.id || `new-${i}`} className="border border-border rounded-md p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-3">
                <Input placeholder="name" value={l.name || ''} onChange={e => patchList(i, 'name', e.target.value)} />
                <Input placeholder="slug" value={l.slug || ''} onChange={e => patchList(i, 'slug', e.target.value)} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={l.mode} onChange={e => patchList(i, 'mode', e.target.value)}>
                  <option value="public">public (viral, shows rank)</option>
                  <option value="private">private (invite only)</option>
                </select>
              </div>
              <Textarea placeholder="description" value={l.description || ''} onChange={e => patchList(i, 'description', e.target.value)} />
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-2"><Switch checked={!!l.show_counter} onCheckedChange={v => patchList(i, 'show_counter', v)} /> Counter</div>
                <div className="flex items-center gap-2"><Switch checked={!!l.invite_required} onCheckedChange={v => patchList(i, 'invite_required', v)} /> Invite required</div>
                <div className="flex items-center gap-2"><Switch checked={!!l.active} onCheckedChange={v => patchList(i, 'active', v)} /> Active</div>
                <div className="flex items-center gap-2"><Switch checked={!!l.is_default} onCheckedChange={v => patchList(i, 'is_default', v)} /> Default</div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" onClick={() => saveList(l)}><Save className="w-4 h-4" /></Button>
                  {l.id && <Button size="sm" variant="destructive" onClick={() => removeRow('waitlist_lists', l.id)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Entries ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Search name, email, city…" value={q} onChange={e => setQ(e.target.value)} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={listFilter} onChange={e => setListFilter(e.target.value)}>
              <option value="all">All lists</option>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            {filtered.map(e => (
              <div key={e.id} className="border border-border rounded-md p-3 flex flex-wrap items-center gap-2 text-sm">
                <div className="min-w-[180px]">
                  <p className="font-medium text-foreground">{e.full_name}</p>
                  <p className="text-xs text-muted-foreground">{e.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{[e.profession, e.city, e.country].filter(Boolean).join(' · ')}</span>
                <Badge variant="secondary">{e.referral_count} refs</Badge>
                {e.invite_code && <Badge variant="outline" className="gap-1"><Ticket className="w-3 h-3" />{e.invite_code}</Badge>}
                <select className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={e.status} onChange={ev => updateEntry(e.id, { status: ev.target.value })}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => invite(e)}><Ticket className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => updateEntry(e.id, { status: 'accepted' })}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => updateEntry(e.id, { status: 'rejected' })}><X className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => removeRow('waitlist_entries', e.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">No entries.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitlistAdmin;
