import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Twitter, Linkedin, Instagram, AlertTriangle, Search, Github, Users, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Footer from '@/components/Footer';

interface Profile {
  id: string; user_id: string; display_name: string; avatar_url: string | null;
  bio: string | null; location: string | null; city: string | null; country: string | null;
  website: string | null; twitter: string | null; linkedin: string | null; instagram: string | null;
  github: string | null; slug: string | null; approved: boolean; created_at: string;
  status: string;
  bio_i18n?: any;
}

interface AnonMember {
  id: string; name: string; lat: number; lng: number;
  city: string | null; country: string | null; slug: string | null; created_at: string;
  status: string;
  name_i18n?: any;
}

const HumansPage = () => {
  const { t, lang } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [anonMembers, setAnonMembers] = useState<AnonMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'coming_soon' | 'inactive'>('all');

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').eq('approved', true).order('created_at', { ascending: false }),
      supabase.from('user_markers').select('*').order('created_at', { ascending: false }),
    ]).then(([{ data: p }, { data: a }]) => {
      if (p) setProfiles(p as unknown as Profile[]);
      if (a) setAnonMembers(a as unknown as AnonMember[]);
      setLoading(false);
    });
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => { if (p.country) set.add(p.country); });
    anonMembers.forEach(m => { if (m.country) set.add(m.country); });
    return Array.from(set).sort();
  }, [profiles, anonMembers]);

  const filteredProfiles = useMemo(() => {
    let list = profiles;
    if (statusFilter !== 'all') list = list.filter(p => (p.status || 'active') === statusFilter);
    if (selectedCountry) list = list.filter(p => p.country === selectedCountry);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.display_name || '').toLowerCase().includes(q) ||
        pickI18n(p.bio_i18n, p.bio, lang).toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.country || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [profiles, search, selectedCountry, statusFilter, lang]);

  const filteredAnon = useMemo(() => {
    let list = anonMembers;
    if (statusFilter !== 'all') list = list.filter(m => (m.status || 'active') === statusFilter);
    if (selectedCountry) list = list.filter(m => m.country === selectedCountry);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        pickI18n(m.name_i18n, m.name, lang).toLowerCase().includes(q) ||
        (m.city || '').toLowerCase().includes(q) ||
        (m.country || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [anonMembers, search, selectedCountry, statusFilter, lang]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  const getLocation = (p: Profile) => p.city && p.country ? `${p.city}, ${p.country}` : p.location || null;
  const getAnonLocation = (m: AnonMember) => m.city && m.country ? `${m.city}, ${m.country}` : m.city || m.country || `${m.lat.toFixed(2)}, ${m.lng.toFixed(2)}`;
  const totalCount = profiles.length + anonMembers.length;

  const getStatusBadge = (status: string) => {
    const s = status || 'active';
    if (s === 'coming_soon') return <Badge className="text-xs bg-amber-500/15 text-amber-600 border-amber-500/30">{t('status.coming_soon')}</Badge>;
    if (s === 'inactive') return <Badge variant="secondary" className="text-xs opacity-60">{t('status.inactive')}</Badge>;
    return null; // active is default, no badge needed
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('humans.title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">{t('humans.subtitle')}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{totalCount} {t('humans.total_members')}</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('humans.search_placeholder')}
              className="pl-9"
            />
          </div>
          {countries.length > 0 && (
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t('humans.all_countries')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {(['all', 'active', 'coming_soon', 'inactive'] as const).map(f => (
            <Button
              key={f}
              variant={statusFilter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(f)}
              className="text-xs"
            >
              {t(`status.tab_${f}`)}
            </Button>
          ))}
        </div>

        {filteredProfiles.length === 0 && filteredAnon.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{search || selectedCountry ? t('humans.no_results') : t('humans.no_members')}</p>
        ) : (
          <>
            {filteredProfiles.length > 0 && (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProfiles.map((p) => (
                  <Link key={p.id} to={`/humans/${p.slug || p.user_id}`}>
                    <Card className={`hover:shadow-md transition-shadow h-full ${(p.status || 'active') === 'inactive' ? 'opacity-70' : ''}`}>
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                              {p.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{p.display_name}</h3>
                              {getStatusBadge(p.status)}
                            </div>
                            {getLocation(p) && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />{getLocation(p)}
                              </p>
                            )}
                          </div>
                        </div>
                        {(() => { const b = pickI18n(p.bio_i18n, p.bio, lang); return b ? <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{b}</p> : null; })()}
                        <div className="flex flex-wrap gap-1.5">
                          {p.github && <Badge variant="secondary" className="text-xs gap-1"><Github className="w-3 h-3" /> GitHub</Badge>}
                          {p.website && <Badge variant="secondary" className="text-xs gap-1"><Globe className="w-3 h-3" /> Web</Badge>}
                          {p.twitter && <Badge variant="secondary" className="text-xs gap-1"><Twitter className="w-3 h-3" /> Twitter</Badge>}
                          {p.linkedin && <Badge variant="secondary" className="text-xs gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</Badge>}
                          {p.instagram && <Badge variant="secondary" className="text-xs gap-1"><Instagram className="w-3 h-3" /> Instagram</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {filteredAnon.length > 0 && (
              <>
                {filteredProfiles.length > 0 && <Separator className="my-8 sm:my-10" />}
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    {t('humans.anonymous_title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('humans.anonymous_subtitle')}</p>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAnon.map((m) => (
                    <Link key={m.id} to={`/members/${m.slug || m.id}`}>
                      <Card className={`hover:shadow-md transition-shadow h-full border-dashed ${(m.status || 'active') === 'inactive' ? 'opacity-70' : ''}`}>
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                              <AvatarFallback className="bg-muted text-muted-foreground font-bold text-sm">
                                {pickI18n(m.name_i18n, m.name, lang).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{pickI18n(m.name_i18n, m.name, lang)}</h3>
                                {getStatusBadge(m.status)}
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />{getAnonLocation(m)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                            <AlertTriangle className="w-3 h-3" /> {t('member.unverified')}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default HumansPage;
