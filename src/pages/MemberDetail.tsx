import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, AlertTriangle } from 'lucide-react';

interface UserMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  slug: string | null;
  created_at: string;
}

const MemberDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [member, setMember] = useState<UserMarker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let { data } = await supabase.from('user_markers').select('*').eq('slug', slug!).single();
      if (!data) {
        const res = await supabase.from('user_markers').select('*').eq('id', slug!).single();
        data = res.data;
      }
      if (data) setMember(data as unknown as UserMarker);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!member) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Member not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground truncate">{member.name}</h1>
              <Badge variant="outline" className="gap-1 shrink-0 text-muted-foreground border-muted-foreground/30">
                <AlertTriangle className="w-3 h-3" />{t('member.unverified')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('member.anonymous_note')}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{t('member.unverified_description')}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>📍 {member.lat.toFixed(4)}, {member.lng.toFixed(4)}</span>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('profile.member_since')} {new Date(member.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberDetail;
