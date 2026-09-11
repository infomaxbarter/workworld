import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, MapPin, Plus, Check, Trash2, Users, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Row {
  profileId: string;
  name: string;
  slug: string;
  avatar: string | null;
  city: string;
  country: string;
  profession: string;
  professionSlug: string | null;
}

type Axis = 'vertical' | 'horizontal';

const STORAGE_KEY = 'ww_team_roster';

const L = {
  title: { tr: 'Takım Kur', en: 'Build a Team', de: 'Team bilden' },
  subtitle: {
    tr: 'Dikey alanda meslektaşlar (aynı meslek, farklı lokasyonlar) veya yatay alanda meslektaşlar (aynı lokasyon, farklı meslekler) ile ekibini oluştur.',
    en: 'Assemble a team from vertical peers (same profession, different locations) or horizontal peers (same location, different professions).',
    de: 'Stelle ein Team aus vertikalen Kollegen (gleicher Beruf, andere Orte) oder horizontalen Kollegen (gleicher Ort, andere Berufe) zusammen.',
  },
  vertical: { tr: 'Dikey meslektaşlar', en: 'Vertical peers', de: 'Vertikale Kollegen' },
  verticalHint: { tr: 'Aynı meslek · farklı lokasyonlar', en: 'Same profession · different locations', de: 'Gleicher Beruf · andere Orte' },
  horizontal: { tr: 'Yatay meslektaşlar', en: 'Horizontal peers', de: 'Horizontale Kollegen' },
  horizontalHint: { tr: 'Aynı lokasyon · farklı meslekler', en: 'Same location · different professions', de: 'Gleicher Ort · andere Berufe' },
  pickProfession: { tr: 'Meslek seç', en: 'Select profession', de: 'Beruf wählen' },
  pickCity: { tr: 'Lokasyon seç', en: 'Select location', de: 'Ort wählen' },
  search: { tr: 'İsim, şehir veya meslek ara…', en: 'Search name, city or profession…', de: 'Name, Ort oder Beruf suchen…' },
  roster: { tr: 'Takımın', en: 'Your team', de: 'Dein Team' },
  empty: { tr: 'Henüz kimse eklenmedi.', en: 'No one added yet.', de: 'Noch niemand hinzugefügt.' },
  noResult: { tr: 'Sonuç bulunamadı.', en: 'No results found.', de: 'Keine Ergebnisse.' },
  add: { tr: 'Ekle', en: 'Add', de: 'Hinzufügen' },
  added: { tr: 'Eklendi', en: 'Added', de: 'Hinzugefügt' },
  clear: { tr: 'Temizle', en: 'Clear', de: 'Leeren' },
  copy: { tr: 'Listeyi kopyala', en: 'Copy list', de: 'Liste kopieren' },
  copied: { tr: 'Takım listesi kopyalandı', en: 'Team list copied', de: 'Teamliste kopiert' },
  people: { tr: 'kişi', en: 'people', de: 'Personen' },
  locations: { tr: 'lokasyon', en: 'locations', de: 'Orte' },
  professions: { tr: 'meslek', en: 'professions', de: 'Berufe' },
};

