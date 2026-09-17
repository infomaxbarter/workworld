import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Users, CalendarDays, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import type { RouteKey } from '@/i18n/routes';

const BottomNav = () => {
  const { t } = useLanguage();
  const lp = useLocalizedPath();
  const { pathname } = useLocation();

  const items: { key: RouteKey; icon: any; label: string }[] = [
    { key: 'home', icon: Home, label: t('nav.home') === 'nav.home' ? 'Home' : t('nav.home') },
    { key: 'map', icon: Map, label: t('nav.map') },
    { key: 'humans', icon: Users, label: t('nav.humans') },
    { key: 'events', icon: CalendarDays, label: t('nav.events') },
    { key: 'mci', icon: LayoutGrid, label: 'MCI' },
  ];

  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ key, icon: Icon, label }) => {
          const to = lp(key);
          const active = key === 'home' ? pathname === '/' : pathname.startsWith(to);
          return (
            <li key={key}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-[64px]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
