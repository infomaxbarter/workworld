import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Moon, Sun, LogIn, LogOut, User, Globe, Shield, Users, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';
import type { User as SupaUser } from '@supabase/supabase-js';

const langLabels: Record<Lang, string> = { tr: 'TR', en: 'EN', de: 'DE' };

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [user, setUser] = useState<SupaUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').then(({ data }) => {
          setIsAdmin(!!(data && data.length > 0));
        });
      } else {
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').then(({ data }) => {
          setIsAdmin(!!(data && data.length > 0));
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
            Work<span className="text-primary">World</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/humans" className="gap-1.5">
                <Users className="w-4 h-4" />
                {t('nav.humans')}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/events" className="gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {t('nav.events')}
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          {/* Mobile nav */}
          <div className="sm:hidden flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/humans"><Users className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/events"><CalendarDays className="w-4 h-4" /></Link>
            </Button>
          </div>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{langLabels[lang]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(langLabels) as Lang[]).map((l) => (
                <DropdownMenuItem key={l} onClick={() => setLang(l)} className={lang === l ? 'font-semibold' : ''}>
                  {langLabels[l]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark mode */}
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Auth */}
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/admin"><Shield className="w-4 h-4" /></Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link to={`/profile/${user.id}`}><User className="w-4 h-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth" className="gap-1.5">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
