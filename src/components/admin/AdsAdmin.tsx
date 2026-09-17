import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Megaphone, LayoutTemplate, Eye, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';

type Row = Record<string, any>;

const AdsAdmin = () => {
  const [slots, setSlots] = useState<Row[]>([]);
  const [creatives, setCreatives] = useState<Row[]>([]);

  const load = async () => {
    const [{ data: s }, { data: c }] = await Promise.all([
      (supabase as any).from('ad_slots').select('*').order('code'),
      (supabase as any).from('ad_creatives').select('*').order('created_at', { ascending: false }),
    ]);
    setSlots(s || []); setCreatives(c || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (table: string, row: Row) => {
    const { id, created_at, updated_at, impressions, clicks, ...payload } = row;
    const { error } = id
      ? await (supabase as any).from(table).update(payload).eq('id', id)
      : await (supabase as any).from(table).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved'); load();
  };

  const remove = async (table: string, id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted'); load();
  };

  const patch = (list: Row[], setList: (r: Row[]) => void, idx: number, key: string, value: any) => {
    const next = [...list]; next[idx] = { ...next[idx], [key]: value }; setList(next);
  };

  const totalImp = creatives.reduce((a, c) => a + Number(c.impressions || 0), 0);
  const totalClicks = creatives.reduce((a, c) => a + Number(c.clicks || 0), 0);
  const ctr = totalImp ? ((totalClicks / totalImp) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center"><Eye className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{totalImp}</p><p className="text-xs text-muted-foreground">Impressions</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><MousePointerClick className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{totalClicks}</p><p className="text-xs text-muted-foreground">Clicks</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><Megaphone className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{ctr}%</p><p className="text-xs text-muted-foreground">CTR</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Ad slots</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setSlots([{ code: '', name: '', placement: 'inline', page_key: 'home', active: true }, ...slots])}>
            <Plus className="w-4 h-4 mr-1" /> New slot
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {slots.map((s, i) => (
            <div key={s.id || `new-${i}`} className="grid gap-2 md:grid-cols-6 items-center border border-border rounded-md p-3">
              <Input placeholder="code" value={s.code || ''} onChange={e => patch(slots, setSlots, i, 'code', e.target.value)} />
              <Input placeholder="name" value={s.name || ''} onChange={e => patch(slots, setSlots, i, 'name', e.target.value)} />
              <Input placeholder="placement" value={s.placement || ''} onChange={e => patch(slots, setSlots, i, 'placement', e.target.value)} />
              <Input placeholder="page key" value={s.page_key || ''} onChange={e => patch(slots, setSlots, i, 'page_key', e.target.value)} />
              <div className="flex items-center gap-2 text-sm">
                <Switch checked={!!s.active} onCheckedChange={v => patch(slots, setSlots, i, 'active', v)} /> Active
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={() => save('ad_slots', s)}><Save className="w-4 h-4" /></Button>
                {s.id && <Button size="sm" variant="destructive" onClick={() => remove('ad_slots', s.id)}><Trash2 className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4" /> Campaigns</CardTitle>
          <Button size="sm" variant="outline" disabled={!slots.length}
            onClick={() => setCreatives([{ slot_id: slots[0]?.id, title: '', weight: 1, active: true }, ...creatives])}>
            <Plus className="w-4 h-4 mr-1" /> New campaign
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {creatives.map((c, i) => (
            <div key={c.id || `new-${i}`} className="border border-border rounded-md p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-4">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={c.slot_id || ''} onChange={e => patch(creatives, setCreatives, i, 'slot_id', e.target.value)}>
                  {slots.map(s => <option key={s.id} value={s.id}>{s.name || s.code}</option>)}
                </select>
                <Input placeholder="title" value={c.title || ''} onChange={e => patch(creatives, setCreatives, i, 'title', e.target.value)} />
                <Input placeholder="advertiser" value={c.advertiser || ''} onChange={e => patch(creatives, setCreatives, i, 'advertiser', e.target.value)} />
                <Input placeholder="CTA label" value={c.cta_label || ''} onChange={e => patch(creatives, setCreatives, i, 'cta_label', e.target.value)} />
              </div>
              <Textarea placeholder="body" value={c.body || ''} onChange={e => patch(creatives, setCreatives, i, 'body', e.target.value)} />
              <div className="grid gap-2 md:grid-cols-4">
                <Input placeholder="image url" value={c.image_url || ''} onChange={e => patch(creatives, setCreatives, i, 'image_url', e.target.value)} />
                <Input placeholder="link url" value={c.link_url || ''} onChange={e => patch(creatives, setCreatives, i, 'link_url', e.target.value)} />
                <Input type="date" value={c.starts_at || ''} onChange={e => patch(creatives, setCreatives, i, 'starts_at', e.target.value || null)} />
                <Input type="date" value={c.ends_at || ''} onChange={e => patch(creatives, setCreatives, i, 'ends_at', e.target.value || null)} />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  Weight <Input type="number" className="w-20" value={c.weight ?? 1} onChange={e => patch(creatives, setCreatives, i, 'weight', Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Switch checked={!!c.active} onCheckedChange={v => patch(creatives, setCreatives, i, 'active', v)} /> Active
                </div>
                <Badge variant="secondary">{c.impressions || 0} views</Badge>
                <Badge variant="secondary">{c.clicks || 0} clicks</Badge>
                <Badge variant="outline">
                  CTR {c.impressions ? ((Number(c.clicks || 0) / Number(c.impressions)) * 100).toFixed(2) : '0.00'}%
                </Badge>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" onClick={() => save('ad_creatives', c)}><Save className="w-4 h-4" /></Button>
                  {c.id && <Button size="sm" variant="destructive" onClick={() => remove('ad_creatives', c.id)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsAdmin;
