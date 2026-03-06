import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© 2026 WorkWorld</p>
        <nav className="flex items-center gap-6">
          <Link to="/kvkk" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.kvkk')}</Link>
          <Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.cookies')}</Link>
          <Link to="/consent" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.consent')}</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
