import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, HelpCircle, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type Row = Record<string, any>;

const FaqAdmin = () => {
  const [faqs, setFaqs] = useState<Row[]>([]);
  const [beta, setBeta] = useState<Row>({ enabled: true, label: 'BETA | EARLY ACCESS' });
  const [chatbot, setChatbot] = useState<Row>({ enabled: true, greeting: '' });

  const load = async () => {
    const [{ data: f }, { data: s }] = await Promise.all([
      (supabase as any).from('faq_items').select('*').order('sort_order'),
      (supabase as any).from('site_settings').select('key, value').in('key', ['beta_mode', 'chatbot']),
    ]);
    setFaqs(f || []);
    for (const row of s || []) {
      if (row.key === 'beta_mode') setBeta(row.value || {});
      if (row.key === 'chatbot') setChatbot(row.value || {});
    }
  };
  useEffect(() => { load(); }, []);

  const saveSetting = async (key: string, value: Row) => {
    const { error } = await (supabase as any).from('site_settings').upsert({ key, value }, { onConflict: 'key' });
    if (error) { toast.error(error.message); return; }
    toast.success('Saved');
  };

  const saveFaq = async (row: Row) => {
    const { id, created_at, updated_at, ...payload } = row;
    if (typeof payload.keywords === 'string') {
      payload.keywords = payload.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    const { error } = id
      ? await (supabase as any).from('faq_items').update(payload).eq('id', id)
      : await (supabase as any).from('faq_items').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved'); load();
  };

  const removeFaq = async (id: string) => {
    const { error } = await (supabase as any).from('faq_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted'); load();
  };

  const patch = (i: number, key: string, value: any) => {
    const next = [...faqs]; next[i] = { ...next[i], [key]: value }; setFaqs(next);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> Beta mode</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={beta.enabled !== false} onCheckedChange={v => setBeta({ ...beta, enabled: v })} /> Show beta badge
          </div>
          <Input className="max-w-xs" value={beta.label || ''} onChange={e => setBeta({ ...beta, label: e.target.value })} placeholder="BETA | EARLY ACCESS" />
          <Button size="sm" onClick={() => saveSetting('beta_mode', beta)}><Save className="w-4 h-4 mr-1" /> Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4" /> Help chatbot</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={chatbot.enabled !== false} onCheckedChange={v => setChatbot({ ...chatbot, enabled: v })} /> Enabled
          </div>
          <Textarea value={chatbot.greeting || ''} onChange={e => setChatbot({ ...chatbot, greeting: e.target.value })} placeholder="Greeting message" />
          <Button size="sm" onClick={() => saveSetting('chatbot', chatbot)}><Save className="w-4 h-4 mr-1" /> Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><HelpCircle className="w-4 h-4" /> FAQ entries</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setFaqs([{ question: '', answer: '', keywords: [], category: 'general', sort_order: 0, active: true }, ...faqs])}>
            <Plus className="w-4 h-4 mr-1" /> New FAQ
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f.id || `new-${i}`} className="border border-border rounded-md p-3 space-y-2">
              <Input placeholder="question" value={f.question || ''} onChange={e => patch(i, 'question', e.target.value)} />
              <Textarea placeholder="answer" value={f.answer || ''} onChange={e => patch(i, 'answer', e.target.value)} />
              <div className="grid gap-2 md:grid-cols-4">
                <Input placeholder="keywords, comma separated"
                  value={Array.isArray(f.keywords) ? f.keywords.join(', ') : (f.keywords || '')}
                  onChange={e => patch(i, 'keywords', e.target.value)} />
                <Input placeholder="category" value={f.category || ''} onChange={e => patch(i, 'category', e.target.value)} />
                <Input placeholder="link url (/map)" value={f.link_url || ''} onChange={e => patch(i, 'link_url', e.target.value)} />
                <Input placeholder="link label" value={f.link_label || ''} onChange={e => patch(i, 'link_label', e.target.value)} />
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-2">Order <Input type="number" className="w-20" value={f.sort_order ?? 0} onChange={e => patch(i, 'sort_order', Number(e.target.value))} /></div>
                <div className="flex items-center gap-2"><Switch checked={!!f.active} onCheckedChange={v => patch(i, 'active', v)} /> Active</div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" onClick={() => saveFaq(f)}><Save className="w-4 h-4" /></Button>
                  {f.id && <Button size="sm" variant="destructive" onClick={() => removeFaq(f.id)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FaqAdmin;
