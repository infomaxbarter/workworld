import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, Images, Share2, Search } from 'lucide-react';
import { toast } from 'sonner';

type Row = Record<string, any>;

const useTable = (table: string, order: string) => {
  const [rows, setRows] = useState<Row[]>([]);
  const load = async () => {
    const { data, error } = await (supabase as any).from(table).select('*').order(order);
    if (error) { toast.error(error.message); return; }
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);
  return { rows, setRows, load };
};

const SiteContentAdmin = () => {
  const hero = useTable('hero_slides', 'sort_order');
  const social = useTable('social_links', 'sort_order');
  const seo = useTable('seo_settings', 'page_key');

  const save = async (table: string, row: Row, reload: () => void) => {
    const { id, created_at, updated_at, ...payload } = row;
    const { error } = id
      ? await (supabase as any).from(table).update(payload).eq('id', id)
      : await (supabase as any).from(table).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Kaydedildi'); reload();
  };

  const remove = async (table: string, id: string, reload: () => void) => {
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Silindi'); reload();
  };

  const patch = (setter: any, idx: number, key: string, value: any) =>
    setter((prev: Row[]) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));

  return (
    <div className="space-y-6">
      {/* HERO SLIDER */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg inline-flex items-center gap-2"><Images className="w-5 h-5 text-primary" /> Ana Sayfa Slider</CardTitle>
          <Button size="sm" variant="outline" onClick={() => hero.setRows(r => [...r, { title: '', sort_order: r.length, active: true }])}>
            <Plus className="w-4 h-4 mr-1" /> Slayt
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {hero.rows.length === 0 && <p className="text-sm text-muted-foreground">Slayt yok.</p>}
          {hero.rows.map((s, i) => (
            <div key={s.id || `new-${i}`} className="p-3 border border-border rounded-lg space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input placeholder="Başlık" value={s.title || ''} onChange={e => patch(hero.setRows, i, 'title', e.target.value)} />
                <Input placeholder="Alt başlık" value={s.subtitle || ''} onChange={e => patch(hero.setRows, i, 'subtitle', e.target.value)} />
                <Input placeholder="Görsel URL" value={s.image_url || ''} onChange={e => patch(hero.setRows, i, 'image_url', e.target.value)} />
                <Input placeholder="Buton metni" value={s.cta_label || ''} onChange={e => patch(hero.setRows, i, 'cta_label', e.target.value)} />
                <Input placeholder="Buton linki (/mci)" value={s.cta_url || ''} onChange={e => patch(hero.setRows, i, 'cta_url', e.target.value)} />
                <Input type="number" placeholder="Sıra" value={s.sort_order ?? 0} onChange={e => patch(hero.setRows, i, 'sort_order', Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={!!s.active} onCheckedChange={v => patch(hero.setRows, i, 'active', v)} /> Yayında
                </label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => save('hero_slides', s, hero.load)}><Save className="w-4 h-4 mr-1" /> Kaydet</Button>
                  {s.id && <Button size="sm" variant="ghost" onClick={() => remove('hero_slides', s.id, hero.load)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SOCIAL LINKS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg inline-flex items-center gap-2"><Share2 className="w-5 h-5 text-primary" /> Sosyal Medya Hesapları</CardTitle>
          <Button size="sm" variant="outline" onClick={() => social.setRows(r => [...r, { platform: '', url: '', sort_order: r.length, active: true }])}>
            <Plus className="w-4 h-4 mr-1" /> Hesap
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {social.rows.length === 0 && <p className="text-sm text-muted-foreground">Hesap yok.</p>}
          {social.rows.map((s, i) => (
            <div key={s.id || `new-${i}`} className="grid sm:grid-cols-[1fr_2fr_1fr_auto_auto] gap-2 items-center p-2 border border-border rounded-lg">
              <Input placeholder="platform (x, linkedin…)" value={s.platform || ''} onChange={e => patch(social.setRows, i, 'platform', e.target.value)} />
              <Input placeholder="https://…" value={s.url || ''} onChange={e => patch(social.setRows, i, 'url', e.target.value)} />
              <Input placeholder="Etiket" value={s.label || ''} onChange={e => patch(social.setRows, i, 'label', e.target.value)} />
              <Switch checked={!!s.active} onCheckedChange={v => patch(social.setRows, i, 'active', v)} />
              <div className="flex gap-1">
                <Button size="sm" onClick={() => save('social_links', s, social.load)}><Save className="w-4 h-4" /></Button>
                {s.id && <Button size="sm" variant="ghost" onClick={() => remove('social_links', s.id, social.load)}><Trash2 className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg inline-flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> SEO / Meta Yönetimi</CardTitle>
          <Button size="sm" variant="outline" onClick={() => seo.setRows(r => [...r, { page_key: '', no_index: false }])}>
            <Plus className="w-4 h-4 mr-1" /> Sayfa
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Sayfa anahtarı: <code>home, humans, events, professions, mci, media, analytics, about</code></p>
          {seo.rows.map((s, i) => (
            <div key={s.id || `new-${i}`} className="p-3 border border-border rounded-lg space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input placeholder="page_key" value={s.page_key || ''} onChange={e => patch(seo.setRows, i, 'page_key', e.target.value)} />
                <Input placeholder="Başlık (<60 karakter)" value={s.title || ''} onChange={e => patch(seo.setRows, i, 'title', e.target.value)} />
                <Input placeholder="Canonical yol (/mci)" value={s.canonical_path || ''} onChange={e => patch(seo.setRows, i, 'canonical_path', e.target.value)} />
                <Input placeholder="Sosyal görsel URL (1200x630)" value={s.og_image || ''} onChange={e => patch(seo.setRows, i, 'og_image', e.target.value)} />
              </div>
              <Textarea rows={2} placeholder="Meta açıklama (<160 karakter)" value={s.description || ''} onChange={e => patch(seo.setRows, i, 'description', e.target.value)} />
              <Input placeholder="Anahtar kelimeler (virgülle)" value={s.keywords || ''} onChange={e => patch(seo.setRows, i, 'keywords', e.target.value)} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={!!s.no_index} onCheckedChange={v => patch(seo.setRows, i, 'no_index', v)} /> noindex
                </label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => save('seo_settings', s, seo.load)}><Save className="w-4 h-4 mr-1" /> Kaydet</Button>
                  {s.id && <Button size="sm" variant="ghost" onClick={() => remove('seo_settings', s.id, seo.load)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteContentAdmin;
