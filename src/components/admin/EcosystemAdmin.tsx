import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, X, Search, MapPin, Briefcase, Trophy, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';
import { LEAD_STAGES, tierClass, tierKey } from '@/lib/ecosystem';

type Row = Record<string, any>;

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'bool' | 'date';
  list?: boolean;
}

interface TableDef {
  table: string;
  label: string;
  icon: typeof MapPin;
  order: string;
  fields: FieldDef[];
  defaults: Row;
  searchKeys: string[];
}

const DEFS: TableDef[] = [
  {
    table: 'tr_provinces',
    label: 'İller',
    icon: MapPin,
    order: 'plate_no',
    searchKeys: ['name', 'region', 'tier', 'focus_sectors', 'local_hubs'],
    defaults: { plate_no: 82, name: '', region: '', tier: 'Tier 3 - Gelişen Ekosistem', target_representatives: 1, active: true },
    fields: [
      { key: 'plate_no', label: 'Plaka', type: 'number', list: true },
      { key: 'name', label: 'İl', list: true },
      { key: 'region', label: 'Bölge', list: true },
      { key: 'tier', label: 'Kademe', list: true },
      { key: 'target_representatives', label: 'Hedef temsilci', type: 'number', list: true },
      { key: 'focus_sectors', label: 'Odak sektörler', type: 'textarea' },
      { key: 'local_hubs', label: 'Yerel hublar', type: 'textarea' },
      { key: 'community_channels', label: 'Topluluk kanalları', type: 'textarea' },
      { key: 'value_proposition', label: 'Değer önerisi', type: 'textarea' },
      { key: 'lat', label: 'Enlem', type: 'number' },
      { key: 'lng', label: 'Boylam', type: 'number' },
      { key: 'active', label: 'Aktif', type: 'bool', list: true },
    ],
  },
  {
    table: 'tr_verticals',
    label: 'Meslek Dikeyleri',
    icon: Briefcase,
    order: 'sort_order',
    searchKeys: ['code', 'name', 'target_roles', 'typical_demand'],
    defaults: { code: '', name: '', sort_order: 99, active: true },
    fields: [
      { key: 'code', label: 'Kod', list: true },
      { key: 'name', label: 'Ad', list: true },
      { key: 'target_roles', label: 'Hedef roller', type: 'textarea', list: true },
      { key: 'barter_supply', label: 'Takas arzı', type: 'textarea' },
      { key: 'typical_demand', label: 'Tipik talep', type: 'textarea' },
      { key: 'ideal_representative', label: 'İdeal temsilci', type: 'textarea' },
      { key: 'discovery_channels', label: 'Keşif kanalları', type: 'textarea' },
      { key: 'sort_order', label: 'Sıra', type: 'number' },
      { key: 'active', label: 'Aktif', type: 'bool', list: true },
    ],
  },
  {
    table: 'ambassador_levels',
    label: 'Elçi Seviyeleri',
    icon: Trophy,
    order: 'sort_order',
    searchKeys: ['code', 'title', 'requirements'],
    defaults: { code: '', title: '', sort_order: 99 },
    fields: [
      { key: 'code', label: 'Kod', list: true },
      { key: 'title', label: 'Başlık', list: true },
      { key: 'requirements', label: 'Gereksinimler', type: 'textarea', list: true },
      { key: 'rights', label: 'Haklar', type: 'textarea' },
      { key: 'badges', label: 'Rozetler', type: 'textarea' },
      { key: 'motivation', label: 'Motivasyon', type: 'textarea' },
      { key: 'sort_order', label: 'Sıra', type: 'number' },
    ],
  },
  {
    table: 'outreach_templates',
    label: 'İletişim Şablonları',
    icon: Mail,
    order: 'sort_order',
    searchKeys: ['code', 'audience', 'channel', 'subject', 'body'],
    defaults: { code: '', audience: '', channel: 'LinkedIn', sort_order: 99 },
    fields: [
      { key: 'code', label: 'Kod', list: true },
      { key: 'audience', label: 'Hedef kitle', list: true },
      { key: 'channel', label: 'Kanal', list: true },
      { key: 'subject', label: 'Konu', list: true },
      { key: 'body', label: 'İçerik', type: 'textarea' },
      { key: 'sort_order', label: 'Sıra', type: 'number' },
    ],
  },
  {
    table: 'crm_leads',
    label: 'CRM Pipeline',
    icon: Users,
    order: 'created_at',
    searchKeys: ['full_name', 'city', 'vertical', 'current_title', 'stage', 'owner'],
    defaults: { full_name: '', stage: LEAD_STAGES[0], quality_score: 3 },
    fields: [
      { key: 'code', label: 'Kod', list: true },
      { key: 'full_name', label: 'Ad Soyad', list: true },
      { key: 'city', label: 'Şehir', list: true },
      { key: 'region', label: 'Bölge' },
      { key: 'tier', label: 'Kademe' },
      { key: 'vertical', label: 'Dikey', list: true },
      { key: 'current_title', label: 'Mevcut unvan' },
      { key: 'target_role', label: 'Hedef rol' },
      { key: 'quality_score', label: 'Skor', type: 'number', list: true },
      { key: 'channel', label: 'Kanal' },
      { key: 'stage', label: 'Aşama', list: true },
      { key: 'owner', label: 'Sorumlu' },
      { key: 'last_contact_at', label: 'Son temas', type: 'date' },
      { key: 'notes', label: 'Notlar', type: 'textarea' },
    ],
  },
];

