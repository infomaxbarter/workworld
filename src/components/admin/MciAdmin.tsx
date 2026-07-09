import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, X, Trash2, RefreshCw } from 'lucide-react';
import { calculateMCI, rowToMetrics, MCI_FIELD_DEFS } from '@/lib/mci';
import MciSubmissionForm from '@/components/MciSubmissionForm';

interface Country { code: string; name: string; flag_emoji: string | null; active: boolean }
interface City { id: string; city: string; country_code: string; slug: string; approved: boolean; cp_final: number | null; seat_quota: number | null; [k: string]: any }
interface Submission { id: string; user_id: string; city_id: string | null; action: string; payload: any; status: string; review_note: string | null; created_at: string }

const MciAdmin = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: cty }, { data: s }] = await Promise.all([
      supabase.from('pilot_countries').select('*').order('code'),
      supabase.from('mci_cities').select('*').order('cp_final', { ascending: false, nullsFirst: false }),
      supabase.from('mci_submissions').select('*').order('created_at', { ascending: false }),
    ]);
    setCountries((c || []) as any);
    setCities((cty || []) as any);
    setSubs((s || []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approveSubmission = async (sub: Submission) => {
    const p = sub.payload || {};
    const row: any = {
      city: p.city,
      country_code: p.country_code,
      notes: p.notes || null,
      approved: true,
    };
    for (const def of MCI_FIELD_DEFS) row[def.column] = p[def.column];
    const metrics = rowToMetrics(row);
    const calc = calculateMCI(metrics);
    row.cp_final = calc.cp_final;
    row.seat_quota = calc.seat_quota;

    let err;
    if (sub.city_id) {
      ({ error: err } = await supabase.from('mci_cities').update(row).eq('id', sub.city_id) as any);
    } else {
      ({ error: err } = await supabase.from('mci_cities').insert(row) as any);
    }
    if (err) { toast.error(err.message); return; }

    const { data: sess } = await supabase.auth.getSession();
    await supabase.from('mci_submissions').update({
      status: 'approved',
      review_note: reviewNotes[sub.id] || null,
      reviewer_id: sess.session?.user?.id,
      reviewed_at: new Date().toISOString(),
    } as any).eq('id', sub.id);

    await supabase.rpc('create_notification', {
      _user_id: sub.user_id,
      _type: 'mci_approved',
      _title: `MCI önerin onaylandı: ${p.city}`,
      _message: `CP ${calc.cp_final} · K ${calc.seat_quota}`,
      _link: '/mci',
    } as any);

    toast.success('Öneri onaylandı ve şehir güncellendi');
    load();
  };

  const rejectSubmission = async (sub: Submission) => {
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await supabase.from('mci_submissions').update({
      status: 'rejected',
      review_note: reviewNotes[sub.id] || null,
      reviewer_id: sess.session?.user?.id,
      reviewed_at: new Date().toISOString(),
    } as any).eq('id', sub.id);
    if (error) { toast.error(error.message); return; }

    await supabase.rpc('create_notification', {
      _user_id: sub.user_id,
      _type: 'mci_rejected',
      _title: `MCI önerin reddedildi: ${sub.payload?.city}`,
      _message: reviewNotes[sub.id] || 'Not eklenmedi',
      _link: '/mci',
    } as any);

    toast.success('Öneri reddedildi');
    load();
  };

  const deleteCity = async (id: string) => {
    if (!confirm('Şehri silmek istediğine emin misin?')) return;
    const { error } = await supabase.from('mci_cities').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Silindi');
    load();
  };

  const recomputeCity = async (city: City) => {
    const calc = calculateMCI(rowToMetrics(city));
    const { error } = await supabase.from('mci_cities')
      .update({ cp_final: calc.cp_final, seat_quota: calc.seat_quota } as any)
      .eq('id', city.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Yeniden hesaplandı: CP ${calc.cp_final}, K ${calc.seat_quota}`);
    load();
  };

  const toggleCountry = async (c: Country) => {
    const { error } = await supabase.from('pilot_countries').update({ active: !c.active } as any).eq('code', c.code);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const pending = subs.filter(s => s.status === 'pending');

  if (loading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;

  return (
    <Tabs defaultValue="submissions">
      <TabsList>
        <TabsTrigger value="submissions">Öneriler ({pending.length})</TabsTrigger>
        <TabsTrigger value="cities">Şehirler ({cities.length})</TabsTrigger>
        <TabsTrigger value="countries">Pilot Ülkeler</TabsTrigger>
        <TabsTrigger value="new">Yeni Şehir Ekle</TabsTrigger>
      </TabsList>

      <TabsContent value="submissions" className="space-y-3 mt-4">
        {subs.length === 0 && <p className="text-sm text-muted-foreground">Henüz öneri yok.</p>}
        {subs.map(sub => {
          const p = sub.payload || {};
          let calc = null;
          try { calc = calculateMCI({ ...p } as any); } catch {}
          return (
            <Card key={sub.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">
                      {p.city} <span className="text-xs text-muted-foreground">({p.country_code})</span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      {sub.action === 'update' ? 'Güncelleme' : 'Yeni şehir'} · {new Date(sub.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {calc && <Badge>CP {calc.cp_final}</Badge>}
                    {calc && <Badge variant="secondary">K {calc.seat_quota}</Badge>}
                    <Badge variant={sub.status === 'pending' ? 'secondary' : sub.status === 'approved' ? 'default' : 'destructive'}>
                      {sub.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Tüm veri (JSON)</summary>
                  <pre className="mt-2 p-2 rounded bg-muted overflow-auto max-h-60">{JSON.stringify(p, null, 2)}</pre>
                </details>
                {sub.review_note && (
                  <p className="text-xs italic text-muted-foreground">Not: {sub.review_note}</p>
                )}
                {sub.status === 'pending' && (
                  <>
                    <Textarea
                      rows={2}
                      placeholder="Onay/red notu (isteğe bağlı)"
                      value={reviewNotes[sub.id] || ''}
                      onChange={(e) => setReviewNotes(n => ({ ...n, [sub.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveSubmission(sub)}>
                        <Check className="w-4 h-4 mr-1" /> Onayla
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectSubmission(sub)}>
                        <X className="w-4 h-4 mr-1" /> Reddet
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>

      <TabsContent value="cities" className="space-y-2 mt-4">
        {cities.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
            <div>
              <div className="font-medium text-sm">{c.city} <span className="text-xs text-muted-foreground">({c.country_code})</span></div>
              <div className="text-xs text-muted-foreground">
                CP {c.cp_final ?? '—'} · K {c.seat_quota ?? '—'} · {c.approved ? 'Onaylı' : 'Beklemede'}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => recomputeCity(c)} title="Yeniden hesapla">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteCity(c.id)} className="text-destructive" title="Sil">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="countries" className="space-y-2 mt-4">
        {countries.map(c => (
          <div key={c.code} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{c.flag_emoji}</span>
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.code}</div>
              </div>
            </div>
            <Button size="sm" variant={c.active ? 'default' : 'outline'} onClick={() => toggleCountry(c)}>
              {c.active ? 'Aktif' : 'Pasif'}
            </Button>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="new" className="mt-4">
        <p className="text-xs text-muted-foreground mb-3">
          Admin olarak eklediğin şehir doğrudan onaylı olarak kayda geçmez; öneri kuyruğuna düşer, ardından "Öneriler" sekmesinden onaylayabilirsin. Kalite kontrol için tek akış.
        </p>
        <MciSubmissionForm countries={countries.filter(c => c.active)} onSubmitted={load} />
      </TabsContent>
    </Tabs>
  );
};

export default MciAdmin;
