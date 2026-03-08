import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Briefcase, Users } from 'lucide-react';
import CommentsSection from '@/components/CommentsSection';
import PostsSection from '@/components/PostsSection';

interface Profession { id: string; name: string; slug: string | null; description: string | null; icon: string; status: string; }
interface MemberProfile { user_id: string; display_name: string; avatar_url: string | null; slug: string | null; bio: string | null; }

const ProfessionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [profession, setProfession] = useState<Profession | null>(null);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

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
          const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url, slug, bio').in('id', ids);
          if (profiles) setMembers(profiles as any as MemberProfile[]);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!profession) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">{t('professions.not_found')}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
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
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          {profession.description && <p className="text-foreground leading-relaxed">{profession.description}</p>}

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{t('professions.members_title')} ({members.length})</span>
            </div>
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <Link key={m.user_id} to={`/humans/${m.slug || m.user_id}`}>
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2 cursor-pointer hover:bg-muted">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{m.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      {m.display_name}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('professions.no_members')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <PostsSection targetType="profession" targetId={profession.id} />
      <CommentsSection targetType="profession" targetId={profession.id} />
    </div>
  );
};

export default ProfessionDetail;
