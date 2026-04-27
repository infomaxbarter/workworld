import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Plus, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TranslateButton from './TranslateButton';

interface Post {
  id: string; author_id: string; title: string; content: string; slug: string | null;
  status: string; created_at: string;
  title_i18n?: any; content_i18n?: any;
  profile?: { display_name: string; avatar_url: string | null; slug: string | null };
}

interface Props { targetType: string; targetId: string; }

const PostsSection = ({ targetType, targetId }: Props) => {
  const { t, lang } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [titleI18n, setTitleI18n] = useState<Record<string, string> | null>(null);
  const [contentI18n, setContentI18n] = useState<Record<string, string> | null>(null);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const authorIds = [...new Set((data as any[]).map(p => p.author_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url, slug').in('user_id', authorIds);
      const profileMap = new Map((profiles as any[] || []).map(p => [p.user_id, p]));
      setPosts((data as any[]).map(p => ({ ...p, profile: profileMap.get(p.author_id) })));
    } else {
      setPosts([]);
    }
  };

  useEffect(() => {
    loadPosts();
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || null));
  }, [targetType, targetId]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !userId) return;
    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      author_id: userId, title: title.trim(), content: content.trim(),
      title_i18n: titleI18n || { tr: title.trim() },
      content_i18n: contentI18n || { tr: content.trim() },
      target_type: targetType, target_id: targetId,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success(t('posts.submitted'));
      setTitle(''); setContent(''); setTitleI18n(null); setContentI18n(null); setShowForm(false);
      await supabase.rpc('notify_admins', { _type: 'post', _title: t('posts.new_post_admin'), _message: title.trim() } as any);
      loadPosts();
    }
    setLoading(false);
  };

  const approvedPosts = posts.filter(p => p.status === 'approved');
  const pendingOwn = posts.filter(p => p.status === 'pending' && p.author_id === userId);

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{t('posts.title')} ({approvedPosts.length})</span>
          </div>
          {userId && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
              <Plus className="w-4 h-4" /> {t('posts.write')}
            </Button>
          )}
        </div>

        {/* Write form */}
        {showForm && (
          <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/30">
            <Input value={title} onChange={e => { setTitle(e.target.value); setTitleI18n(null); }} placeholder={t('posts.title_placeholder')} />
            <Textarea value={content} onChange={e => { setContent(e.target.value); setContentI18n(null); }} placeholder={t('posts.content_placeholder')} rows={5} />
            <div className="flex gap-2 justify-between items-center">
              <TranslateButton
                source={`${title}\n\n---\n\n${content}`}
                onResult={(r) => {
                  // Split back into title/content per language using the same separator
                  const split = (s: string) => {
                    const i = s.indexOf('\n\n---\n\n');
                    return i >= 0 ? [s.slice(0, i), s.slice(i + 7)] : [s, ''];
                  };
                  const ti: Record<string, string> = { tr: title };
                  const ci: Record<string, string> = { tr: content };
                  for (const l of Object.keys(r)) {
                    const [tt, cc] = split(r[l as 'en' | 'de'] || '');
                    ti[l] = tt; ci[l] = cc;
                  }
                  setTitleI18n(ti); setContentI18n(ci);
                  toast.success(t('posts.translated') !== 'posts.translated' ? t('posts.translated') : 'Translations ready');
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>{t('profile.cancel')}</Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading || !title.trim() || !content.trim()}>{t('posts.submit')}</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('posts.approval_note')}</p>
          </div>
        )}

        {/* Pending own */}
        {pendingOwn.map(p => (
          <div key={p.id} className="p-3 border border-dashed border-border rounded-lg opacity-70">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{pickI18n(p.title_i18n, p.title, lang)}</span>
              <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />{t('comments.pending')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{pickI18n(p.content_i18n, p.content, lang)}</p>
          </div>
        ))}

        {/* Approved posts */}
        {approvedPosts.map(p => (
          <div key={p.id} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedPost(expandedPost === p.id ? null : p.id)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Link to={`/humans/${p.profile?.slug || p.author_id}`} onClick={e => e.stopPropagation()}>
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarImage src={p.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{p.profile?.display_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                </Link>
                <span className="font-medium text-sm truncate">{pickI18n(p.title_i18n, p.title, lang)}</span>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              {expandedPost === p.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
            {expandedPost === p.id && (
              <div className="px-3 pb-3 border-t border-border">
                <div className="pt-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{pickI18n(p.content_i18n, p.content, lang)}</div>
                <p className="text-xs text-muted-foreground mt-2">— {p.profile?.display_name}</p>
              </div>
            )}
          </div>
        ))}

        {approvedPosts.length === 0 && pendingOwn.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-4">{t('posts.empty')}</p>
        )}

        {!userId && (
          <p className="text-sm text-muted-foreground text-center">
            <Link to="/auth" className="text-primary hover:underline">{t('posts.login_to_write')}</Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PostsSection;
