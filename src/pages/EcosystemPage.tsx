import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import PageSeo from '@/components/PageSeo';
import Footer from '@/components/Footer';
import RelatedContent from '@/components/RelatedContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, MapPin, Users, Briefcase, Trophy, LayoutGrid, List, ArrowRight, Map as MapIcon } from 'lucide-react';
import TurkeyEcosystemMap from '@/components/TurkeyEcosystemMap';
import { et, tierClass, tierKey, type Province, type Vertical, type AmbassadorLevel } from '@/lib/ecosystem';

const EcosystemPage = () => {
  const { lang } = useLanguage();
  const lp = useLocalizedPath();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [levels, setLevels] = useState<AmbassadorLevel[]>([]);
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  const [tier, setTier] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    (async () => {
      const [p, v, l] = await Promise.all([
        (supabase as any).from('tr_provinces').select('*').eq('active', true).order('plate_no'),
        (supabase as any).from('tr_verticals').select('*').eq('active', true).order('sort_order'),
        (supabase as any).from('ambassador_levels').select('*').order('sort_order'),
      ]);
      setProvinces((p.data || []) as Province[]);
      setVerticals((v.data || []) as Vertical[]);
      setLevels((l.data || []) as AmbassadorLevel[]);
    })();
  }, []);

  const regions = useMemo(() => Array.from(new Set(provinces.map(p => p.region))).sort(), [provinces]);
  const tiers = useMemo(() => Array.from(new Set(provinces.map(p => p.tier))).sort(), [provinces]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return provinces.filter(p => {
      if (region && p.region !== region) return false;
      if (tier && p.tier !== tier) return false;
      if (!s) return true;
      return [p.name, p.focus_sectors, p.local_hubs, p.community_channels, p.value_proposition, String(p.plate_no)]
        .some(f => (f || '').toString().toLowerCase().includes(s));
    });
  }, [provinces, q, region, tier]);

  const totalReps = filtered.reduce((a, p) => a + (p.target_representatives || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageSeo
        title="Türkiye Ecosystem Map — 81 Provinces & Professional Verticals"
        description="Open directory of Türkiye's 81 provinces: ecosystem tiers, focus sectors, tech parks, community channels and target representative quotas."
      />
      <section className="px-4 pt-10 pb-4 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{et('title', lang)}</h1>
        <p className="text-muted-foreground mt-2">{et('subtitle', lang)}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
          {[
            { icon: MapPin, label: et('provinceCount', lang), value: provinces.length },
            { icon: Users, label: et('totalReps', lang), value: provinces.reduce((a, p) => a + p.target_representatives, 0) },
            { icon: Briefcase, label: et('verticals', lang), value: verticals.length },
            { icon: Trophy, label: et('levels', lang), value: levels.length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-3">
              <s.icon className="w-4 h-4 text-primary" />
              <div className="text-2xl font-semibold mt-1">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-12 max-w-6xl mx-auto w-full">
        <Tabs defaultValue="map">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="map" className="gap-1.5"><MapIcon className="w-4 h-4" /> {lang === 'tr' ? 'Harita' : lang === 'de' ? 'Karte' : 'Map'}</TabsTrigger>
            <TabsTrigger value="provinces" className="gap-1.5"><MapPin className="w-4 h-4" /> {et('provinces', lang)}</TabsTrigger>
            <TabsTrigger value="verticals" className="gap-1.5"><Briefcase className="w-4 h-4" /> {et('verticals', lang)}</TabsTrigger>
            <TabsTrigger value="levels" className="gap-1.5"><Trophy className="w-4 h-4" /> {et('levels', lang)}</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <TurkeyEcosystemMap provinces={provinces} verticals={verticals} levels={levels} />
          </TabsContent>


          <TabsContent value="provinces" className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder={et('search', lang)} className="pl-8 h-9" />
              </div>
              <select value={region} onChange={e => setRegion(e.target.value)} className="h-9 px-2 rounded border border-border bg-background text-sm">
                <option value="">{et('allRegions', lang)}</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={tier} onChange={e => setTier(e.target.value)} className="h-9 px-2 rounded border border-border bg-background text-sm">
                <option value="">{et('allTiers', lang)}</option>
                {tiers.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex items-center rounded border border-border overflow-hidden">
                {([['grid', LayoutGrid], ['list', List]] as const).map(([v, Icon]) => (
                  <button key={v} onClick={() => setView(v)} aria-label={v}
                          className={`h-9 w-9 flex items-center justify-center ${view === v ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {filtered.length} {et('provinceCount', lang)} · {totalReps} {et('totalReps', lang).toLowerCase()}
            </p>

            {filtered.length === 0 && <p className="text-sm text-muted-foreground py-6">{et('noResult', lang)}</p>}

            {view === 'grid' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(p => (
                  <Link key={p.id} to={lp('provinceDetail', { slug: p.slug || String(p.plate_no) })}
                        className="rounded-lg border border-border p-3 hover:border-primary/50 transition-colors group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-muted-foreground">{String(p.plate_no).padStart(2, '0')}</div>
                        <h2 className="font-semibold group-hover:text-primary">{p.name}</h2>
                        <div className="text-[11px] text-muted-foreground">{p.region}</div>
                      </div>
                      <Badge variant="outline" className={tierClass(p.tier)}>T{tierKey(p.tier)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.focus_sectors}</p>
                    <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {p.target_representatives}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead>{et('provinceCount', lang)}</TableHead>
                      <TableHead>{et('region', lang)}</TableHead>
                      <TableHead>{et('tier', lang)}</TableHead>
                      <TableHead className="hidden md:table-cell">{et('sectors', lang)}</TableHead>
                      <TableHead className="text-right">{et('targetReps', lang)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.plate_no}</TableCell>
                        <TableCell>
                          <Link className="font-medium hover:text-primary" to={lp('provinceDetail', { slug: p.slug || String(p.plate_no) })}>{p.name}</Link>
                        </TableCell>
                        <TableCell className="text-xs">{p.region}</TableCell>
                        <TableCell><Badge variant="outline" className={tierClass(p.tier)}>T{tierKey(p.tier)}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-sm truncate">{p.focus_sectors}</TableCell>
                        <TableCell className="text-right">{p.target_representatives}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="verticals" className="mt-4">
            <div className="grid md:grid-cols-2 gap-3">
              {verticals.map(v => (
                <Card key={v.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">{v.code}</Badge> {v.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {([['roles', v.target_roles], ['supply', v.barter_supply], ['demand', v.typical_demand], ['idealRep', v.ideal_representative], ['discovery', v.discovery_channels]] as const).map(([k, val]) => val && (
                      <div key={k}>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{et(k as any, lang)}</div>
                        <div>{val}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="levels" className="mt-4">
            <div className="grid md:grid-cols-2 gap-3">
              {levels.map(l => (
                <Card key={l.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge className="font-mono">{l.code}</Badge> {l.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {([['requirements', l.requirements], ['rights', l.rights], ['badges', l.badges], ['motivation', l.motivation]] as const).map(([k, val]) => val && (
                      <div key={k}>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{et(k as any, lang)}</div>
                        <div>{val}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-10">
          <RelatedContent />
        </div>
      </section>

      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default EcosystemPage;
