import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Calculator } from 'lucide-react';
import { MCI_FIELD_DEFS, calculateMCI, type MciMetrics } from '@/lib/mci';

const DEFAULTS: MciMetrics = {
  N: 500000, G: 15000, F: 5000, U: 2, S: 1, T: 1,
  P_search: 5, M_loc: 100, H: 5, T_flow: 5, AI_index: 5, ESG_score: 5,
  Exp: 1, Imp: 1, Y_ratio: 0.35, E_ratio: 0.15, B_rate: 2.0,
  sigma: 0, delta_pulse: 1, net_syn: 1,
};

interface Props {
  countries: Array<{ code: string; name: string; flag_emoji: string | null }>;
  onSubmitted?: () => void;
  initial?: Partial<MciMetrics & { city: string; country_code: string; notes: string }>;
  cityId?: string;
}

const MciSubmissionForm = ({ countries, onSubmitted, initial, cityId }: Props) => {
  const [city, setCity] = useState(initial?.city || '');
  const [countryCode, setCountryCode] = useState(initial?.country_code || countries[0]?.code || 'TR');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [metrics, setMetrics] = useState<MciMetrics>({ ...DEFAULTS, ...initial });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  const preview = useMemo(() => calculateMCI(metrics), [metrics]);

  const submit = async () => {
    if (!userId) { toast.error('Giriş yapmanız gerekli'); return; }
    if (!city.trim()) { toast.error('Şehir adı gerekli'); return; }
    setSaving(true);

    const payload: any = { city: city.trim(), country_code: countryCode, notes };
    for (const def of MCI_FIELD_DEFS) payload[def.column] = metrics[def.key];

    const { error } = await supabase.from('mci_submissions').insert({
      user_id: userId,
      city_id: cityId ?? null,
      action: cityId ? 'update' : 'create',
      payload,
      status: 'pending',
    } as any);

    if (error) { toast.error(error.message); setSaving(false); return; }

    await supabase.rpc('notify_admins', {
      _type: 'mci_submission',
      _title: `Yeni MCI önerisi: ${city}`,
      _message: `${countryCode} — CP ${preview.cp_final}, K ${preview.seat_quota}`,
      _link: '/admin',
    } as any);

    toast.success('Öneriniz admin onayına gönderildi');
    setSaving(false);
    onSubmitted?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          {cityId ? 'Şehir Verisi Güncelleme Önerisi' : 'Yeni Şehir Önerisi'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Şehir</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul" />
          </div>
          <div className="space-y-1.5">
            <Label>Pilot Ülke</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {countries.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag_emoji} {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {MCI_FIELD_DEFS.map(def => (
            <div key={def.key} className="space-y-1">
              <Label className="text-xs">{def.label}</Label>
              <Input
                type="number"
                step={def.step}
                min={def.min}
                max={def.max}
                value={metrics[def.key] as number}
                onChange={(e) => setMetrics(m => ({ ...m, [def.key]: Number(e.target.value) }))}
              />
              <p className="text-[10px] text-muted-foreground">{def.hint}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label>Kaynak / Not</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Verilerin kaynağı, referans linkleri, ek açıklamalar..." />
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Anlık MCI Önizlemesi</div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">CP_base {preview.cp_base}</Badge>
              <Badge variant="secondary">I_trade {preview.I_trade}</Badge>
              <Badge variant="secondary">D_dyn {preview.D_dyn}</Badge>
              <Badge>CP_final {preview.cp_final}</Badge>
              <Badge variant="default" className="bg-primary">Koltuk K = {preview.seat_quota} / 65</Badge>
            </div>
          </div>
        </div>

        <Button onClick={submit} disabled={saving || !userId} className="w-full">
          <Send className="w-4 h-4 mr-2" />
          {userId ? (saving ? 'Gönderiliyor...' : 'Admin Onayına Gönder') : 'Öneri göndermek için giriş yapın'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MciSubmissionForm;
