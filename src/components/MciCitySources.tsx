import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Plus, Trash2, ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { MCI_FIELD_DEFS } from '@/lib/mci';
import { MCI_SOURCES } from '@/lib/mciSources';

interface Source {
  id: string;
  city_id: string;
  metric_key: string;
  source_name: string;
  source_url: string | null;
  data_date: string | null;
  confidence: number;
  verified_at: string | null;
  notes: string | null;
}

interface Props { cityId: string; isAdmin?: boolean }

const emptyDraft = { metric_key: '', source_name: '', source_url: '', data_date: '', confidence: 0.7 };

const MciCitySources = ({ cityId, isAdmin }: Props) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('mci_metric_sources')
      .select('*').eq('city_id', cityId).order('metric_key');
    setSources((data || []) as Source[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [cityId]);

  const add = async () => {
    if (!draft.metric_key || !draft.source_name) { toast.error('Metrik ve kaynak adı zorunlu'); return; }
    const { error } = await (supabase as any).from('mci_metric_sources').upsert({
      city_id: cityId,
      metric_key: draft.metric_key,
      source_name: draft.source_name,
      source_url: draft.source_url || null,
      data_date: draft.data_date || null,
      confidence: Number(draft.confidence),
    }, { onConflict: 'city_id,metric_key' });
    if (error) { toast.error(error.message); return; }
    setDraft(emptyDraft);
    toast.success('Kaynak kaydedildi');
    load();
  };

  const verify = async (s: Source) => {
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await (supabase as any).from('mci_metric_sources').update({
      verified_at: new Date().toISOString(),
      verified_by: sess.session?.user?.id,
    }).eq('id', s.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Doğrulandı'); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Kaynağı sil?')) return;
    const { error } = await (supabase as any).from('mci_metric_sources').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const byMetric = new Map(sources.map(s => [s.metric_key, s]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Metrik Kaynakları</span>
          <Badge variant="secondary">{sources.length}/{MCI_FIELD_DEFS.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-xs text-muted-foreground">Yükleniyor…</p>}

        {!loading && sources.length === 0 && (
          <p className="text-xs text-muted-foreground">Henüz kaynak eklenmemiş.</p>
        )}

        <div className="space-y-1.5">
          {sources.map(s => (
            <div key={s.id} className="flex items-center gap-2 text-xs p-2 rounded border border-border/60">
              <code className="font-mono text-primary shrink-0 w-16 truncate">{s.metric_key}</code>
              <div className="flex-1 min-w-0">
                {s.source_url ? (
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer"
                     className="text-foreground hover:text-primary inline-flex items-center gap-1 truncate">
                    {s.source_name} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : <span className="text-foreground">{s.source_name}</span>}
                <span className="text-muted-foreground ml-2">
                  {s.data_date} · güven {Math.round(s.confidence * 100)}%
                </span>
              </div>
              {s.verified_at ? (
                <Badge variant="default" className="gap-1 shrink-0"><ShieldCheck className="w-3 h-3" />Doğrulandı</Badge>
              ) : isAdmin && (
                <Button size="sm" variant="ghost" onClick={() => verify(s)} className="h-6 text-xs">Doğrula</Button>
              )}
              {isAdmin && (
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)} className="h-6 w-6 text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="text-xs font-medium">Kaynak ekle / güncelle</div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={draft.metric_key}
                onChange={(e) => {
                  const key = e.target.value;
                  const suggestion = MCI_SOURCES.find(s => s.key === key)?.sources[0];
                  setDraft(d => ({
                    ...d,
                    metric_key: key,
                    source_name: byMetric.get(key)?.source_name || suggestion?.name || d.source_name,
                    source_url: byMetric.get(key)?.source_url || suggestion?.url || d.source_url,
                  }));
                }}
                className="h-8 px-2 rounded border border-border bg-background text-xs"
              >
                <option value="">Metrik seç…</option>
                {MCI_FIELD_DEFS.map(f => (
                  <option key={f.key} value={f.key}>{f.key} — {f.label}</option>
                ))}
              </select>
              <Input value={draft.source_name} onChange={(e) => setDraft(d => ({ ...d, source_name: e.target.value }))}
                     placeholder="Kaynak adı" className="h-8 text-xs" />
              <Input value={draft.source_url} onChange={(e) => setDraft(d => ({ ...d, source_url: e.target.value }))}
                     placeholder="https://…" className="h-8 text-xs col-span-2" />
              <Input type="date" value={draft.data_date}
                     onChange={(e) => setDraft(d => ({ ...d, data_date: e.target.value }))} className="h-8 text-xs" />
              <Input type="number" step="0.05" min="0" max="1" value={draft.confidence}
                     onChange={(e) => setDraft(d => ({ ...d, confidence: Number(e.target.value) }))}
                     placeholder="Güven 0-1" className="h-8 text-xs" />
            </div>
            <Button size="sm" onClick={add} className="w-full">
              <Save className="w-3 h-3 mr-1" /> Kaydet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MciCitySources;
