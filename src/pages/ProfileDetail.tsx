import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Globe, Twitter, Linkedin, Instagram, ArrowLeft, Edit2, Save, Clock, CheckCircle, Camera, Github, Calendar, Flag } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/LocationPicker';
import Footer from '@/components/Footer';
import CommentsSection from '@/components/CommentsSection';
import PostsSection from '@/components/PostsSection';

interface Profile {
  id: string; user_id: string; display_name: string; avatar_url: string | null;
  bio: string | null; location: string | null; website: string | null;
  twitter: string | null; linkedin: string | null; instagram: string | null;
  github: string | null; lat: number | null; lng: number | null;
  approved: boolean; slug: string | null; created_at: string;
  city: string | null; country: string | null;
}

interface EventData {
  id: string; title: string; slug: string | null; start_date: string | null; date: string | null;
  city: string | null; country: string | null;
}

const ProfileDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      let { data } = await supabase.from('profiles').select('*').eq('slug', slug!).single();
      if (!data) { const res = await supabase.from('profiles').select('*').eq('user_id', slug!).single(); data = res.data; }
      if (data) {
        const p = data as unknown as Profile;
        setProfile(p);
        setForm(p);

        // Load events user has joined
        const { data: rsvps } = await supabase.from('event_rsvps').select('event_id').eq('user_id', p.user_id);
        if (rsvps && rsvps.length > 0) {
          const { data: evts } = await supabase.from('event_markers').select('id, title, slug, start_date, date, city, country').in('id', rsvps.map((r: any) => r.event_id));
          if (evts) setEvents(evts as unknown as EventData[]);
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      const owner = !!(data && session?.user?.id === (data as any).user_id);
      setIsOwner(owner);

      // Load edit request status for owner
      if (owner && data) {
        const { data: reqs } = await supabase.from('profile_edit_requests').select('*').eq('user_id', (data as any).user_id).order('created_at', { ascending: false }).limit(3);
        if (reqs) setEditRequests(reqs as any[]);
      }

      setLoading(false);
    };
    load();
  }, [slug]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.user_id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + '?t=' + Date.now();
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', profile.user_id);
    setProfile({ ...profile, avatar_url: avatarUrl });
    setForm(prev => ({ ...prev, avatar_url: avatarUrl }));
    setUploading(false);
    toast.success(t('profile.avatar_updated'));
  };

  const handleSave = async () => {
    if (!profile) return;
    const fields = ['display_name', 'bio', 'location', 'website', 'twitter', 'linkedin', 'instagram', 'github', 'lat', 'lng'] as const;
    const oldData: Record<string, any> = {};
    const newData: Record<string, any> = {};
    let hasChanges = false;
    fields.forEach(f => { const o = (profile as any)[f]; const n = (form as any)[f]; if (o !== n) { oldData[f] = o; newData[f] = n; hasChanges = true; } });
    if (form.avatar_url !== profile.avatar_url && form.avatar_url) {
      await supabase.from('profiles').update({ avatar_url: form.avatar_url }).eq('user_id', profile.user_id);
      setProfile(prev => prev ? { ...prev, avatar_url: form.avatar_url! } : prev);
    }
    if (!hasChanges) { if (form.avatar_url !== profile.avatar_url) { setEditing(false); toast.success(t('profile.avatar_updated')); return; } toast.info(t('profile.no_changes')); return; }
    const { error } = await supabase.from('profile_edit_requests').insert({ profile_id: profile.id, user_id: profile.user_id, old_data: oldData, new_data: newData } as any);
    if (error) { toast.error(error.message); return; }
    await supabase.rpc('notify_admins', { _type: 'edit_request', _title: `${profile.display_name} profil düzenlemesi bekliyor`, _message: `${Object.keys(newData).join(', ')} alanları değiştirildi`, _link: '/admin' } as any);
    setEditing(false);
    toast.success(t('profile.edit_submitted'));
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!profile) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Profile not found.</div>;

  const locationText = profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.location;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <Link to="/humans" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('event.back')}
        </Link>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4">
            <div className="relative group shrink-0">
              <Avatar className="w-14 h-14 sm:w-16 sm:h-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {isOwner && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <Label>{t('profile.display_name')}</Label>
                  <Input value={form.display_name || ''} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{profile.display_name}</h1>
                    {profile.approved ? (
                      <Badge variant="default" className="gap-1 shrink-0"><CheckCircle className="w-3 h-3" />{t('profile.approved')}</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 shrink-0"><Clock className="w-3 h-3" />{t('profile.pending')}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t('profile.member_since')} {new Date(profile.created_at).toLocaleDateString()}</p>
                </>
              )}
            </div>
            {isOwner && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
                <Edit2 className="w-4 h-4 mr-1" /> {t('profile.edit')}
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{t('profile.edit_note')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.avatar_url')}</Label>
                  <Input value={form.avatar_url || ''} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://example.com/photo.jpg" />
                  <p className="text-xs text-muted-foreground">{t('profile.avatar_url_hint')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.bio')}</Label>
                  <Textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>{t('profile.location')}</Label><Input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="İstanbul, Türkiye" /></div>
                  <div className="space-y-1"><Label>{t('profile.website')}</Label><Input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" /></div>
                  <div className="space-y-1"><Label>GitHub</Label><Input value={form.github || ''} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="username" /></div>
                  <div className="space-y-1"><Label>Twitter</Label><Input value={form.twitter || ''} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@username" /></div>
                  <div className="space-y-1"><Label>LinkedIn</Label><Input value={form.linkedin || ''} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="username" /></div>
                  <div className="space-y-1"><Label>Instagram</Label><Input value={form.instagram || ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@username" /></div>
                </div>
                <div className="space-y-2">
                  <Label>{t('map.pick_location')}</Label>
                  <LocationPicker lat={form.lat ?? null} lng={form.lng ?? null} onChange={(lat, lng) => setForm({ ...form, lat, lng })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setEditing(false); setForm(profile); }}>{t('profile.cancel')}</Button>
                  <Button onClick={handleSave}><Save className="w-4 h-4 mr-1" /> {t('profile.save')}</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-foreground">{profile.bio || t('profile.no_bio')}</p>
                <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-muted-foreground">
                  {locationText && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{locationText}</span>}
                  {profile.website && <a href={profile.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground"><Globe className="w-3.5 h-3.5" />{profile.website.replace(/^https?:\/\//, '')}</a>}
                  {profile.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground"><Github className="w-3.5 h-3.5" />{profile.github}</a>}
                  {profile.twitter && <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground"><Twitter className="w-3.5 h-3.5" />@{profile.twitter}</a>}
                  {profile.linkedin && <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground"><Linkedin className="w-3.5 h-3.5" />{profile.linkedin}</a>}
                  {profile.instagram && <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground"><Instagram className="w-3.5 h-3.5" />@{profile.instagram}</a>}
                </div>

                {/* Events joined */}
                {events.length > 0 && (
                  <div className="border-t border-border pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" /> {t('profile.events_joined')} ({events.length})
                    </h3>
                    <div className="space-y-1.5">
                      {events.map(e => (
                        <Link key={e.id} to={`/events/${e.slug || e.id}`} className="block">
                          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-sm text-foreground">{e.title}</span>
                            <span className="text-xs text-muted-foreground">{e.start_date || e.date || ''}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit request status (owner only) */}
                {isOwner && editRequests.length > 0 && (
                  <div className="border-t border-border pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Flag className="w-4 h-4 text-primary" /> {t('profile.edit_history')}
                    </h3>
                    <div className="space-y-1.5">
                      {editRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <span className="text-xs text-muted-foreground">{Object.keys(req.new_data || {}).join(', ')}</span>
                          <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                            {req.status === 'approved' ? t('profile.approved') : req.status === 'rejected' ? t('admin.rejected') : t('profile.pending')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="max-w-3xl mx-auto px-4 w-full">
        <PostsSection targetType="profile" targetId={profile.id} />
        <CommentsSection targetType="profile" targetId={profile.id} />
      </div>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default ProfileDetail;
