import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useLanguage } from '@/i18n/LanguageContext';
import { Users, CalendarDays, Map, Info, LayoutDashboard, Shield, User, Home, Search } from 'lucide-react';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const pages = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/humans', label: t('nav.humans'), icon: Users },
    { path: '/events', label: t('nav.events'), icon: CalendarDays },
    { path: '/map', label: t('nav.map'), icon: Map },
    { path: '/about', label: t('nav.about'), icon: Info },
    { path: '/dashboard', label: t('nav.dashboard') || 'Dashboard', icon: LayoutDashboard },
    { path: '/admin', label: t('nav.admin') || 'Admin', icon: Shield },
    { path: '/auth', label: t('nav.login'), icon: User },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('humans.search_placeholder') || 'Search...'} />
      <CommandList>
        <CommandEmpty>{t('humans.no_results') || 'No results found.'}</CommandEmpty>
        <CommandGroup heading={t('nav.home') || 'Pages'}>
          {pages.map(p => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-2 cursor-pointer">
              <p.icon className="w-4 h-4 text-muted-foreground" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
