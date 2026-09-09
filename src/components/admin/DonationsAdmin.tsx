import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Heart, Award, CheckCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

type Row = Record<string, any>;

const useTable = (table: string, order: string, asc = true) => {
  const [rows, setRows] = useState<Row[]>([]);
  const load = async () => {
    const { data, error } = await (supabase as any).from(table).select('*').order(order, { ascending: asc });
    if (error) { toast.error(error.message); return; }
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);
  return { rows, setRows, load };
};

const DonationsAdmin = () => {
  const tiers = useTable('donation_tiers', 'sort_order');
  const donations = useTable('donations', 'created_at', false);
  const badges = useTable('donor_badges', 'created_at', false);
  const [contact, setContact] = useState<{ whatsapp?: string; email?: string; note?: string }>({});

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('site_settings').select('value').eq('key', 'donate_contact').maybeSingle();
      setContact((data?.value as any) || {});
    })();
  }, []);

  const saveContact = async () => {
    const { error } = await (supabase as any).from('site_settings')
      .upsert({ key: 'donate_contact', value: contact }, { onConflict: 'key' });
    error ? toast.error(error.message) : toast.success('İletişim bilgileri kaydedildi');
  };

  const save = async (table: string, row: Row, reload: () => void) => {
    const { id, created_at, updated_at, ...payload } = row;
    const { error } = id
      ? await (supabase as any).from(table).update(payload).eq('id', id)
      : await (supabase as any).from(table).insert(payload);
    error ? toast.error(error.message) : (toast.success('Kaydedildi'), reload());
  };

  const remove = async (table: string, id: string, reload: () => void) => {
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    error ? toast.error(error.message) : (toast.success('Silindi'), reload());
  };

  const patch = (setter: any, idx: number, key: string, value: any) =>
    setter((prev: Row[]) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));

  /** Approve a donation and create the donor badge from its tier. */
  const approve = async (d: Row) => {
    const tier = tiers.rows.find(t => t.id === d.tier_id);
    const days = tier?.highlight_days ?? 30;
    const expires = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const { error: e1 } = await (supabase as any).from('donations')
      .update({ status: 'approved', donated_at: new Date().toISOString().slice(0, 10) }).eq('id', d.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await (supabase as any).from('donor_badges').insert({
      donation_id: d.id,
      profile_id: d.profile_id,
      tier_id: d.tier_id,
      display_name: d.show_publicly ? d.donor_name : 'Anonymous',
      label: tier?.badge_label || tier?.name || 'Supporter',
      color: tier?.badge_color || '#f59e0b',
      icon: tier?.badge_icon || 'heart',
      featured: (Number(d.amount) || 0) >= 100,
      expires_at: expires,
    });
    if (e2) return toast.error(e2.message);
    toast.success('Onaylandı ve rozet oluşturuldu');
    donations.load(); badges.load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg inline-flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Bağış İletişim</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input placeholder="WhatsApp (+90...)" value={contact.whatsapp || ''} onChange={e => setContact({ ...contact, whatsapp: e.target.value })} />
          <Input placeholder="E-posta" value={contact.email || ''} onChange={e => setContact({ ...contact, email: e.target.value })} />
          <Textarea placeholder="Açıklama metni" value={contact.note || ''} onChange={e => setContact({ ...contact, note: e.target.value })} />
          <Button size="sm" onClick={saveContact} className="w-fit"><Save className="w-4 h-4 mr-1" /> Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg inline-flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Bağış Seviyeleri</CardTitle>
          <Button size="sm" variant="outline" onClick={() => tiers.setRows(r => [...r, { code: '', name: '', min_amount: 0, currency: 'USD', badge_color: '#f59e0b', badge_icon: 'heart', highlight_days: 30, sort_order: r.length, active: true }])}>
            <Plus className="w-4 h-4 mr-1" /> Seviye
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.rows.map((t, i) => (
            <div key={t.id || `new-${i}`} className="p-3 border border-border rounded-lg grid gap-2 md:grid-cols-4">
              <Input placeholder="Kod" value={t.code || ''} onChange={e => patch(tiers.setRows, i, 'code', e.target.value)} />
              <Input placeholder="Ad" value={t.name || ''} onChange={e => patch(tiers.setRows, i, 'name', e.target.value)} />
              <Input type="number" placeholder="Min tutar" value={t.min_amount ?? 0} onChange={e => patch(tiers.setRows, i, 'min_amount', Number(e.target.value))} />
              <Input placeholder="Para birimi" value={t.currency || ''} onChange={e => patch(tiers.setRows, i, 'currency', e.target.value)} />
              <Input placeholder="Rozet adı" value={t.badge_label || ''} onChange={e => patch(tiers.setRows, i, 'badge_label', e.target.value)} />
              <Input placeholder="Renk (#hex)" value={t.badge_color || ''} onChange={e => patch(tiers.setRows, i, 'badge_color', e.target.value)} />
              <Input placeholder="İkon (heart/star/crown)" value={t.badge_icon || ''} onChange={e => patch(tiers.setRows, i, 'badge_icon', e.target.value)} />
              <Input type="number" placeholder="Öne çıkarma (gün)" value={t.highlight_days ?? 30} onChange={e => patch(tiers.setRows, i, 'highlight_days', Number(e.target.value))} />
              <Textarea className="md:col-span-2" placeholder="Açıklama" value={t.description || ''} onChange={e => patch(tiers.setRows, i, 'description', e.target.value)} />
              <Textarea className="md:col-span-2" placeholder="Avantajlar" value={t.perks || ''} onChange={e => patch(tiers.setRows, i, 'perks', e.target.value)} />
              <div className="md:col-span-4 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!t.active} onCheckedChange={v => patch(tiers.setRows, i, 'active', v)} /> Aktif</label>
                <Button size="sm" onClick={() => save('donation_tiers', t, tiers.load)}><Save className="w-4 h-4 mr-1" /> Kaydet</Button>
                {t.id && <Button size="sm" variant="destructive" onClick={() => remove('donation_tiers', t.id, tiers.load)}><Trash2 className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg inline-flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Bağışlar ({donations.rows.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {donations.rows.length === 0 && <p className="text-sm text-muted-foreground">Bağış yok.</p>}
          {donations.rows.map((d, i) => (
            <div key={d.id} className="p-3 border border-border rounded-lg grid gap-2 md:grid-cols-4">
              <Input value={d.donor_name || ''} onChange={e => patch(donations.setRows, i, 'donor_name', e.target.value)} />
              <Input value={d.email || ''} onChange={e => patch(donations.setRows, i, 'email', e.target.value)} placeholder="E-posta" />
              <Input value={d.whatsapp || ''} onChange={e => patch(donations.setRows, i, 'whatsapp', e.target.value)} placeholder="WhatsApp" />
              <Input type="number" value={d.amount ?? 0} onChange={e => patch(donations.setRows, i, 'amount', Number(e.target.value))} />
              <Textarea className="md:col-span-2" placeholder="Mesaj" value={d.message || ''} onChange={e => patch(donations.setRows, i, 'message', e.target.value)} />
              <Textarea className="md:col-span-2" placeholder="Admin notu" value={d.admin_note || ''} onChange={e => patch(donations.setRows, i, 'admin_note', e.target.value)} />
              <div className="md:col-span-4 flex items-center gap-3 flex-wrap">
                <Badge variant={d.status === 'approved' ? 'default' : 'secondary'}>{d.status}</Badge>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!d.show_publicly} onCheckedChange={v => patch(donations.setRows, i, 'show_publicly', v)} /> Herkese açık</label>
                <Button size="sm" onClick={() => save('donations', d, donations.load)}><Save className="w-4 h-4 mr-1" /> Kaydet</Button>
                {d.status !== 'approved' && <Button size="sm" variant="outline" onClick={() => approve(d)}><CheckCircle className="w-4 h-4 mr-1" /> Onayla + Rozet</Button>}
                {d.whatsapp && <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${String(d.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4" /></a></Button>}
                <Button size="sm" variant="destructive" onClick={() => remove('donations', d.id, donations.load)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg inline-flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Bağışçı Rozetleri</CardTitle>
          <Button size="sm" variant="outline" onClick={() => badges.setRows(r => [{ label: 'Supporter', color: '#f59e0b', icon: 'heart', active: true, featured: false }, ...r])}>
            <Plus className="w-4 h-4 mr-1" /> Rozet
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {badges.rows.map((b, i) => (
            <div key={b.id || `new-${i}`} className="p-3 border border-border rounded-lg grid gap-2 md:grid-cols-4">
              <Input placeholder="Görünen ad" value={b.display_name || ''} onChange={e => patch(badges.setRows, i, 'display_name', e.target.value)} />
              <Input placeholder="Rozet" value={b.label || ''} onChange={e => patch(badges.setRows, i, 'label', e.target.value)} />
              <Input placeholder="Renk" value={b.color || ''} onChange={e => patch(badges.setRows, i, 'color', e.target.value)} />
              <Input placeholder="İkon" value={b.icon || ''} onChange={e => patch(badges.setRows, i, 'icon', e.target.value)} />
              <Input placeholder="Profil ID (opsiyonel)" value={b.profile_id || ''} onChange={e => patch(badges.setRows, i, 'profile_id', e.target.value || null)} />
              <Input type="date" value={b.expires_at || ''} onChange={e => patch(badges.setRows, i, 'expires_at', e.target.value || null)} />
              <label className="flex items-center gap-2 text-sm"><Switch checked={!!b.featured} onCheckedChange={v => patch(badges.setRows, i, 'featured', v)} /> Öne çıkar</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={!!b.active} onCheckedChange={v => patch(badges.setRows, i, 'active', v)} /> Aktif</label>
              <div className="md:col-span-4 flex gap-2">
                <Button size="sm" onClick={() => save('donor_badges', b, badges.load)}><Save className="w-4 h-4 mr-1" /> Kaydet</Button>
                {b.id && <Button size="sm" variant="destructive" onClick={() => remove('donor_badges', b.id, badges.load)}><Trash2 className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonationsAdmin;
