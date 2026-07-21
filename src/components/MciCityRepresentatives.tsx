import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Props { cityId: string; seatQuota: number; city: string }

interface Rep {
  id: string;
  slot_index: number;
  profession_id: string;
  profile_id: string | null;
  professions?: { name: string; name_i18n: any; slug: string | null } | null;
  profiles?: { display_name: string; avatar_url: string | null; slug: string | null; user_id: string } | null;
}

interface Application {
  id: string;
  user_id: string;
  city_id: string;
  profession_id: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

interface Profession { id: string; name: string; name_i18n: any; slug: string | null }

const MciCityRepresentatives = ({ cityId, seatQuota, city }: Props) => {
  const lp = useLocalizedPath();
  const { lang } = useLanguage();
  const [reps, setReps] = useState<Rep[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [selectedProf, setSelectedProf] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const [{ data: r }, { data: a }, { data: p }, { data: sess }] = await Promise.all([
      (supabase as any).from('mci_city_representatives')
        .select('id,slot_index,profession_id,profile_id,professions(name,name_i18n,slug),profiles(display_name,avatar_url,slug,user_id)')
        .eq('city_id', cityId).order('slot_index'),
      (supabase as any).from('mci_seat_applications')
        .select('*').eq('city_id', cityId).eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('professions').select('id,name,name_i18n,slug').eq('status', 'active').order('name'),
      supabase.auth.getSession(),
    ]);
    setReps((r || []) as Rep[]);
    setApps((a || []) as Application[]);
    setProfessions((p || []) as Profession[]);
    setUserId(sess.session?.user?.id || null);
  };

  useEffect(() => { load(); }, [cityId]);

  const apply = async () => {
    if (!userId) { toast.error('Önce giriş yap'); return; }
    if (!selectedProf) { toast.error('Meslek seç'); return; }
    const { error } = await (supabase as any).from('mci_seat_applications').insert({
      city_id: cityId, profession_id: selectedProf, user_id: userId, message: message || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Başvurun alındı, admin onayı bekleniyor');
    setShowApply(false); setMessage(''); setSelectedProf('');
    load();
  };

  const filled = reps.filter(r => r.profile_id).length;
  const emptySlots = Math.max(0, seatQuota - reps.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="inline-flex items-center gap-2">
            <Users className="w-4 h-4" /> {city} Temsilcileri
          </span>
          <Badge variant="secondary">{filled} / {seatQuota} dolu</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reps.length === 0 && emptySlots === 0 && (
          <p className="text-xs text-muted-foreground">Henüz koltuk oluşturulmadı. Yönetici koltuk açacak.</p>
        )}

        <div className="grid sm:grid-cols-2 gap-2">
          {reps.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
              <div className="text-[10px] font-mono text-muted-foreground w-6 shrink-0">#{r.slot_index}</div>
              {r.profiles ? (
                <Link to={lp('humanDetail', { slug: r.profiles.slug || r.profiles.user_id })}
                      className="flex items-center gap-2 min-w-0 flex-1 hover:text-primary">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={r.profiles.avatar_url || undefined} />
                    <AvatarFallback>{r.profiles.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.profiles.display_name}</div>
                    <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 truncate">
                      <Briefcase className="w-3 h-3" />
                      {r.professions ? pickI18n(r.professions.name_i18n, r.professions.name, lang) : '—'}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-2 min-w-0 flex-1 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full border border-dashed border-border" />
                  <div className="min-w-0">
                    <div className="text-sm italic">Boş koltuk</div>
                    <div className="text-[11px] inline-flex items-center gap-1 truncate">
                      <Briefcase className="w-3 h-3" />
                      {r.professions ? pickI18n(r.professions.name_i18n, r.professions.name, lang) : '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {emptySlots > 0 && Array.from({ length: Math.min(emptySlots, 6) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border text-muted-foreground">
              <div className="text-[10px] font-mono w-6 shrink-0">#{reps.length + i + 1}</div>
              <div className="w-8 h-8 rounded-full border border-dashed border-border" />
              <div className="text-sm italic">Açılmamış koltuk</div>
            </div>
          ))}
        </div>

        {emptySlots > 6 && (
          <p className="text-xs text-muted-foreground text-center">+ {emptySlots - 6} koltuk daha bekliyor</p>
        )}

        <div className="pt-2 border-t border-border">
          {!showApply ? (
            <Button size="sm" variant="outline" onClick={() => setShowApply(true)} className="w-full">
              <UserPlus className="w-4 h-4 mr-1" /> Kariyer: Temsilci olmak için başvur
            </Button>
          ) : (
            <div className="space-y-2">
              <select
                value={selectedProf}
                onChange={(e) => setSelectedProf(e.target.value)}
                className="w-full h-9 px-2 rounded border border-border bg-background text-sm"
              >
                <option value="">Meslek seç…</option>
                {professions.map(p => (
                  <option key={p.id} value={p.id}>{pickI18n(p.name_i18n, p.name, lang)}</option>
                ))}
              </select>
              <Textarea rows={2} placeholder="Neden bu koltuk? (isteğe bağlı)"
                        value={message} onChange={(e) => setMessage(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={apply} className="flex-1">Başvuruyu gönder</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowApply(false)}>Vazgeç</Button>
              </div>
            </div>
          )}
        </div>

        {apps.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-medium mb-2">Bekleyen başvurular ({apps.length})</div>
            <div className="space-y-1">
              {apps.slice(0, 5).map(a => {
                const prof = professions.find(p => p.id === a.profession_id);
                return (
                  <div key={a.id} className="text-[11px] text-muted-foreground flex items-center justify-between gap-2 py-1">
                    <span className="truncate">
                      {prof ? pickI18n(prof.name_i18n, prof.name, lang) : 'Genel'}
                      {a.message && ` — ${a.message.slice(0, 60)}`}
                    </span>
                    <span className="shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MciCityRepresentatives;