const TeamBuilder = ({ className = '' }: { className?: string }) => {
  const { lang } = useLanguage();
  const lp = useLocalizedPath();
  const tt = (k: keyof typeof L) => L[k][lang] ?? L[k].en;

  const [rows, setRows] = useState<Row[]>([]);
  const [axis, setAxis] = useState<Axis>('vertical');
  const [profession, setProfession] = useState('');
  const [place, setPlace] = useState('');
  const [q, setQ] = useState('');
  const [team, setTeam] = useState<Row[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as any)
        .from('profile_professions')
        .select('profile_id, professions(name,name_i18n,slug), profiles(id,display_name,slug,user_id,city,country,avatar_url,approved,status)')
        .limit(2000);
      if (!alive) return;
      const out: Row[] = [];
      ((data || []) as any[]).forEach((r) => {
        const p = r.profiles;
        const pr = r.professions;
        if (!p || !pr || p.approved === false) return;
        out.push({
          profileId: p.id,
          name: p.display_name,
          slug: p.slug || p.user_id,
          avatar: p.avatar_url,
          city: p.city || '',
          country: p.country || '',
          profession: pickI18n(pr.name_i18n, pr.name, lang),
          professionSlug: pr.slug,
        });
      });
      setRows(out);
    })();
    return () => { alive = false; };
  }, [lang]);

  const professions = useMemo(
    () => Array.from(new Set(rows.map(r => r.profession).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  const places = useMemo(
    () => Array.from(new Set(rows.map(r => (r.city ? `${r.city}${r.country ? `, ${r.country}` : ''}` : '')).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  useEffect(() => { if (!profession && professions.length) setProfession(professions[0]); }, [professions, profession]);
  useEffect(() => { if (!place && places.length) setPlace(places[0]); }, [places, place]);

  const placeOf = (r: Row) => (r.city ? `${r.city}${r.country ? `, ${r.country}` : ''}` : '');

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = rows.filter(r => (axis === 'vertical' ? r.profession === profession : placeOf(r) === place));
    const filtered = query
      ? base.filter(r => `${r.name} ${r.profession} ${placeOf(r)}`.toLowerCase().includes(query))
      : base;
    const map = new Map<string, Row[]>();
    filtered.forEach((r) => {
      const key = (axis === 'vertical' ? placeOf(r) : r.profession) || '—';
      const arr = map.get(key) || [];
      if (!arr.some(x => x.profileId === r.profileId)) arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  }, [rows, axis, profession, place, q]);

  const total = groups.reduce((s, [, v]) => s + v.length, 0);

  const persist = (next: Row[]) => {
    setTeam(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const inTeam = (id: string) => team.some(t => t.profileId === id);
  const toggle = (r: Row) => persist(inTeam(r.profileId) ? team.filter(t => t.profileId !== r.profileId) : [...team, r]);

  const copyTeam = () => {
    const text = team.map(t => `${t.name} — ${t.profession}${placeOf(t) ? ` — ${placeOf(t)}` : ''}`).join('\n');
    navigator.clipboard.writeText(text).then(() => toast.success(tt('copied')));
  };

  const selectCls = 'h-9 w-full px-2 rounded-md border border-input bg-background text-sm';

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base inline-flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {tt('title')}
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">{tt('subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Axis switch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(['vertical', 'horizontal'] as Axis[]).map((a) => (
            <button
              key={a}
              onClick={() => setAxis(a)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                axis === a ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowUpDown className={`w-3.5 h-3.5 ${a === 'horizontal' ? 'rotate-90' : ''}`} />
                {tt(a)}
              </span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">{tt(a === 'vertical' ? 'verticalHint' : 'horizontalHint')}</span>
            </button>
          ))}
        </div>

        {/* Selectors */}
        <div className="grid sm:grid-cols-2 gap-2">
          {axis === 'vertical' ? (
            <select className={selectCls} value={profession} onChange={e => setProfession(e.target.value)} aria-label={tt('pickProfession')}>
              <option value="">{tt('pickProfession')}</option>
              {professions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <select className={selectCls} value={place} onChange={e => setPlace(e.target.value)} aria-label={tt('pickCity')}>
              <option value="">{tt('pickCity')}</option>
              {places.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder={tt('search')} className="pl-9 h-9" />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {total} {tt('people')} · {groups.length} {tt(axis === 'vertical' ? 'locations' : 'professions')}
        </div>

        {/* Groups */}
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{tt('noResult')}</p>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {groups.map(([key, list]) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    {axis === 'vertical' ? <MapPin className="w-3 h-3" /> : null}{key}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{list.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {list.map((r) => (
                    <div key={`${key}-${r.profileId}`} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={r.avatar || undefined} />
                        <AvatarFallback className="text-[11px]">{r.name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <Link to={lp('humanDetail', { slug: r.slug })} className="min-w-0 flex-1 group">
                        <span className="block text-sm font-medium truncate group-hover:text-primary">{r.name}</span>
                        <span className="block text-[11px] text-muted-foreground truncate">
                          {axis === 'vertical' ? r.profession : placeOf(r) || r.profession}
                        </span>
                      </Link>
                      <Button
                        size="sm"
                        variant={inTeam(r.profileId) ? 'default' : 'outline'}
                        className="h-7 px-2 text-[11px] shrink-0"
                        onClick={() => toggle(r)}
                      >
                        {inTeam(r.profileId) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span className="ml-1 hidden sm:inline">{inTeam(r.profileId) ? tt('added') : tt('add')}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Roster */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{tt('roster')} ({team.length})</h3>
            {team.length > 0 && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={copyTeam}>
                  <Copy className="w-3 h-3 mr-1" />{tt('copy')}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => persist([])}>
                  <Trash2 className="w-3 h-3 mr-1" />{tt('clear')}
                </Button>
              </div>
            )}
          </div>
          {team.length === 0 ? (
            <p className="text-xs text-muted-foreground">{tt('empty')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {team.map(t => (
                <Badge key={t.profileId} variant="outline" className="gap-1 text-[11px] py-1">
                  {t.name} · {t.profession}
                  <button onClick={() => toggle(t)} aria-label="remove" className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamBuilder;
