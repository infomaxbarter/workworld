import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

interface HistoryRow {
  id: string;
  changed_at: string;
  change_type: string;
  snapshot: any;
}

const MciCityHistory = ({ cityId }: { cityId: string }) => {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('mci_city_history')
        .select('id,changed_at,change_type,snapshot')
        .eq('city_id', cityId)
        .order('changed_at', { ascending: false })
        .limit(20);
      setRows((data || []) as HistoryRow[]);
      setLoading(false);
    })();
  }, [cityId]);

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" /> Sürüm Geçmişi
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-xs">
        {rows.map(r => (
          <div key={r.id} className="flex items-center justify-between gap-2 py-1 border-b border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={r.change_type === 'create' ? 'default' : 'outline'} className="text-[10px]">
                {r.change_type === 'create' ? 'oluşturma' : 'güncelleme'}
              </Badge>
              <span className="font-mono text-muted-foreground truncate">
                v{r.snapshot?.data_version ?? '?'} · CP {r.snapshot?.cp_final ?? '—'} · K {r.snapshot?.seat_quota ?? '—'}
              </span>
            </div>
            <span className="text-muted-foreground shrink-0">{new Date(r.changed_at).toLocaleString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MciCityHistory;
