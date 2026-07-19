import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { MCI_FIELD_DEFS, MCI_FORMULA_CODE } from '@/lib/mci';
import { MCI_SOURCES } from '@/lib/mciSources';
import MciSubmissionForm from '@/components/MciSubmissionForm';
import MciAdmin from '@/components/admin/MciAdmin';

interface Country {
  code: string; name: string; name_i18n: any; flag_emoji: string | null; active: boolean;
}
interface City {
  id: string; city: string; country_code: string; slug: string;
  cp_final: number | null; seat_quota: number | null; approved: boolean;
}

const VARIABLE_DICTIONARY = [
  ['N', 'Metropol/şehir toplam nüfusu (logaritmik törpü ile)'],
  ['G', 'Kişi başı GSYH (nominal USD)'],
  ['F', 'Aktif ticari firma/işletme sayısı'],
  ['U', 'Aktif üniversite sayısı'],
  ['S', 'Organize Sanayi Bölgesi / büyük sanayi merkezleri'],
  ['T', 'Teknokent, teknopark veya Ar-Ge merkezleri'],
  ['P_search', 'Google arama ivmesi indeksi (1-10)'],
  ['M_loc', 'Google Maps profesyonel yoğunluk (10 km² başına)'],
  ['H', 'Hibe/teşvik/VC erişim skoru (1-10)'],
  ['T_flow', 'Küresel yetenek/beyin göçü akışı (1-10)'],
  ['AI_index', 'Yapay zeka & otonomi adaptasyonu (1-10)'],
  ['ESG_score', 'Ekolojik direnç ve etki skoru (1-10)'],
  ['I_trade', '((Exp+Imp)/10) × (Exp/Imp) — küresel ticaret alt endeksi'],
  ['D_dyn', '(Y_ratio/E_ratio) × (B_rate/2.1) — demografik dinamizm (0.7–1.3 clamp)'],
  ['σ', 'Risk volatilitesi ve standart sapma (-0.10 .. +0.05)'],
  ['ΔPulse', 'Canlı nabız çarpanı (varsayılan 1.0)'],
  ['Net_syn', 'Nodal sinerji — matrisin diğer elit şehirleriyle bağlantı (1.0)'],
];

