import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TranslateButton from './TranslateButton';

interface Comment {
  id: string; user_id: string; content: string; status: string; created_at: string;
  content_i18n?: any;
  profile?: { display_name: string; avatar_url: string | null; slug: string | null };
}

interface Props { targetType: string; targetId: string; }

const CommentsSection = ({ targetType, targetId }: Props) => {
  const { t, lang } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [contentI18n, setContentI18n] = useState<Record<string, string> | null>(null);

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: true });
    if (data && data.length > 0) {
      const userIds = [...new Set((data as any[]).map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url, slug').in('user_id', userIds);
      const profileMap = new Map((profiles as any[] || []).map(p => [p.user_id, p]));
      setComments((data as any[]).map(c => ({ ...c, profile: profileMap.get(c.user_id) })));
    } else {
      setComments([]);
    }
  };

  useEffect(() => {
    loadComments();
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || null));
  }, [targetType, targetId]);

  const handleSubmit = async () => {
    if (!content.trim() || !userId) return;
    setLoading(true);
    const { error } = await supabase.from('comments').insert({
      user_id: userId, target_type: targetType, target_id: targetId,
      content: content.trim(),
      content_i18n: contentI18n || { tr: content.trim() },
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success(t('comments.submitted'));
      setContent(''); setContentI18n(null);
      await supabase.rpc('notify_admins', { _type: 'comment', _title: t('comments.new_comment_admin'), _message: content.trim().substring(0, 100) } as any);
      loadComments();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const approvedComments = comments.filter(c => c.status === 'approved');
  const pendingOwn = comments.filter(c => c.status === 'pending' && c.user_id === userId);

  return (
    <Card className="mt-6">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{t('comments.title')} ({approvedComments.length})</span>
        </div>

        {/* Comment list */}
        <div className="space-y-3">
          {pendingOwn.map(c => (
            <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-dashed border-border opacity-70">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={c.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{c.profile?.display_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{c.profile?.display_name || '?'}</span>
                  <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />{t('comments.pending')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{pickI18n(c.content_i18n, c.content, lang)}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
            </div>
          ))}
          {approvedComments.map(c => (
            <div key={c.id} className="flex gap-3 p-3 rounded-lg">
              <Link to={`/humans/${c.profile?.slug || c.user_id}`}>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={c.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{c.profile?.display_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link to={`/humans/${c.profile?.slug || c.user_id}`} className="text-sm font-medium hover:underline">{c.profile?.display_name || '?'}</Link>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-foreground">{pickI18n(c.content_i18n, c.content, lang)}</p>
              </div>
              {c.user_id === userId && (
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              )}
            </div>
          ))}
          {approvedComments.length === 0 && pendingOwn.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('comments.empty')}</p>
          )}
        </div>

        {/* Write comment */}
        {userId ? (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={content} onChange={e => { setContent(e.target.value); setContentI18n(null); }}
                placeholder={t('comments.placeholder')}
                rows={2} className="min-h-[60px]"
              />
              <Button size="icon" className="shrink-0 self-end" onClick={handleSubmit} disabled={loading || !content.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <TranslateButton
              source={content}
              onResult={(r) => { setContentI18n({ tr: content, ...r }); toast.success('Translations attached'); }}
              disabled={!content.trim()}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border">
            <Link to="/auth" className="text-primary hover:underline">{t('comments.login_to_comment')}</Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentsSection;
