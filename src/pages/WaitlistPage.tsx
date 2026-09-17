import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, Ticket, Users } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import PageSeo from '@/components/PageSeo';

interface List {
  id: string; name: string; slug: string; description: string | null;
  mode: string; show_counter: boolean; invite_required: boolean; is_default: boolean;
}

const WaitlistPage = () => {
  const [params] = useSearchParams();
  const [lists, setLists] = useState<List[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [count, setCount] = useState<number | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', profession: '', country: '', city: '', community: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [invite, setInvite] = useState('');
  const ref = params.get('ref') || '';

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('waitlist_lists').select('*').eq('active', true).order('is_default', { ascending: false });
      const rows: List[] = data || [];
      setLists(rows);
      if (rows.length) setSlug(rows[0].slug);
    })();
  }, []);

  const active = lists.find(l => l.slug === slug);

  useEffect(() => {
    if (!active || active.mode !== 'public' || !active.show_counter) { setCount(null); return; }
    (supabase as any).rpc('waitlist_count', { _list_slug: active.slug }).then(({ data }: any) => setCount(data ?? null));
  }, [slug, lists]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setSending(true);
    const { data, error } = await (supabase as any).rpc('waitlist_join', {
      _list_slug: active.slug,
      _full_name: form.full_name,
      _email: form.email,
      _profession: form.profession || null,
      _country: form.country || null,
      _city: form.city || null,
      _community: form.community || null,
      _ref: ref || null,
    });
    setSending(false);
    if (error) { toast.error(error.message.includes('invalid_input') ? 'Please check your name and email.' : error.message); return; }
    setResult(data);
    toast.success(data?.existed ? 'You were already on the list.' : 'Request received.');
  };

  const redeem = async () => {
    const { data, error } = await (supabase as any).rpc('waitlist_redeem_invite', { _invite_code: invite.trim(), _email: form.email.trim() });
    if (error) { toast.error(error.message); return; }
    data ? toast.success('Invite accepted — access unlocked.') : toast.error('Invite code not valid for this email.');
  };

  const shareLink = result?.referral_code
    ? `${window.location.origin}/waitlist?ref=${result.referral_code}`
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageSeo title="Waitlist — WorkWorldMap" description="Join the WorkWorldMap early access waitlist. Public queue with referrals or private invite-only list." />
      <section className="px-4 pt-10 pb-12 max-w-3xl mx-auto w-full flex-1">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3">BETA · EARLY ACCESS</Badge>
          <h1 className="text-3xl font-bold text-foreground">Join the waitlist</h1>
          <p className="text-muted-foreground mt-2">Pick a list, leave your details, and we will open access step by step.</p>
        </div>

        {lists.length > 1 && (
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {lists.map(l => (
              <Button key={l.id} size="sm" variant={l.slug === slug ? 'default' : 'outline'} onClick={() => { setSlug(l.slug); setResult(null); }}>
                {l.name}
              </Button>
            ))}
          </div>
        )}

        {active && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-lg">
                <span>{active.name}</span>
                {count !== null && (
                  <span className="text-sm font-normal text-muted-foreground inline-flex items-center gap-1">
                    <Users className="w-4 h-4" /> {count} joined
                  </span>
                )}
              </CardTitle>
              {active.description && <p className="text-sm text-muted-foreground">{active.description}</p>}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4 text-center py-4">
                  <Check className="w-10 h-10 text-primary mx-auto" />
                  {result.mode === 'public' ? (
                    <>
                      <p className="text-lg font-semibold text-foreground">You are #{result.position} of {result.total}</p>
                      <p className="text-sm text-muted-foreground">Invite friends with your link to move up the queue. Referrals: {result.referral_count}</p>
                      <div className="flex gap-2 max-w-md mx-auto">
                        <Input readOnly value={shareLink} />
                        <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Link copied'); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Your request has been received. We will contact you when access opens.</p>
                  )}
                </div>
              ) : (
                <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="wl-name">Full name</Label>
                    <Input id="wl-name" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="wl-email">Email</Label>
                    <Input id="wl-email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="wl-prof">Profession</Label>
                    <Input id="wl-prof" value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="wl-comm">Community</Label>
                    <Input id="wl-comm" value={form.community} onChange={e => setForm({ ...form, community: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="wl-country">Country</Label>
                    <Input id="wl-country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="wl-city">City</Label>
                    <Input id="wl-city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" className="w-full" disabled={sending}>{sending ? 'Sending…' : 'Join the list'}</Button>
                  </div>
                </form>
              )}

              {active.invite_required && (
                <div className="mt-6 border-t border-border pt-4">
                  <Label htmlFor="wl-invite" className="flex items-center gap-1.5"><Ticket className="w-4 h-4" /> Have an invite code?</Label>
                  <div className="flex gap-2 mt-2">
                    <Input id="wl-invite" value={invite} onChange={e => setInvite(e.target.value)} placeholder="INVITE-CODE" />
                    <Button variant="outline" onClick={redeem} disabled={!invite || !form.email}>Redeem</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Enter the email you registered with above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
};

export default WaitlistPage;