const MciPage = () => {
  const { lang } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: cty }, { data: sess }] = await Promise.all([
        supabase.from('pilot_countries').select('*').eq('active', true).order('code'),
        supabase.from('mci_cities').select('id, city, country_code, slug, cp_final, seat_quota, approved').eq('approved', true).order('cp_final', { ascending: false, nullsFirst: false }),
        supabase.auth.getSession(),
      ]);
      setCountries((c || []) as any);
      setCities((cty || []) as any);
      const uid = sess.session?.user?.id;
      if (uid) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin');
        setIsAdmin(!!(roles && roles.length));
      }
    })();
  }, []);

  const visibleCities = useMemo(
    () => selectedCountry === 'all' ? cities : cities.filter(c => c.country_code === selectedCountry),
    [cities, selectedCountry]
  );

  const copyCode = () => {
    navigator.clipboard.writeText(MCI_FORMULA_CODE);
    toast.success('Formül kodu panoya kopyalandı');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-8">
        <header className="text-center space-y-2">
          <Badge variant="outline" className="mb-2">MCI v7.0 · Production</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Matris Şehir Endeksi</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            WorkWorld "Tek Ülke, Tek Meslek" ağının motoru. Şehirlerin dijital, sosyo-ekonomik, ekolojik ve demografik gücünü
            kuantum düzeyinde ölçen açık kaynak algoritma. Formülün tamamı aşağıdadır.
          </p>
        </header>

        <Tabs defaultValue="cities">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="cities">Şehirler</TabsTrigger>
            <TabsTrigger value="formula">Formül</TabsTrigger>
            <TabsTrigger value="sources">Veri Kaynakları</TabsTrigger>
            <TabsTrigger value="submit">Öneri Gönder</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin"><ShieldCheck className="w-3.5 h-3.5 mr-1" />Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="cities" className="space-y-4 mt-6">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={selectedCountry === 'all' ? 'default' : 'outline'} onClick={() => setSelectedCountry('all')}>
                  Tüm Pilot Ülkeler
                </Button>
                {countries.map(c => (
                  <Button key={c.code} size="sm"
                    variant={selectedCountry === c.code ? 'default' : 'outline'}
                    onClick={() => setSelectedCountry(c.code)}>
                    <span className="mr-1.5">{c.flag_emoji}</span>
                    {pickI18n(c.name_i18n, c.name, lang)}
                  </Button>
                ))}
              </div>
              <Button asChild size="sm" variant="secondary">
                <a href="/mci/compare">Compare →</a>
              </Button>
            </div>

            {visibleCities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Bu ülkede henüz onaylı şehir yok. İlkini sen öner!
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleCities.map(c => {
                  const country = countries.find(k => k.code === c.country_code);
                  const pct = Math.min(100, ((c.cp_final || 0) / 600) * 100);
                  return (
                    <a key={c.id} href={`/mci/${c.slug || c.id}`} className="block">
                      <Card className="overflow-hidden hover:border-primary/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{c.city}</div>
                              <div className="text-xs text-muted-foreground">{country?.flag_emoji} {country?.name}</div>
                            </div>
                            <Badge className="text-base px-3">K {c.seat_quota ?? '—'}</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">CP_final</span>
                              <span className="font-mono">{c.cp_final?.toFixed(1) ?? '—'} / 600</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="formula" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Master Formül (Faz A · B · C)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="font-semibold mb-1">Faz A — Çekirdek Taban Puan (CP_base)</div>
                  <code className="block p-3 rounded bg-muted text-xs overflow-auto">
                    CP_base = 10·log₁₀(N) + G/1000 + F/10000 + U·1.5 + S + T·3<br/>
                    &nbsp;&nbsp;&nbsp;+ P_search·2.5 + M_loc/50 + H·2 + T_flow·1.5<br/>
                    &nbsp;&nbsp;&nbsp;+ AI_index·2 + ESG_score·1.2 + I_trade
                  </code>
                </div>
                <div>
                  <div className="font-semibold mb-1">Faz B — Dinamik Çarpanlar (CP_final)</div>
                  <code className="block p-3 rounded bg-muted text-xs overflow-auto">
                    CP_final = [CP_base · (1 ± σ)] · ΔPulse · Net_syn · D_dyn
                  </code>
                </div>
                <div>
                  <div className="font-semibold mb-1">Faz C — Koltuk Kontenjanı (K)</div>
                  <code className="block p-3 rounded bg-muted text-xs overflow-auto">
                    K = 3 + Floor(62 · (CP_final / 600))<br/>
                    CP_final &gt; 600 ⇒ K = 65 (Tavan)  ·  K &lt; 3 ⇒ K = 3 (Taban)
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Değişkenler Sözlüğü</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {VARIABLE_DICTIONARY.map(([k, v]) => (
                    <div key={k} className="flex gap-2 py-1 border-b border-border/50">
                      <code className="font-mono text-primary shrink-0 w-20">{k}</code>
                      <span className="text-muted-foreground text-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Açık Kaynak — JavaScript</CardTitle>
                <Button size="sm" variant="outline" onClick={copyCode}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Kopyala
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded bg-muted text-xs overflow-auto max-h-96"><code>{MCI_FORMULA_CODE}</code></pre>
                <p className="text-xs text-muted-foreground mt-3">
                  Bu kod WorkWorld altyapısında birebir bu şekilde çalışır. Lovable, PWA veya Supabase Edge Function ortamlarına doğrudan kopyalanabilir.
                  Sürüm geçmişi: MCI v2 (Legacy) → v3 (Legacy) → v5 (Stable) → v7 (Production).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Açık Kaynak Veri Akışı</CardTitle>
                <p className="text-sm text-muted-foreground pt-1">
                  Her değişkenin arkasındaki referans veri kaynakları. Rozet, önerilen yenileme sıklığını gösterir
                  (realtime · daily · weekly · monthly · quarterly · yearly). Tüm kaynaklar açık lisanslıdır;
                  scraper / cron-job'lar bu adresleri kullanır.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {MCI_SOURCES.map((v) => (
                  <div key={v.key} className="border-b border-border/50 last:border-0 pb-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <code className="font-mono text-primary font-semibold">{v.key}</code>
                      <span className="text-sm font-medium">{v.label}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase">{v.cadence}</Badge>
                    </div>
                    <ul className="space-y-1 text-xs pl-1">
                      {v.sources.map((s) => (
                        <li key={s.url} className="flex flex-wrap gap-2 items-center">
                          <a href={s.url} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1">
                            {s.name} <ExternalLink className="w-3 h-3" />
                          </a>
                          <Badge variant="outline" className="text-[10px]">{s.cadence}</Badge>
                          {s.license && <span className="text-muted-foreground">· {s.license}</span>}
                          {s.note && <span className="text-muted-foreground italic">— {s.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  Not: Realtime kaynaklar (Overpass, GDELT, Google Trends daily) doğrudan istemciden çekilebilir;
                  ağır API'lar (Crunchbase, LinkedIn Economic Graph) haftalık cron ile Lovable Cloud edge function
                  üzerinden mci_cities tablosuna yazılır. Kaynak formül CC-BY-4.0 / AGPL-3.0'dır.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submit" className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Aşağıdaki 20 metrikten en az temel olanları doldur; sistem MCI puanını ve koltuk kontenjanını canlı hesaplar.
              Öneriniz admin onayına düşer. Kaynak / referans belirtmeniz onay şansını artırır.
            </p>
            <MciSubmissionForm countries={countries} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-6">
              <MciAdmin />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default MciPage;
