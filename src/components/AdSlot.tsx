import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Creative {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  advertiser: string | null;
  cta_label: string | null;
  weight: number;
}

/** Renders a rotating advert for a given slot code. Renders nothing when no advert is scheduled. */
const AdSlot = ({ code, className = '' }: { code: string; className?: string }) => {
  const [creative, setCreative] = useState<Creative | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: slot } = await (supabase as any)
        .from('ad_slots').select('id, active').eq('code', code).maybeSingle();
      if (!slot || slot.active === false) return;
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from('ad_creatives')
        .select('id, title, body, image_url, link_url, advertiser, cta_label, weight, starts_at, ends_at')
        .eq('slot_id', slot.id)
        .eq('active', true);
      const eligible: Creative[] = (data || []).filter((c: any) =>
        (!c.starts_at || c.starts_at <= today) && (!c.ends_at || c.ends_at >= today));
      if (!eligible.length || cancelled) return;
      // weighted random pick
      const pool: Creative[] = [];
      eligible.forEach(c => { for (let i = 0; i < Math.max(1, c.weight || 1); i++) pool.push(c); });
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setCreative(pick);
      (supabase as any).rpc('ad_track', { _creative_id: pick.id, _kind: 'view' });
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (!creative) return null;

  const onClick = () => {
    (supabase as any).rpc('ad_track', { _creative_id: creative.id, _kind: 'click' });
  };

  const inner = (
    <div className="flex items-center gap-3 p-3">
      {creative.image_url && (
        <img src={creative.image_url} alt={creative.title} loading="lazy" className="w-24 h-16 object-cover rounded-md shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{creative.title}</p>
        {creative.body && <p className="text-xs text-muted-foreground line-clamp-2">{creative.body}</p>}
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
          Ad{creative.advertiser ? ` · ${creative.advertiser}` : ''}
          {creative.cta_label ? ` · ${creative.cta_label}` : ''}
        </p>
      </div>
    </div>
  );

  return (
    <aside className={`border border-border rounded-lg bg-card overflow-hidden ${className}`} aria-label="Advertisement">
      {creative.link_url ? (
        <a href={creative.link_url} target="_blank" rel="noopener sponsored" onClick={onClick} className="block hover:bg-accent/50 transition-colors">
          {inner}
        </a>
      ) : inner}
    </aside>
  );
};

export default AdSlot;
