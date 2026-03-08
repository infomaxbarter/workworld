import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Users, CalendarDays, Map, Info, LayoutDashboard, Shield, User, LogIn, LogOut, Home, Moon, Sun, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  SidebarSeparator, useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';
import type { User as SupaUser } from '@supabase/supabase-js';
import NotificationBell from './NotificationBell';
import { NavLink } from './NavLink';

const AppSidebar = () => {
  const { lang, setLang, t } = useLanguage();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [user, setUser] = useState<SupaUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
    navigate('/');
  };

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/humans', icon: Users, label: t('nav.humans') },
    { to: '/events', icon: CalendarDays, label: t('nav.events') },
    { to: '/map', icon: Map, label: t('nav.map') },
    { to: '/about', icon: Info, label: t('nav.about') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1">
          {!collapsed && <>Work<span className="text-primary">World</span></>}
          {collapsed && <span className="text-primary text-xl font-black">W</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
                    <Link to={item.to}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>{!collapsed ? 'Account' : ''}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip={t('nav.dashboard')}>
                      <Link to="/dashboard"><LayoutDashboard className="w-4 h-4" />{!collapsed && <span>{t('nav.dashboard') || 'Dashboard'}</span>}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith('/humans/')} tooltip={t('nav.profile')}>
                      <Link to={`/humans/${profileSlug || user.id}`}><User className="w-4 h-4" />{!collapsed && <span>{t('nav.profile') || 'Profile'}</span>}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/admin')} tooltip="Admin">
                        <Link to="/admin"><Shield className="w-4 h-4" />{!collapsed && <span>Admin</span>}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {!collapsed && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setLang(lang === 'tr' ? 'en' : lang === 'en' ? 'de' : 'tr')}>
              <Globe className="w-3 h-3 mr-1" />{lang.toUpperCase()}
            </Button>
          )}
          {user && !collapsed && <NotificationBell userId={user.id} />}
        </div>
        {user ? (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive h-8" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />{!collapsed && t('nav.logout')}
          </Button>
        ) : (
          <Button variant="default" size="sm" className="w-full justify-start gap-2 h-8" asChild>
            <Link to="/auth"><LogIn className="w-4 h-4" />{!collapsed && t('nav.login')}</Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
