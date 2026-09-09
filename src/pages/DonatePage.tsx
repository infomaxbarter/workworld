import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Mail, Star, Crown } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import PageSeo from '@/components/PageSeo';
import AdSlot from '@/components/AdSlot';

interface Tier {
  id: string; code: string; name: string; description: string | null;
  min_amount: number; currency: string; badge_label: string | null;
  badge_color: string; badge_icon: string; perks: string | null; highlight_days: number;
}

const iconFor = (icon: string) => icon === 'crown' ? Crown : icon === 'star' ? Star : Heart;

const DonatePage = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [supporters, setSupporters] = useState<any[]>([]);
  const [contact, setContact] = useState<{ whatsapp?: string; email?: string; note?: string }>({});
  const [form, setForm] = useState({ donor_name: '', email: '', whatsapp: '', amount: '', message: '', show_publicly: true });
  const [tierId, setTierId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: b }, { data: s }] = await Promise.all([
        (supabase as any).from('donation_tiers').select('*').eq('active', true).order('sort_order'),
        (supabase as any).from('donor_badges').select('id, display_name, label, color, icon, featured').eq('active', true).order('featured', { ascending: false }).limit(24),
        (supabase as any).from('site_settings').select('value').eq('key', 'donate_contact').maybeSingle(),
      ]);
      setTiers(t || []);
      setSupporters(b || []);
      setContact((s?.value as any) || {});
      if (t?.length) setTierId(t[Math.min(1, t.length - 1)].id);
    })();
  }, []);

  const waLink = contact.whatsapp
    ? `https://wa.me/${String(contact.whatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I would like to support WorkWorldMap.')}`
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donor_name.trim()) return toast.error('Please add your name');
    setSending(true);
    const { error } = await (supabase as any).from('donations').insert({
      tier_id: tierId,
      donor_name: form.donor_name.trim(),
      email: form.email.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      amount: Number(form.amount) || 0,
      message: form.message.trim() || null,
      channel: form.whatsapp ? 'whatsapp' : 'email',
      show_publicly: form.show_publicly,
      status: 'pending',
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success('Thanks! We will contact you to complete your donation.');
    setForm({ donor_name: '', email: '', whatsapp: '', amount: '', message: '', show_publicly: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Support WorkWorldMap — Donate" description="Support the open-source WorkWorldMap project. Donors get a profile badge and featured placement in listings." />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Support WorkWorldMap</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {contact.note || 'WorkWorldMap is an open-source, non-profit project. Donations fund city data collection, hosting and community events. Donors receive a badge on their profile and featured placement in listings.'}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {waLink && (
              <Button asChild className="gap-1.5"><a href={waLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" /> WhatsApp</a></Button>
            )}
            {contact.email && (
              <Button variant="outline" asChild className="gap-1.5"><a href={`mailto:${contact.email}?subject=Donation`}><Mail className="w-4 h-4" /> {contact.email}</a></Button>
            )}
          </div>
        </header>

        <AdSlot code="home_hero" />

        <section className="grid gap-4 md:grid-cols-3">
          {tiers.map(tier => {
            const Icon = iconFor(tier.badge_icon);
            const selected = tierId === tier.id;
            return (
              <Card key={tier.id} className={selected ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-4 h-4" style={{ color: tier.badge_color }} />
                    {tier.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-2xl font-semibold">{tier.min_amount} {tier.currency}<span className="text-xs text-muted-foreground font-normal">+</span></p>
                  {tier.description && <p className="text-muted-foreground">{tier.description}</p>}
                  {tier.perks && <p className="text-xs text-muted-foreground">{tier.perks}</p>}
                  <p className="text-xs text-muted-foreground">Badge active for {tier.highlight_days} days</p>
                  <Button size="sm" variant={selected ? 'default' : 'outline'} className="w-full" onClick={() => setTierId(tier.id)}>
                    {selected ? 'Selected' : 'Choose'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Tell us you want to donate</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-3">
                <div><Label>Name</Label><Input value={form.donor_name} onChange={e => setForm({ ...form, donor_name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+90..." /></div>
                </div>
                <div><Label>Amount</Label><Input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Message</Label><Textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={form.show_publicly} onChange={e => setForm({ ...form, show_publicly: e.target.checked })} />
                  Show my name on the supporters list
                </label>
                <Button type="submit" disabled={sending} className="w-full gap-1.5"><Heart className="w-4 h-4" /> {sending ? 'Sending…' : 'Send request'}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Supporters</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {supporters.length === 0 && <p className="text-sm text-muted-foreground">Be the first supporter.</p>}
              {supporters.map(s => (
                <Badge key={s.id} variant="outline" className="gap-1" style={{ borderColor: s.color, color: s.color }}>
                  <Heart className="w-3 h-3" /> {s.display_name || s.label}
                  {s.featured && <Star className="w-3 h-3" />}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default DonatePage;
