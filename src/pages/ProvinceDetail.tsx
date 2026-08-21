import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import PageSeo from '@/components/PageSeo';
import Footer from '@/components/Footer';
import RelatedContent from '@/components/RelatedContent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Users, Building2, MessagesSquare, Sparkles } from 'lucide-react';
import { et, tierClass, tierKey, type Province, type Vertical } from '@/lib/ecosystem';

const ProvinceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const lp = useLocalizedPath();
  const [province, setProvince] = useState<Province | null>(null);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const client = supabase as any;
      let { data } = await client.from('tr_provinces').select('*').eq('slug', slug).maybeSingle();
      if (!data && /^\d+$/.test(slug)) {
        const byPlate = await client.from('tr_provinces').select('*').eq('plate_no', Number(slug)).maybeSingle();
        data = byPlate.data;
      }
      setProvince((data || null) as Province | null);
      const v = await client.from('tr_verticals').select('*').eq('active', true).order('sort_order');
      setVerticals((v.data || []) as Vertical[]);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-sm text-muted-foreground">…</div>;
  }

  if (!province) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-sm text-muted-foreground">{et('noResult', lang)}</p>
        <Link to={lp('ecosystem')} className="text-sm text-primary inline-flex items-center gap-1 mt-3">
          <ArrowLeft className="w-4 h-4" /> {et('back', lang)}
        </Link>
      </div>
    );
  }

  const sectors = (province.focus_sectors || '').split(/[,;/]/).map(s => s.trim()).filter(Boolean);
  const hubs = (province.local_hubs || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
  const channels = (province.community_channels || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);

  const blocks: { icon: typeof Building2; label: string; items: string[] }[] = [
    { icon: Sparkles, label: et('sectors', lang), items: sectors },
    { icon: Building2, label: et('hubs', lang), items: hubs },
    { icon: MessagesSquare, label: et('channels', lang), items: channels },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageSeo
        title={`${province.name} — ${et('title', lang)}`}
        description={
          province.value_proposition ||
          `${province.name}: ${province.region}, ${province.tier}, ${province.target_representatives} ${et('targetReps', lang).toLowerCase()}.`
        }
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Place',
          name: province.name,
          address: { '@type': 'PostalAddress', addressRegion: province.region, addressCountry: 'TR' },
          ...(province.lat && province.lng
            ? { geo: { '@type': 'GeoCoordinates', latitude: province.lat, longitude: province.lng } }
            : {}),
        }}
      />

      <section className="px-4 pt-10 pb-4 max-w-5xl mx-auto w-full">
        <Link to={lp('ecosystem')} className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {et('back', lang)}
        </Link>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="font-mono text-sm text-muted-foreground">{String(province.plate_no).padStart(2, '0')}</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{province.name}</h1>
          <Badge variant="outline" className={tierClass(province.tier)}>T{tierKey(province.tier)} · {province.tier}</Badge>
        </div>

        <p className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-sm">
          <MapPin className="w-4 h-4" /> {province.region}
        </p>

        {province.value_proposition && (
          <p className="mt-4 text-sm leading-relaxed max-w-3xl">{province.value_proposition}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
          {[
            { label: et('targetReps', lang), value: province.target_representatives, icon: Users },
            { label: et('sectors', lang), value: sectors.length, icon: Sparkles },
            { label: et('hubs', lang), value: hubs.length, icon: Building2 },
            { label: et('channels', lang), value: channels.length, icon: MessagesSquare },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border p-3">
              <s.icon className="w-4 h-4 text-primary" />
              <div className="text-2xl font-semibold mt-1">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6 max-w-5xl mx-auto w-full grid md:grid-cols-3 gap-3">
        {blocks.map(b => (
          <Card key={b.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><b.icon className="w-4 h-4 text-primary" /> {b.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {b.items.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
              {b.items.map(i => <Badge key={i} variant="secondary" className="font-normal">{i}</Badge>)}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="px-4 pb-12 max-w-5xl mx-auto w-full">
        <h2 className="text-lg font-semibold mb-3">{et('verticals', lang)}</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {verticals.map(v => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">{v.code}</Badge> {v.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {v.target_roles && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{et('roles', lang)}</div>
                    <div>{v.target_roles}</div>
                  </div>
                )}
                {v.ideal_representative && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{et('idealRep', lang)}</div>
                    <div>{v.ideal_representative}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <RelatedContent excludeTitle={province.name} />
        </div>
      </section>

      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default ProvinceDetail;
