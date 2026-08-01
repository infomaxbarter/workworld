import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { Heart, Github } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();
  const lp = useLocalizedPath();
  const [social, setSocial] = useState<{ id: string; platform: string; url: string; label: string | null }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('social_links').select('id, platform, url, label').eq('active', true).order('sort_order');
      setSocial(data || []);
    })();
  }, []);

  return (
    <footer className="border-t border-border bg-card py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Heart className="w-3.5 h-3.5 text-primary" />
          <span>{t('footer.open_source')}</span>
        </div>
        <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
          <Link to={lp('blog')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.blog')}</Link>
          <Link to={lp('videos')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.videos')}</Link>
          <Link to={lp('podcast')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.podcast')}</Link>
          <Link to={lp('analytics')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.analytics')}</Link>
          <Link to={lp('mci')} className="text-sm text-primary hover:underline transition-colors font-medium">MCI v7.0</Link>
          <a href="https://github.com/workworldmap/workworldmap" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
          <Link to={lp('kvkk')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.kvkk')}</Link>
          <Link to={lp('cookies')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.cookies')}</Link>
          <Link to={lp('consent')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.consent')}</Link>
          <Link to={lp('terms')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.terms')}</Link>
        </nav>

        {social.length > 0 && (
          <nav aria-label="Social media" className="flex items-center gap-4 flex-wrap justify-center">
            {social.map(sl => (
              <a key={sl.id} href={sl.url} target="_blank" rel="noopener noreferrer"
                className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
                {sl.label || sl.platform}
              </a>
            ))}
          </nav>
        )}

        <p className="text-xs text-muted-foreground">© 2026 Work<span className="text-primary">World</span>Map — {t('footer.nonprofit')}</p>
      </div>
    </footer>
  );
};

export default Footer;
