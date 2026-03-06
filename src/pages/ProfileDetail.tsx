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
import { MapPin, Globe, Twitter, Linkedin, Instagram, ArrowLeft, Edit2, Save, Clock, CheckCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/LocationPicker';

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
  lat: number | null;
  lng: number | null;
  approved: boolean;
  slug: string | null;
  created_at: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      let { data } = await supabase.from('profiles').select('*').eq('slug', slug!).single();
      if (!data) {
        const res = await supabase.from('profiles').select('*').eq('user_id', slug!).single();
        data = res.data;
      }
      if (data) {
        const p = data as unknown as Profile;
        setProfile(p);
        setForm(p);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (data) setIsOwner(session?.user?.id === (data as any).user_id);
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
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + '?t=' + Date.now();

    // Direct update for avatar (no approval needed)
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', profile.user_id);
    setProfile({ ...profile, avatar_url: avatarUrl });
    setForm(prev => ({ ...prev, avatar_url: avatarUrl }));
    setUploading(false);
    toast.success(t('profile.avatar_updated'));
  };

  const handleAvatarUrl = (url: string) => {
    setForm(prev => ({ ...prev, avatar_url: url }));
  };

  const handleSave = async () => {
    if (!profile) return;

    const fields = ['display_name', 'bio', 'location', 'website', 'twitter', 'linkedin', 'instagram', 'lat', 'lng'] as const;
    const oldData: Record<string, any> = {};
    const newData: Record<string, any> = {};
    let hasChanges = false;

    fields.forEach(f => {
      const oldVal = (profile as any)[f];
      const newVal = (form as any)[f];
      if (oldVal !== newVal) {
        oldData[f] = oldVal;
        newData[f] = newVal;
        hasChanges = true;
      }
    });

    // Check avatar URL change (manual URL input)
    if (form.avatar_url !== profile.avatar_url && form.avatar_url) {
      await supabase.from('profiles').update({ avatar_url: form.avatar_url }).eq('user_id', profile.user_id);
      setProfile(prev => prev ? { ...prev, avatar_url: form.avatar_url! } : prev);
    }

    if (!hasChanges) {
      if (form.avatar_url !== profile.avatar_url) {
        setEditing(false);
        toast.success(t('profile.avatar_updated'));
        return;
      }
      toast.info(t('profile.no_changes'));
      return;
    }

    const { error } = await supabase.from('profile_edit_requests').insert({
      profile_id: profile.id,
      user_id: profile.user_id,
      old_data: oldData,
      new_data: newData,
    } as any);

    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase.rpc('notify_admins', {
      _type: 'edit_request',
      _title: `${profile.display_name} profil düzenlemesi bekliyor`,
      _message: `${Object.keys(newData).join(', ')} alanları değiştirildi`,
      _link: '/admin',
    } as any);

    setEditing(false);
    toast.success(t('profile.edit_submitted'));
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!profile) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Profile not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/humans" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('event.back')}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <div className="relative group">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
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
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground truncate">{profile.display_name}</h1>
                  {profile.approved ? (
                    <Badge variant="default" className="gap-1 shrink-0"><CheckCircle className="w-3 h-3" />{t('profile.approved')}</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 shrink-0"><Clock className="w-3 h-3" />{t('profile.pending')}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('profile.member_since')} {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
          {isOwner && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
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

              {/* Avatar URL input */}
              <div className="space-y-2">
                <Label>{t('profile.avatar_url')}</Label>
                <Input
                  value={form.avatar_url || ''}
                  onChange={(e) => handleAvatarUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="text-xs text-muted-foreground">{t('profile.avatar_url_hint')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('profile.bio')}</Label>
                <Textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('profile.location')}</Label>
                  <Input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="İstanbul, Türkiye" />
                </div>
                <div className="space-y-1">
                  <Label>{t('profile.website')}</Label>
                  <Input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
                </div>
                <div className="space-y-1">
                  <Label>Twitter</Label>
                  <Input value={form.twitter || ''} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@username" />
                </div>
                <div className="space-y-1">
                  <Label>LinkedIn</Label>
                  <Input value={form.linkedin || ''} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="username" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Instagram</Label>
                  <Input value={form.instagram || ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@username" />
                </div>
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
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Globe className="w-3.5 h-3.5" />{profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Twitter className="w-3.5 h-3.5" />@{profile.twitter}
                  </a>
                )}
                {profile.linkedin && (
                  <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Linkedin className="w-3.5 h-3.5" />{profile.linkedin}
                  </a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Instagram className="w-3.5 h-3.5" />@{profile.instagram}
                  </a>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDetail;
