import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Briefcase, Search, Users } from 'lucide-react';

interface Profession {
  id: string; name: string; slug: string | null; description: string | null;
  icon: string; status: string; created_at: string; member_count?: number;
}

const ProfessionsPage = () => {
  const { t } = useLanguage();
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: profs } = await supabase.from('professions').select('*').eq('status', 'active').order('name');
      if (profs) {
        const { data: counts } = await supabase.from('profile_professions').select('profession_id');
        const countMap = new Map<string, number>();
        counts?.forEach((c: any) => { countMap.set(c.profession_id, (countMap.get(c.profession_id) || 0) + 1); });
        setProfessions((profs as any[]).map(p => ({ ...p, member_count: countMap.get(p.id) || 0 })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = professions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t('professions.title')}</h1>
        <p className="text-muted-foreground">{t('professions.subtitle')}</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('professions.search_placeholder')}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} {t('professions.total')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Link key={p.id} to={`/professions/${p.slug || p.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{p.member_count} {t('professions.members')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">{t('professions.no_results')}</p>}
    </div>
  );
};

export default ProfessionsPage;
