import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Briefcase, Users, MapPin } from 'lucide-react';
import CommentsSection from '@/components/CommentsSection';
import PostsSection from '@/components/PostsSection';
import Footer from '@/components/Footer';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Profession { id: string; name: string; slug: string | null; description: string | null; icon: string; status: string; }
interface MemberProfile { id: string; user_id: string; display_name: string; avatar_url: string | null; slug: string | null; bio: string | null; city: string | null; country: string | null; lat: number | null; lng: number | null; status: string; }

const ProfessionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [profession, setProfession] = useState<Profession | null>(null);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const load = async () => {
      let { data } = await supabase.from('professions').select('*').eq('slug', slug!).single();
      if (!data) { const res = await supabase.from('professions').select('*').eq('id', slug!).single(); data = res.data; }
      if (data) {
        const prof = data as any as Profession;
        setProfession(prof);
        const { data: pp } = await supabase.from('profile_professions').select('profile_id').eq('profession_id', prof.id);
        if (pp && pp.length > 0) {
          const ids = pp.map((p: any) => p.profile_id);
          const { data: profiles } = await supabase.from('profiles').select('id, user_id, display_name, avatar_url, slug, bio, city, country, lat, lng, status').in('id', ids);
          if (profiles) setMembers(profiles as any as MemberProfile[]);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  // Mini map for members with locations
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || members.length === 0) return;
    const membersWithLocation = members.filter(m => m.lat && m.lng);
    if (membersWithLocation.length === 0) return;

    const map = L.map(mapContainerRef.current, { center: [30, 20], zoom: 2, scrollWheelZoom: true, zoomControl: true });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const bounds: L.LatLngExpression[] = [];
    membersWithLocation.forEach(m => {
      const marker = L.marker([m.lat!, m.lng!]);
      marker.bindPopup(`
        <div style="padding:8px;min-width:140px;">
          <div style="font-weight:600;font-size:13px;">${m.display_name}</div>
          ${m.city && m.country ? `<div style="font-size:11px;color:#888;">${m.city}, ${m.country}</div>` : ''}
          <a href="/humans/${m.slug || m.user_id}" style="display:block;margin-top:6px;text-align:center;padding:4px 8px;background:hsl(152,60%,36%);color:white;border-radius:4px;font-size:11px;text-decoration:none;">Profil →</a>
        </div>
      `);
      marker.addTo(map);
      bounds.push([m.lat!, m.lng!]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 6);
    }

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [members]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!profession) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">{t('professions.not_found')}</div>;

  const getStatusBadge = (status: string) => {
    if (status === 'coming_soon') return <Badge className="text-xs bg-amber-500/15 text-amber-600 border-amber-500/30">{t('status.coming_soon')}</Badge>;
    if (status === 'inactive') return <Badge variant="secondary" className="text-xs opacity-60">{t('status.inactive')}</Badge>;
    return null;
  };

  const membersWithLocation = members.filter(m => m.lat && m.lng);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <Link to="/professions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('professions.back')}
        </Link>

        <Card className="mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">{profession.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{members.length} {t('professions.members')}</p>
              </div>
              {getStatusBadge(profession.status)}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-6">
            {profession.description && <p className="text-foreground leading-relaxed">{profession.description}</p>}

            {/* Members list */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{t('professions.members_title')} ({members.length})</span>
              </div>
              {members.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map(m => (
                    <Link key={m.user_id} to={`/humans/${m.slug || m.user_id}`} className="block">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={m.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold">{m.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{m.display_name}</p>
                          {(m.city || m.country) && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[m.city, m.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                        {m.status !== 'active' && getStatusBadge(m.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('professions.no_members')}</p>
              )}
            </div>

            {/* Map */}
            {membersWithLocation.length > 0 && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{t('professions.map_title') || 'Haritada Üyeler'}</span>
                </div>
                <div ref={mapContainerRef} className="w-full h-[350px] rounded-xl border border-border overflow-hidden" />
              </div>
            )}
          </CardContent>
        </Card>

        <PostsSection targetType="profession" targetId={profession.id} />
        <CommentsSection targetType="profession" targetId={profession.id} />
      </div>
      <Footer />
    </div>
  );
};

export default ProfessionDetail;
