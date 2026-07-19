import { Search, Command as CmdIcon, Users, CalendarDays, Briefcase, MapPin, Newspaper, Building2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const chips: Array<{ key: string; label: string; Icon: any }> = [
  { key: 'humans',      label: 'Community',   Icon: Users },
  { key: 'events',      label: 'Events',      Icon: CalendarDays },
  { key: 'professions', label: 'Professions', Icon: Briefcase },
  { key: 'cities',      label: 'Cities',      Icon: Building2 },
  { key: 'media',       label: 'Media',       Icon: Newspaper },
  { key: 'places',      label: 'Places',      Icon: MapPin },
];

const openPalette = (facet?: string) => {
  window.dispatchEvent(new CustomEvent('open-command-palette', { detail: { facet } }));
};

const HeroSearch = () => {
  const { t } = useLanguage();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="max-w-2xl mx-auto mb-6">
      <button
        onClick={() => openPalette()}
        className="group w-full flex items-center gap-3 h-14 px-5 rounded-2xl border border-border bg-card/70 backdrop-blur-md hover:border-primary/60 hover:shadow-lg transition-all text-left"
        aria-label={t('search.global') || 'Search everything'}
      >
        <Search className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        <span className="flex-1 text-sm text-muted-foreground">
          {t('search.hero_placeholder') || 'Search people, events, cities, professions, media…'}
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-muted/60 text-[11px] font-mono text-muted-foreground">
          {isMac ? <CmdIcon className="w-3 h-3" /> : 'Ctrl'} K
        </kbd>
      </button>

      <div className="flex flex-wrap justify-center gap-1.5 mt-3">
        {chips.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => openPalette(key)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Icon className="w-3 h-3" />
            {t(`search.facet_${key}`) || label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroSearch;
