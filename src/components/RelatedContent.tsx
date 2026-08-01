import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Sparkles } from 'lucide-react';

type Kind = 'media' | 'events' | 'professions' | 'cities' | 'humans';

interface Item {
  kind: Kind;
  title: string;
  subtitle?: string;
  to: string;
}

interface Props {
  /** which content buckets to pull cross-promotion from */
  kinds?: Kind[];
  /** exclude an item by title (e.g. current page) */
  excludeTitle?: string;
  variant?: 'sidebar' | 'footer';
  limitPerKind?: number;
  className?: string;
}

const KIND_LABEL: Record<Kind, string> = {
  media: 'Media',
  events: 'Event',
  professions: 'Profession',
  cities: 'City',
  humans: 'Community',
};

const RelatedContent = ({
  kinds = ['media', 'events', 'professions', 'cities'],
  excludeTitle,
  variant = 'footer',
  limitPerKind = 3,
  className = '',
}: Props) => {
  const lp = useLocalizedPath();
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Item[] = [];
      const tasks: Promise<void>[] = [];

      if (kinds.includes('media')) tasks.push((async () => {
        const { data } = await (supabase as any).from('media_content')
          .select('title,title_i18n,slug,type').eq('status', 'published')
          .order('published_at', { ascending: false }).limit(limitPerKind);
        (data || []).forEach((m: any) => out.push({
          kind: 'media',
          title: pickI18n(m.title_i18n, m.title, lang),
          subtitle: m.type,
          to: lp(m.type === 'video' ? 'videoDetail' : m.type === 'podcast' ? 'podcastDetail' : 'blogDetail', { slug: m.slug }),
        }));
      })());

      if (kinds.includes('events')) tasks.push((async () => {
        const { data } = await supabase.from('event_markers')
          .select('title,title_i18n,slug,city,status').eq('status', 'active')
          .order('created_at', { ascending: false }).limit(limitPerKind);
        (data || []).forEach((e: any) => out.push({
          kind: 'events',
          title: pickI18n(e.title_i18n, e.title, lang),
          subtitle: e.city || undefined,
          to: lp('eventDetail', { slug: e.slug }),
        }));
      })());

      if (kinds.includes('professions')) tasks.push((async () => {
        const { data } = await supabase.from('professions')
          .select('name,name_i18n,slug').eq('status', 'active')
          .order('created_at', { ascending: false }).limit(limitPerKind);
        (data || []).forEach((p: any) => out.push({
          kind: 'professions',
          title: pickI18n(p.name_i18n, p.name, lang),
          to: lp('professionDetail', { slug: p.slug }),
        }));
      })());

      if (kinds.includes('cities')) tasks.push((async () => {
        const { data } = await (supabase as any).from('mci_cities')
          .select('city,slug,country_code,seat_quota').eq('approved', true)
          .order('cp_final', { ascending: false }).limit(limitPerKind);
        (data || []).forEach((c: any) => out.push({
          kind: 'cities',
          title: c.city,
          subtitle: c.country_code ? `${c.country_code} · K ${c.seat_quota ?? '—'}` : undefined,
          to: lp('mciCityDetail', { slug: c.slug }),
        }));
      })());

      if (kinds.includes('humans')) tasks.push((async () => {
        const { data } = await supabase.from('profiles')
          .select('display_name,slug,user_id,city').eq('approved', true)
          .order('created_at', { ascending: false }).limit(limitPerKind);
        (data || []).forEach((p: any) => out.push({
          kind: 'humans',
          title: p.display_name,
          subtitle: p.city || undefined,
          to: lp('humanDetail', { slug: p.slug || p.user_id }),
        }));
      })());

      await Promise.all(tasks);
      if (!alive) return;
      setItems(out.filter(i => i.title && i.title !== excludeTitle));
    })();
    return () => { alive = false; };
  }, [lang, excludeTitle, kinds.join(','), limitPerKind]);

  if (items.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {variant === 'sidebar' ? t('related.editor_picks') : t('related.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={variant === 'sidebar' ? 'space-y-1.5' : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-2'}>
          {items.map((item, i) => (
            <Link
              key={`${item.kind}-${i}`}
              to={item.to}
              className="group flex items-center justify-between gap-2 p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate group-hover:text-primary">{item.title}</span>
                {item.subtitle && <span className="block text-[11px] text-muted-foreground truncate">{item.subtitle}</span>}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Badge variant="secondary" className="text-[10px]">{KIND_LABEL[item.kind]}</Badge>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RelatedContent;
