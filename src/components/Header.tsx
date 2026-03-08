import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Moon, Sun, LogIn, LogOut, User, Globe, Shield, Users, CalendarDays, Map, Info, LayoutDashboard, Menu, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';
import type { User as SupaUser } from '@supabase/supabase-js';
import NotificationBell from './NotificationBell';
import { useNavigation } from '@/contexts/NavigationContext';

const langLabels: Record<Lang, string> = { tr: 'TR', en: 'EN', de: 'DE' };

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const { currentMode } = useNavigation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [user, setUser] = useState<SupaUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

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

  // Mega menu items with sub-items
  const megaItems = [
    {
      label: t('nav.humans'),
      icon: Users,
      children: [
        { to: '/humans', label: t('humans.title'), desc: t('humans.subtitle') },
        { to: '/map', label: t('nav.map'), desc: t('map.subtitle') },
      ],
    },
    {
      label: t('nav.events'),
      icon: CalendarDays,
      children: [
        { to: '/events', label: t('events.title'), desc: t('events.subtitle') },
      ],
    },
    {
      label: t('nav.about'),
      icon: Info,
      children: [
        { to: '/about', label: t('about.title'), desc: t('about.intro')?.substring(0, 60) + '...' },
      ],
    },
  ];

  const navItems = [
    { to: '/humans', icon: Users, label: t('nav.humans') },
    { to: '/events', icon: CalendarDays, label: t('nav.events') },
    { to: '/map', icon: Map, label: t('nav.map') },
    { to: '/about', icon: Info, label: t('nav.about') },
  ];

  const isMega = currentMode === 'mega';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
            Work<span className="text-primary">World</span>
          </Link>

          {/* Standard nav */}
          {!isMega && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button key={item.to} variant="ghost" size="sm" asChild>
                  <Link to={item.to} className="gap-1.5"><item.icon className="w-4 h-4" />{item.label}</Link>
                </Button>
              ))}
            </nav>
          )}

          {/* Mega menu nav */}
          {isMega && (
            <nav className="hidden md:flex items-center gap-1">
              {megaItems.map((group) => (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <group.icon className="w-4 h-4" />
                      {group.label}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {group.children.map((child) => (
                      <DropdownMenuItem key={child.to} asChild className="cursor-pointer">
                        <Link to={child.to} className="flex flex-col items-start gap-0.5 py-2">
                          <span className="font-medium text-sm">{child.label}</span>
                          <span className="text-xs text-muted-foreground">{child.desc}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* ⌘K hint */}
          <Button variant="ghost" size="sm" className="hidden md:flex gap-1.5 text-muted-foreground" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
            <Search className="w-4 h-4" />
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
          </Button>

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
