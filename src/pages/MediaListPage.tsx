import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { pickI18n } from '@/i18n/i18nField';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Headphones, FileText, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-3">
            <Icon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">{t(`${type === 'video' ? 'videos' : type}.title`)}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t(`${type === 'video' ? 'videos' : type}.subtitle`)}</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('media.empty')}</div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const title = pickI18n(item.title_i18n, lang, item.title);
              const desc = pickI18n(item.description_i18n, lang, item.description || '');
              return (
                <Link
                  key={item.id}
                  to={lp(detailKey as any, { slug: item.slug || item.id })}
                  className="group"
                >
                  <Card className="overflow-hidden h-full transition-all hover:border-primary/50 hover:shadow-lg">
                    {item.cover_url && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={item.cover_url}
                          alt={title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="gap-1">
                          <Icon className="w-3 h-3" />
                          {t(`media.type_${type}`)}
                        </Badge>
                        {item.published_at && (
                          <span>{new Date(item.published_at).toLocaleDateString(lang)}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                      {desc && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{desc}</p>
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
