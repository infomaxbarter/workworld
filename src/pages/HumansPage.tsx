import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Twitter, Linkedin, Instagram } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  slug: string | null;
  approved: boolean;
  created_at: string;
}

const HumansPage = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('approved', true).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setProfiles(data as unknown as Profile[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground">{t('humans.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('humans.subtitle')}</p>
      </div>

      {profiles.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('humans.no_members')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Link key={p.id} to={`/humans/${p.slug || p.user_id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {p.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{p.display_name}</h3>
                      {p.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />{p.location}
                        </p>
                      )}
                    </div>
                  </div>
                  {p.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.bio}</p>}
                  <div className="flex flex-wrap gap-2">
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
    </div>
  );
};

export default HumansPage;
