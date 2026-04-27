import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, AlertTriangle, Briefcase, Calendar } from 'lucide-react';
import Footer from '@/components/Footer';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface UserMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  slug: string | null;
  created_at: string;
  name_i18n?: any;
}

interface Profession {
  id: string;
  name: string;
  slug: string | null;
  icon: string | null;
  name_i18n?: any;
}

const MemberDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const [member, setMember] = useState<UserMarker | null>(null);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      let { data } = await supabase.from('user_markers').select('*').eq('slug', slug!).single();
      if (!data) {
        const res = await supabase.from('user_markers').select('*').eq('id', slug!).single();
        data = res.data;
      }
      if (data) {
        setMember(data as unknown as UserMarker);
        // Load professions
        const { data: links } = await supabase.from('user_marker_professions' as any).select('profession_id').eq('user_marker_id', data.id);
        if (links && links.length > 0) {
          const { data: profs } = await supabase.from('professions').select('id, name, slug, icon').in('id', (links as any[]).map(l => (l as any).profession_id));
          if (profs) setProfessions(profs as unknown as Profession[]);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!member || !mapRef.current) return;
    const map = L.map(mapRef.current).setView([member.lat, member.lng], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    L.marker([member.lat, member.lng]).addTo(map).bindPopup(member.name);
    return () => { map.remove(); };
  }, [member]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!member) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Member not found.</div>;

  const locationText = member.city && member.country ? `${member.city}, ${member.country}` : `${member.lat.toFixed(4)}, ${member.lng.toFixed(4)}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <Link to="/humans" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('event.back')}
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg bg-muted text-muted-foreground">
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{member.name}</h1>
                <Badge variant="outline" className="gap-1 shrink-0 text-muted-foreground border-muted-foreground/30">
                  <AlertTriangle className="w-3 h-3" />{t('member.unverified')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t('member.anonymous_note')}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{t('member.unverified_description')}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{locationText}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{t('profile.member_since')} {new Date(member.created_at).toLocaleDateString()}</span>
            </div>

            {/* Professions */}
            {professions.length > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary" /> {t('professions.title')} ({professions.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {professions.map(p => (
                    <Link key={p.id} to={`/professions/${p.slug || p.id}`}>
                      <Badge variant="secondary" className="hover:bg-accent cursor-pointer">{p.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Mini map */}
            <div className="border-t border-border pt-4">
              <div ref={mapRef} className="h-48 rounded-lg overflow-hidden" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default MemberDetail;
