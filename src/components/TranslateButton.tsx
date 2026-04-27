import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Lang } from '@/i18n/translations';

interface TranslateButtonProps {
  /** Source text (usually the TR value) */
  source: string;
  sourceLang?: Lang;
  /** Languages to translate into. Default: en + de */
  targets?: Lang[];
  onResult: (translations: Record<Lang, string>) => void;
  size?: 'sm' | 'default';
  label?: string;
  disabled?: boolean;
}

const TranslateButton = ({
  source,
  sourceLang = 'tr',
  targets = ['en', 'de'],
  onResult,
  size = 'sm',
  label = 'AI Translate',
  disabled,
}: TranslateButtonProps) => {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!source?.trim()) {
      toast({ title: 'No text', description: 'Enter text first.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { text: source, source: sourceLang, targets },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onResult(data.translations as Record<Lang, string>);
      toast({ title: 'Translated', description: `Generated ${targets.join(', ').toUpperCase()}` });
    } catch (e: any) {
      toast({ title: 'Translation failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size={size} onClick={run} disabled={loading || disabled}>
      {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Languages className="w-3.5 h-3.5 mr-1.5" />}
      {label}
    </Button>
  );
};

export default TranslateButton;
