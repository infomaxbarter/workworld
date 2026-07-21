import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Plus, Trash2, UserCheck } from 'lucide-react';
import { pickI18n } from '@/i18n/i18nField';
import { useLanguage } from '@/i18n/LanguageContext';

interface City { id: string; city: string; country_code: string; seat_quota: number | null }
interface Profession { id: string; name: string; name_i18n: any }
interface Profile { id: string; user_id: string; display_name: string; slug: string | null; city: string | null }
interface Rep {
  id: string; city_id: string; profession_id: string; profile_id: string | null; slot_index: number;
  professions?: { name: string; name_i18n: any } | null;
  profiles?: { display_name: string } | null;
}
interface App {
  id: string; city_id: string; user_id: string; profession_id: string | null; message: string | null;
  status: string; created_at: string;
}

const MciRepresentativesAdmin = () => {
  const { lang } = useLanguage();
  const [cities, setCities] = useState<City[]>([]);
  const [profs, setProfs] = useState<Profession[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [newSlot, setNewSlot] = useState({ profession_id: '', profile_id: '' });

  const load = async () => {
    const [c, p, pr, r, a] = await Promise.all([
      supabase.from('mci_cities').select('id,city,country_code,seat_quota').eq('approved', true).order('cp_final', { ascending: false, nullsFirst: false }),
      supabase.from('professions').select('id,name,name_i18n').eq('status', 'active').order('name'),
      supabase.from('profiles').select('id,user_id,display_name,slug,city').eq('approved', true).order('display_name'),
      (supabase as any).from('mci_city_representatives')
        .select('id,city_id,profession_id,profile_id,slot_index,professions(name,name_i18n),profiles(display_name)')
        .order('slot_index'),
      (supabase as any).from('mci_seat_applications').select('*').order('created_at', { ascending: false }),
    ]);
    setCities((c.data || []) as City[]);
    setProfs((p.data || []) as Profession[]);
    setProfiles((pr.data || []) as Profile[]);
    setReps((r.data || []) as Rep[]);
    setApps((a.data || []) as App[]);
    if (!selectedCity && c.data?.[0]) setSelectedCity((c.data[0] as any).id);
  };

  useEffect(() => { load(); }, []);

  const city = cities.find(c => c.id === selectedCity);
  const cityReps = reps.filter(r => r.city_id === selectedCity);
  const cityApps = apps.filter(a => a.city_id === selectedCity);
  const nextSlot = (cityReps[cityReps.length - 1]?.slot_index || 0) + 1;
  const capacity = city?.seat_quota || 0;

  const addSlot = async () => {
    if (!selectedCity || !newSlot.profession_id) { toast.error('Meslek seç'); return; }
    if (cityReps.length >= capacity) { toast.error(`Kontenjan dolu (${capacity})`); return; }
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await (supabase as any).from('mci_city_representatives').insert({
      city_id: selectedCity,
      profession_id: newSlot.profession_id,
      profile_id: newSlot.profile_id || null,
      slot_index: nextSlot,
      appointed_by: newSlot.profile_id ? sess.session?.user?.id : null,
      appointed_at: newSlot.profile_id ? new Date().toISOString() : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Koltuk oluşturuldu');
    setNewSlot({ profession_id: '', profile_id: '' });
    load();
  };

  const assign = async (repId: string, profileId: string) => {
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await (supabase as any).from('mci_city_representatives').update({
      profile_id: profileId || null,
      appointed_by: profileId ? sess.session?.user?.id : null,
      appointed_at: profileId ? new Date().toISOString() : null,
    }).eq('id', repId);
    if (error) { toast.error(error.message); return; }
    toast.success('Atama kaydedildi');
    load();
  };

  const removeSlot = async (id: string) => {
    if (!confirm('Koltuğu sil?')) return;
    const { error } = await (supabase as any).from('mci_city_representatives').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const approveApp = async (a: App) => {
    // Find the profile of this user
    const profile = profiles.find(p => p.user_id === a.user_id);
    if (!profile) { toast.error('Kullanıcı profili bulunamadı'); return; }
    if (!a.profession_id) { toast.error('Başvuruda meslek yok'); return; }
    if (cityReps.length >= capacity) { toast.error('Kontenjan dolu'); return; }

    const { data: sess } = await supabase.auth.getSession();
    const nextIdx = ((reps.filter(r => r.city_id === a.city_id).pop()?.slot_index) || 0) + 1;
    const { error: e1 } = await (supabase as any).from('mci_city_representatives').insert({
      city_id: a.city_id,
      profession_id: a.profession_id,
      profile_id: profile.id,
      slot_index: nextIdx,
      appointed_by: sess.session?.user?.id,
      appointed_at: new Date().toISOString(),
    });
    if (e1) { toast.error(e1.message); return; }
    await (supabase as any).from('mci_seat_applications').update({
      status: 'approved', reviewer_id: sess.session?.user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', a.id);
    await supabase.rpc('create_notification', {
      _user_id: a.user_id, _type: 'seat_approved',
      _title: 'Temsilci başvurun onaylandı', _message: null, _link: '/mci',
    } as any);
    toast.success('Başvuru onaylandı');
    load();
  };

  const rejectApp = async (a: App) => {
    const { data: sess } = await supabase.auth.getSession();
    await (supabase as any).from('mci_seat_applications').update({
      status: 'rejected', reviewer_id: sess.session?.user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', a.id);
    await supabase.rpc('create_notification', {
      _user_id: a.user_id, _type: 'seat_rejected',
      _title: 'Temsilci başvurun reddedildi', _message: null, _link: '/mci',
    } as any);
    toast.success('Reddedildi'); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
                className="h-9 px-2 rounded border border-border bg-background text-sm">
          {cities.map(c => (
            <option key={c.id} value={c.id}>{c.city} ({c.country_code}) — K{c.seat_quota ?? '—'}</option>
          ))}
        </select>
        {city && <Badge>{cityReps.length} / {capacity} koltuk</Badge>}
        {cityApps.filter(a => a.status === 'pending').length > 0 && (
          <Badge variant="secondary">{cityApps.filter(a => a.status === 'pending').length} bekleyen başvuru</Badge>
        )}
      </div>

      {/* Pending applications */}
      {cityApps.filter(a => a.status === 'pending').length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bekleyen Başvurular</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cityApps.filter(a => a.status === 'pending').map(a => {
              const prof = profs.find(p => p.id === a.profession_id);
              const profile = profiles.find(p => p.user_id === a.user_id);
              return (
                <div key={a.id} className="p-2 rounded border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <b>{profile?.display_name || a.user_id.slice(0, 8)}</b> —{' '}
                      <span className="text-muted-foreground">
                        {prof ? pickI18n(prof.name_i18n, prof.name, lang) : 'Genel'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => approveApp(a)}><Check className="w-3 h-3 mr-1" />Onayla & Ata</Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectApp(a)}><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  {a.message && <div className="italic text-muted-foreground">{a.message}</div>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Slot creator */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Koltuk Aç / Doldur</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select value={newSlot.profession_id}
                    onChange={(e) => setNewSlot(n => ({ ...n, profession_id: e.target.value }))}
                    className="h-9 px-2 rounded border border-border bg-background text-sm">
              <option value="">Meslek…</option>
              {profs.map(p => (<option key={p.id} value={p.id}>{pickI18n(p.name_i18n, p.name, lang)}</option>))}
            </select>
            <select value={newSlot.profile_id}
                    onChange={(e) => setNewSlot(n => ({ ...n, profile_id: e.target.value }))}
                    className="h-9 px-2 rounded border border-border bg-background text-sm">
              <option value="">Boş bırak</option>
              {profiles.map(p => (<option key={p.id} value={p.id}>{p.display_name}{p.city ? ` — ${p.city}` : ''}</option>))}
            </select>
          </div>
          <Button size="sm" onClick={addSlot} className="w-full" disabled={cityReps.length >= capacity}>
            <Plus className="w-3 h-3 mr-1" /> Koltuk #{nextSlot} oluştur
          </Button>
        </CardContent>
      </Card>

      {/* Existing seats */}
      <div className="space-y-1">
        {cityReps.map(r => (
          <div key={r.id} className="flex items-center gap-2 p-2 rounded border border-border">
            <div className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">#{r.slot_index}</div>
            <div className="text-xs flex-1 min-w-0">
              <div className="font-medium truncate">
                {r.professions ? pickI18n(r.professions.name_i18n, r.professions.name, lang) : '—'}
              </div>
              <div className="text-muted-foreground truncate">
                {r.profiles?.display_name || <span className="italic">Boş</span>}
              </div>
            </div>
            <select value={r.profile_id || ''} onChange={(e) => assign(r.id, e.target.value)}
                    className="h-7 px-1 rounded border border-border bg-background text-xs w-40">
              <option value="">— Boş —</option>
              {profiles.map(p => (<option key={p.id} value={p.id}>{p.display_name}</option>))}
            </select>
            <Button size="icon" variant="ghost" onClick={() => removeSlot(r.id)} className="h-7 w-7 text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {cityReps.length === 0 && <p className="text-xs text-muted-foreground">Bu şehir için henüz koltuk yok.</p>}
      </div>
    </div>
  );
};

export default MciRepresentativesAdmin;
