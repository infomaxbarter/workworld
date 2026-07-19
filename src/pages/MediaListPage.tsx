import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { pickI18n } from '@/i18n/i18nField';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Play, Headphones, FileText, ArrowRight, Search, X } from 'lucide-react';
import PageSeo from '@/components/PageSeo';

export type MediaType = 'blog' | 'video' | 'podcast';

interface MediaItem {
  id: string;
  slug: string | null;
  type: MediaType;
  title: string;
  description: string | null;
  cover_url: string | null;
  media_url: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
  title_i18n: any;
  description_i18n: any;
}

const iconFor = (t: MediaType) => t === 'blog' ? FileText : t === 'video' ? Play : Headphones;

const MediaListPage = ({ type }: { type: MediaType }) => {
  const { t, lang } = useLanguage();
  const lp = useLocalizedPath();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [range, setRange] = useState<'all' | '7d' | '30d' | '1y'>('all');
  const Icon = iconFor(type);
  const detailKey = type === 'blog' ? 'blogDetail' : type === 'video' ? 'videoDetail' : 'podcastDetail';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('media_content')
        .select('id, slug, type, title, description, cover_url, media_url, tags, published_at, created_at, title_i18n, description_i18n')
        .eq('type', type)
        .eq('status', 'approved')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      setItems((data as MediaItem[]) || []);
      setLoading(false);
    })();
  }, [type]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => (i.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoffs: Record<string, number> = { '7d': 7, '30d': 30, '1y': 365 };
    const days = cutoffs[range];
    const query = q.toLowerCase();
    return items.filter(i => {
      if (tag && !(i.tags || []).includes(tag)) return false;
      if (days) {
        const dateStr = i.published_at || i.created_at;
        if (!dateStr || (now - new Date(dateStr).getTime()) > days * 86400_000) return false;
      }
      if (query) {
        const title = pickI18n(i.title_i18n, i.title, lang).toLowerCase();
        const desc = pickI18n(i.description_i18n, i.description || '', lang).toLowerCase();
        if (!title.includes(query) && !desc.includes(query) && !(i.tags || []).some(t => t.toLowerCase().includes(query))) return false;
      }
      return true;
    });
  }, [items, q, tag, range, lang]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageSeo title={`${type === 'blog' ? 'Blog' : type === 'video' ? 'Videos' : 'Podcast'} — WorkWorldMap`} description={`Latest ${type} content from the WorkWorldMap community.`} />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 text-primary mb-3">
            <Icon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">{t(`${type === 'video' ? 'videos' : type}.title`)}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t(`${type === 'video' ? 'videos' : type}.subtitle`)}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search.hero_placeholder') || 'Search…'} className="pl-9" />
          </div>
          <div className="flex gap-1">
            {(['all', '7d', '30d', '1y'] as const).map(r => (
              <Button key={r} size="sm" variant={range === r ? 'default' : 'outline'} onClick={() => setRange(r)} className="text-xs">
                {r === 'all' ? (t('status.tab_all') || 'All') : r}
              </Button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {tag && (
              <button onClick={() => setTag(null)} className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] bg-primary text-primary-foreground">
                {tag} <X className="w-3 h-3" />
              </button>
            )}
            {!tag && allTags.slice(0, 12).map(tg => (
              <button key={tg} onClick={() => setTag(tg)}
                className="inline-flex items-center h-6 px-2 rounded-full text-[11px] border border-border text-muted-foreground hover:text-foreground hover:border-primary/50">
                #{tg}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-3">{filtered.length} / {items.length}</p>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('media.empty')}</div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const title = pickI18n(item.title_i18n, item.title, lang);
              const desc = pickI18n(item.description_i18n, item.description || '', lang);
              return (
                <Link key={item.id} to={lp(detailKey as any, { slug: item.slug || item.id })} className="group">
                  <Card className="overflow-hidden h-full transition-all hover:border-primary/50 hover:shadow-lg">
                    {item.cover_url && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img src={item.cover_url} alt={title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="gap-1">
                          <Icon className="w-3 h-3" />
                          {t(`media.type_${type}`)}
                        </Badge>
                        {item.published_at && <span>{new Date(item.published_at).toLocaleDateString(lang)}</span>}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
                      {desc && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{desc}</p>}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.slice(0, 3).map(tg => (
                            <span key={tg} className="text-[10px] text-muted-foreground">#{tg}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        {type === 'video' ? t('media.watch') : type === 'podcast' ? t('media.listen') : t('media.read_more')}
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MediaListPage;

