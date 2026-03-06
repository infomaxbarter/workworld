import { useEffect, useState } from 'react';
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
import { MapPin, Globe, Twitter, Linkedin, Instagram, ArrowLeft, Edit2, Save, Clock, CheckCircle } from 'lucide-react';
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
  created_at: string;
}

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', id!).single();
      if (data) {
        setProfile(data as unknown as Profile);
        setForm(data as unknown as Profile);
      }
      const { data: { session } } = await supabase.auth.getSession();
      setIsOwner(session?.user?.id === id);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    const { error } = await supabase.from('profiles').update({
      display_name: form.display_name || '',
      bio: form.bio,
      location: form.location,
      website: form.website,
      twitter: form.twitter,
      linkedin: form.linkedin,
      instagram: form.instagram,
      lat: form.lat,
      lng: form.lng,
    }).eq('user_id', id!);

    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile({ ...profile!, ...form } as Profile);
    setEditing(false);
    toast.success('Profile updated!');
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
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
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

              {/* Map location picker */}
              <div className="space-y-2">
                <Label>{t('map.pick_location')}</Label>
                <LocationPicker
                  lat={form.lat ?? null}
                  lng={form.lng ?? null}
                  onChange={(lat, lng) => setForm({ ...form, lat, lng })}
                />
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
