import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Moon, Sun, LogIn, LogOut, User, Globe, Shield, Users, CalendarDays, Map, Info, LayoutDashboard, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';
import type { User as SupaUser } from '@supabase/supabase-js';
import NotificationBell from './NotificationBell';

const langLabels: Record<Lang, string> = { tr: 'TR', en: 'EN', de: 'DE' };

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [user, setUser] = useState<SupaUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const loadUserMeta = async (userId: string) => {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin'),
      supabase.from('profiles').select('slug').eq('user_id', userId).single(),
    ]);
    setIsAdmin(!!(roles && roles.length > 0));
    setProfileSlug((profile as any)?.slug || null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserMeta(session.user.id);
      else { setIsAdmin(false); setProfileSlug(null); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserMeta(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
    navigate('/');
  };

  const navItems = [
    { to: '/humans', icon: Users, label: t('nav.humans') },
    { to: '/events', icon: CalendarDays, label: t('nav.events') },
    { to: '/map', icon: Map, label: t('nav.map') },
    { to: '/about', icon: Info, label: t('nav.about') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
            Work<span className="text-primary">World</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button key={item.to} variant="ghost" size="sm" asChild>
                <Link to={item.to} className="gap-1.5"><item.icon className="w-4 h-4" />{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
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

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <NotificationBell userId={user.id} />
                {isAdmin && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin"><Shield className="w-4 h-4" /></Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/dashboard"><LayoutDashboard className="w-4 h-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/humans/${profileSlug || user.id}`}><User className="w-4 h-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth" className="gap-1.5">
                  <LogIn className="w-4 h-4" />
                  {t('nav.login')}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile: notification + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            {user && <NotificationBell userId={user.id} />}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="text-left">
                    Work<span className="text-primary">World</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-2">
                  {navItems.map((item) => (
                    <Button key={item.to} variant="ghost" className="justify-start gap-3 h-11" asChild onClick={() => setMobileOpen(false)}>
                      <Link to={item.to}>
                        <item.icon className="w-4 h-4" />{item.label}
                      </Link>
                    </Button>
                  ))}

                  <div className="my-2 border-t border-border" />

                  {user ? (
                    <>
                      <Button variant="ghost" className="justify-start gap-3 h-11" asChild onClick={() => setMobileOpen(false)}>
                        <Link to="/dashboard"><LayoutDashboard className="w-4 h-4" />{t('dashboard.title')}</Link>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-11" asChild onClick={() => setMobileOpen(false)}>
                        <Link to={`/humans/${profileSlug || user.id}`}><User className="w-4 h-4" />{t('nav.profile') || 'Profile'}</Link>
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" className="justify-start gap-3 h-11" asChild onClick={() => setMobileOpen(false)}>
                          <Link to="/admin"><Shield className="w-4 h-4" />Admin</Link>
                        </Button>
                      )}
                      <div className="my-2 border-t border-border" />
                      <Button variant="ghost" className="justify-start gap-3 h-11 text-destructive" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />{t('nav.logout')}
                      </Button>
                    </>
                  ) : (
                    <Button className="justify-start gap-3 h-11 mt-1" asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/auth"><LogIn className="w-4 h-4" />{t('nav.login')}</Link>
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