const TableManager = ({ def }: { def: TableDef }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from(def.table).select('*').order(def.order, { ascending: true });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [def.table]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => def.searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(s)));
  }, [rows, q, def.searchKeys]);

  const save = async () => {
    if (!editing) return;
    const payload: Row = {};
    for (const f of def.fields) payload[f.key] = editing[f.key] ?? null;
    const client = supabase as any;
    const res = editing.id
      ? await client.from(def.table).update(payload).eq('id', editing.id)
      : await client.from(def.table).insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success('Kaydedildi');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Silinsin mi?')) return;
    const { error } = await (supabase as any).from(def.table).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Silindi');
    load();
  };

  const listFields = def.fields.filter(f => f.list);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ara…" className="pl-8 h-9" />
        </div>
        <Button size="sm" onClick={() => setEditing({ ...def.defaults })} className="gap-1.5">
          <Plus className="w-4 h-4" /> Yeni
        </Button>
        <span className="text-xs text-muted-foreground">{filtered.length} kayıt</span>
      </div>

      {editing && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{editing.id ? 'Düzenle' : 'Yeni kayıt'}</span>
            <div className="flex gap-1">
              <Button size="sm" onClick={save} className="gap-1.5"><Save className="w-4 h-4" /> Kaydet</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {def.fields.map(f => (
              <label key={f.key} className="text-xs space-y-1">
                <span className="text-muted-foreground">{f.label}</span>
                {f.type === 'textarea' ? (
                  <Textarea
                    value={editing[f.key] ?? ''}
                    onChange={e => setEditing({ ...editing, [f.key]: e.target.value })}
                    rows={2}
                  />
                ) : f.type === 'bool' ? (
                  <div>
                    <input
                      type="checkbox"
                      checked={!!editing[f.key]}
                      onChange={e => setEditing({ ...editing, [f.key]: e.target.checked })}
                    />
                  </div>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={editing[f.key] ?? ''}
                    onChange={e =>
                      setEditing({
                        ...editing,
                        [f.key]: f.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value,
                      })
                    }
                    className="h-9"
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {listFields.map(f => <TableHead key={f.key}>{f.label}</TableHead>)}
              <TableHead className="w-24 text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={listFields.length + 1} className="text-xs text-muted-foreground">Yükleniyor…</TableCell></TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={listFields.length + 1} className="text-xs text-muted-foreground">Kayıt yok.</TableCell></TableRow>
            )}
            {filtered.map(r => (
              <TableRow key={r.id}>
                {listFields.map(f => (
                  <TableCell key={f.key} className="text-xs max-w-[220px] truncate">
                    {f.type === 'bool' ? (
                      <Badge variant={r[f.key] ? 'default' : 'secondary'}>{r[f.key] ? 'Aktif' : 'Pasif'}</Badge>
                    ) : f.key === 'tier' && r[f.key] ? (
                      <Badge variant="outline" className={tierClass(String(r[f.key]))}>T{tierKey(String(r[f.key]))}</Badge>
                    ) : (
                      String(r[f.key] ?? '—')
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ ...r })}>Düzenle</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const EcosystemAdmin = () => (
  <Tabs defaultValue={DEFS[0].table}>
    <TabsList className="flex-wrap h-auto">
      {DEFS.map(d => (
        <TabsTrigger key={d.table} value={d.table} className="gap-1.5">
          <d.icon className="w-4 h-4" /> {d.label}
        </TabsTrigger>
      ))}
    </TabsList>
    {DEFS.map(d => (
      <TabsContent key={d.table} value={d.table} className="mt-4">
        <TableManager def={d} />
      </TabsContent>
    ))}
  </Tabs>
);

export default EcosystemAdmin;
