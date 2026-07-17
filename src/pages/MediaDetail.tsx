import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { pickI18n } from '@/i18n/i18nField';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Play, Headphones, FileText } from 'lucide-react';
import type { MediaType } from './MediaListPage';

const iconFor = (t: MediaType) => t === 'blog' ? FileText : t === 'video' ? Play : Headphones;

/** Best-effort embed URL conversion. */
function toEmbed(url: string): string {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`;
    // Vimeo
    if (u.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video${u.pathname}`;
    // Spotify
    if (u.hostname.includes('spotify.com')) {
      return url.replace('spotify.com/', 'spotify.com/embed/');
    }
    // SoundCloud
    if (u.hostname.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return url;
  }
}

const MediaDetail = ({ type }: { type: MediaType }) => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const lp = useLocalizedPath();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const Icon = iconFor(type);
  const listKey = type === 'blog' ? 'blog' : type === 'video' ? 'videos' : 'podcast';

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      let q = supabase.from('media_content').select('*').eq('type', type).eq('status', 'approved').limit(1);
      // slug OR id
      const { data } = await q.or(`slug.eq.${slug},id.eq.${slug}`);
      setItem(data && data[0] ? data[0] : null);
      setLoading(false);
    })();
  }, [slug, type]);

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!item) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">{t('media.not_found')}</div>
        <Footer />
      </div>
    );
  }

  const title = pickI18n(item.title_i18n, lang, item.title);
  const desc = pickI18n(item.description_i18n, lang, item.description || '');
  const body = pickI18n(item.body_i18n, lang, item.body || '');
  const embed = item.media_url ? toEmbed(item.media_url) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <article className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <Link to={lp(listKey as any)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('event.back')}
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="gap-1"><Icon className="w-3 h-3" />{t(`media.type_${type}`)}</Badge>
          {item.published_at && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(item.published_at).toLocaleDateString(lang)}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">{title}</h1>
        {desc && <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{desc}</p>}

        {embed && (type === 'video' || type === 'podcast') && (
          <div className={`mb-8 rounded-xl overflow-hidden border border-border bg-black ${type === 'podcast' ? 'aspect-[3/1]' : 'aspect-video'}`}>
            <iframe
              src={embed}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        )}

        {item.cover_url && type === 'blog' && (
          <img src={item.cover_url} alt={title} className="w-full rounded-xl mb-8 border border-border" />
        )}

        {body && (
          <div className="prose prose-neutral dark:prose-invert max-w-none mb-8 whitespace-pre-wrap">
            {body}
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {item.tags.map((tag: string) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-8">
          <CommentsSection targetType={`media_${type}`} targetId={item.id} />
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default MediaDetail;
