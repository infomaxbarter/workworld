import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickI18n } from '@/i18n/i18nField';

interface Faq {
  id: string; question: string; answer: string;
  question_i18n: any; answer_i18n: any;
  keywords: string[]; link_url: string | null; link_label: string | null; category: string;
}

interface Msg { from: 'bot' | 'user'; text: string; link?: { url: string; label: string } | null }

const FaqChat = () => {
  const { lang } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [greeting, setGreeting] = useState('Hi! Ask me anything.');
  const [open, setOpen] = useState(false);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: f }] = await Promise.all([
        (supabase as any).from('site_settings').select('value').eq('key', 'chatbot').maybeSingle(),
        (supabase as any).from('faq_items').select('*').eq('active', true).order('sort_order'),
      ]);
      const cfg = (s?.value as any) || {};
      setEnabled(cfg.enabled !== false);
      if (cfg.greeting) setGreeting(cfg.greeting);
      setFaqs(f || []);
    })();
  }, []);

  useEffect(() => {
    if (open && msgs.length === 0) setMsgs([{ from: 'bot', text: greeting }]);
  }, [open, greeting]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  const localized = useMemo(
    () => faqs.map(f => ({
      ...f,
      q: pickI18n(f.question_i18n, f.question, lang),
      a: pickI18n(f.answer_i18n, f.answer, lang),
    })),
    [faqs, lang]
  );

  const answer = (text: string) => {
    const q = text.toLowerCase().trim();
    const scored = localized
      .map(f => {
        const hay = `${f.q} ${f.a} ${(f.keywords || []).join(' ')}`.toLowerCase();
        const words = q.split(/\s+/).filter(w => w.length > 2);
        const score = words.reduce((acc, w) => acc + (hay.includes(w) ? 1 : 0), 0) + (hay.includes(q) ? 2 : 0);
        return { f, score };
      })
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best || best.score === 0) {
      return { from: 'bot' as const, text: 'I could not find that yet. Try a topic below, or reach out from the contact section.' };
    }
    return {
      from: 'bot' as const,
      text: best.f.a,
      link: best.f.link_url ? { url: best.f.link_url, label: best.f.link_label || 'Open page' } : null,
    };
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { from: 'user', text }, answer(text)]);
    setInput('');
  };

  if (!enabled) return null;

  return (
    <>
      <Button
        aria-label="Help chat"
        onClick={() => setOpen(o => !o)}
        size="icon"
        className="fixed right-4 bottom-20 md:bottom-6 z-50 rounded-full h-12 w-12 shadow-lg"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </Button>

      {open && (
        <div className="fixed right-4 bottom-36 md:bottom-20 z-50 w-[calc(100vw-2rem)] sm:w-80 rounded-lg border border-border bg-card shadow-xl flex flex-col max-h-[60vh]">
          <div className="px-3 py-2 border-b border-border text-sm font-medium">WorkWorldMap Help</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`text-sm rounded-md px-3 py-2 max-w-[90%] ${m.from === 'bot' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground ml-auto'}`}>
                <p>{m.text}</p>
                {m.link && (
                  m.link.url.startsWith('http') ? (
                    <a href={m.link.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs underline">
                      {m.link.label} <ArrowRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link to={m.link.url} onClick={() => setOpen(false)} className="mt-1 inline-flex items-center gap-1 text-xs underline">
                      {m.link.label} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="px-3 pb-2 flex gap-1 flex-wrap">
            {localized.slice(0, 4).map(f => (
              <button key={f.id} onClick={() => send(f.q)} className="text-[11px] rounded-full border border-border px-2 py-1 text-muted-foreground hover:text-foreground">
                {f.q.length > 28 ? `${f.q.slice(0, 28)}…` : f.q}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-2 border-t border-border flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your question…" className="h-9" />
            <Button type="submit" size="icon" className="h-9 w-9"><Send className="w-4 h-4" /></Button>
          </form>
        </div>
      )}
    </>
  );
};

export default FaqChat;
