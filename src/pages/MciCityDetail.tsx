import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GitCompare, ShieldCheck } from 'lucide-react';
import { MCI_FIELD_DEFS, calculateMCI, rowToMetrics } from '@/lib/mci';
import MciCitySources from '@/components/MciCitySources';
import MciCityHistory from '@/components/MciCityHistory';


interface CityRow { [k: string]: any }

const MciCityDetail = () => {
  const { slug } = useParams();
  const lp = useLocalizedPath();
  const [city, setCity] = useState<CityRow | null>(null);
  const [country, setCountry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase.from('mci_cities').select('*').or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
      if (data) {
        setCity(data);
        const { data: c } = await supabase.from('pilot_countries').select('*').eq('code', (data as any).country_code).maybeSingle();
        setCountry(c);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!city) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <p className="text-muted-foreground">City not found.</p>
      <Button asChild variant="outline"><Link to={lp('mci')}>Back to MCI</Link></Button>
    </div>
  );

  const result = calculateMCI(rowToMetrics(city));
  const pct = Math.min(100, (result.cp_final / 600) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={lp('mci')}><ArrowLeft className="w-4 h-4 mr-1" /> MCI</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`${lp('mci')}/compare?ids=${city.id}`}><GitCompare className="w-4 h-4 mr-1.5" /> Compare</Link>
          </Button>
        </div>

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {country?.flag_emoji} <span>{country?.name || city.country_code}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{city.city}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="text-lg px-3 py-1">K {result.seat_quota}</Badge>
            <span className="font-mono text-sm text-muted-foreground">CP_final: {result.cp_final} / 600</span>
            <span className="font-mono text-sm text-muted-foreground">CP_base: {result.cp_base}</span>
            {typeof city.data_quality_score === 'number' && (
              <Badge variant={city.data_quality_score >= 70 ? 'default' : 'secondary'} className="gap-1">
                <ShieldCheck className="w-3 h-3" /> Kalite {Math.round(city.data_quality_score)}%
              </Badge>
            )}
            {city.verification_status && city.verification_status !== 'unverified' && (
              <Badge variant="outline">{city.verification_status}</Badge>
            )}
            {city.data_version && <Badge variant="outline">v{city.data_version}</Badge>}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </header>


        <div className="grid sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">I_trade</div><div className="text-2xl font-mono font-semibold">{result.I_trade}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">D_dyn</div><div className="text-2xl font-mono font-semibold">{result.D_dyn}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">σ · ΔPulse · Net_syn</div><div className="text-sm font-mono font-semibold">{city.sigma} · {city.delta_pulse} · {city.net_syn}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Metric Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {MCI_FIELD_DEFS.map(f => (
                <div key={f.key} className="flex items-baseline justify-between gap-2 py-1 border-b border-border/50">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{f.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{f.hint}</div>
                  </div>
                  <span className="font-mono text-primary shrink-0">{Number(city[f.column]).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {city.notes && (
          <Card><CardContent className="p-4 text-sm text-muted-foreground"><b className="text-foreground">Notes: </b>{city.notes}</CardContent></Card>
        )}

        <MciCitySources cityId={city.id} isAdmin={isAdmin} />
        <MciCityHistory cityId={city.id} />

      </div>
      <Footer />
    </div>
  );
};

export default MciCityDetail;
