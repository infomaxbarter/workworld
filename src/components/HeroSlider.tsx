import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';

interface Slide {
  id: string; title: string; subtitle: string | null; image_url: string | null;
  cta_label: string | null; cta_url: string | null;
  title_i18n: any; subtitle_i18n: any;
}

const HeroSlider = () => {
  const { lang } = useLanguage();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('hero_slides').select('*').eq('active', true).order('sort_order');
      setSlides((data as Slide[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const s = slides[Math.min(idx, slides.length - 1)];
  const title = pickI18n(s.title_i18n, s.title, lang);
  const subtitle = pickI18n(s.subtitle_i18n, s.subtitle || '', lang);

  return (
    <div className="relative mb-6 rounded-xl overflow-hidden border border-border bg-muted/30">
      {s.image_url && (
        <img src={s.image_url} alt={title} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      )}
      <div className="relative px-6 py-10 sm:py-14 text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>}
        {s.cta_url && s.cta_label && (
          <Button asChild size="sm"><Link to={s.cta_url}>{s.cta_label}</Link></Button>
        )}
      </div>
      {slides.length > 1 && (
        <>
          <button aria-label="Previous slide" onClick={() => setIdx(i => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 hover:bg-background border border-border">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button aria-label="Next slide" onClick={() => setIdx(i => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 hover:bg-background border border-border">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full ${i === idx ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSlider;
