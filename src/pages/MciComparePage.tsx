import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { MCI_FIELD_DEFS } from '@/lib/mci';

interface City { id: string; city: string; slug: string | null; country_code: string; cp_final: number | null; seat_quota: number | null; [k: string]: any }

const MciComparePage = () => {
  const lp = useLocalizedPath();
  const [params, setParams] = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const selected = useMemo(() => (params.get('ids') || '').split(',').filter(Boolean), [params]);

  useEffect(() => {
    supabase.from('mci_cities').select('*').eq('approved', true)
      .order('cp_final', { ascending: false, nullsFirst: false })
      .then(({ data }) => setCities((data as City[]) || []));
  }, []);

  const selectedCities = useMemo(() => selected.map(id => cities.find(c => c.id === id)).filter(Boolean) as City[], [selected, cities]);

  const toggle = (id: string) => {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id); else if (set.size < 4) set.add(id);
    setParams({ ids: Array.from(set).join(',') });
  };

  const max: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    MCI_FIELD_DEFS.forEach(f => {
      m[f.column] = Math.max(...selectedCities.map(c => Number(c[f.column]) || 0), 1);
    });
    return m;
  }, [selectedCities]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to={lp('mci')}><ArrowLeft className="w-4 h-4 mr-1" /> MCI</Link>
          </Button>
          <span className="text-xs text-muted-foreground">{selected.length}/4 selected</span>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Compare Cities</h1>
          <p className="text-sm text-muted-foreground">Pick up to 4 cities to compare metric by metric.</p>
        </header>

        {/* Picker */}
        <div className="flex flex-wrap gap-1.5">
          {cities.slice(0, 40).map(c => {
            const active = selected.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                disabled={!active && selected.length >= 4}
                className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs border transition-colors ${
                  active ? 'bg-primary text-primary-foreground border-primary'
                         : 'border-border text-muted-foreground hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {active ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {c.city} · {c.country_code}
              </button>
            );
          })}
        </div>

        {selectedCities.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">Select cities above to start comparing.</CardContent></Card>
        ) : (
          <>
            {/* Score header */}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedCities.length}, minmax(0, 1fr))` }}>
              {selectedCities.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-4 space-y-2">
                    <div>
                      <div className="font-semibold">{c.city}</div>
                      <div className="text-xs text-muted-foreground">{c.country_code}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-base px-2">K {c.seat_quota ?? '—'}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">{c.cp_final?.toFixed(0) ?? '—'}/600</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Metric rows with bar comparison */}
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {MCI_FIELD_DEFS.map(f => (
                  <div key={f.key} className="p-4 grid gap-2" style={{ gridTemplateColumns: `160px repeat(${selectedCities.length}, minmax(0, 1fr))` }}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{f.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{f.hint}</div>
                    </div>
                    {selectedCities.map(c => {
                      const v = Number(c[f.column]) || 0;
                      const pct = max[f.column] ? (v / max[f.column]) * 100 : 0;
                      const best = v === max[f.column] && v > 0;
                      return (
                        <div key={c.id} className="space-y-1">
                          <div className={`text-xs font-mono ${best ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            {v.toLocaleString()}
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${best ? 'bg-primary' : 'bg-muted-foreground/40'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MciComparePage;
