import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Heart } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Heart className="w-3.5 h-3.5 text-primary" />
          <span>{t('footer.open_source')}</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/kvkk" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.kvkk')}</Link>
          <Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.cookies')}</Link>
          <Link to="/consent" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.consent')}</Link>
        </nav>
        <p className="text-xs text-muted-foreground">© 2026 WorkWorld — {t('footer.nonprofit')}</p>
      </div>
    </footer>
  );
};

export default Footer;
