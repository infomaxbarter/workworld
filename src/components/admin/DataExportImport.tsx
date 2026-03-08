import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, FileSpreadsheet, FileText, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const TABLES = [
  { key: 'profiles', label: 'Profiller', columns: ['id', 'user_id', 'display_name', 'bio', 'location', 'city', 'country', 'website', 'twitter', 'linkedin', 'instagram', 'github', 'approved', 'slug', 'status', 'lat', 'lng', 'created_at'] },
  { key: 'user_markers', label: 'Anonim Üyeler', columns: ['id', 'name', 'lat', 'lng', 'city', 'country', 'slug', 'status', 'created_at'] },
  { key: 'event_markers', label: 'Etkinlikler', columns: ['id', 'title', 'date', 'start_date', 'end_date', 'description', 'lat', 'lng', 'city', 'country', 'capacity', 'external_url', 'slug', 'status', 'created_at'] },
  { key: 'professions', label: 'Meslekler', columns: ['id', 'name', 'description', 'icon', 'slug', 'status', 'lat', 'lng', 'created_at'] },
  { key: 'submissions', label: 'Başvurular', columns: ['id', 'name', 'email', 'message', 'created_at'] },
  { key: 'posts', label: 'Yazılar', columns: ['id', 'author_id', 'title', 'content', 'slug', 'status', 'target_type', 'target_id', 'created_at'] },
  { key: 'comments', label: 'Yorumlar', columns: ['id', 'user_id', 'target_type', 'target_id', 'content', 'status', 'created_at'] },
  { key: 'reports', label: 'Raporlar', columns: ['id', 'type', 'target_id', 'reason', 'created_by', 'created_at'] },
  { key: 'notifications', label: 'Bildirimler', columns: ['id', 'user_id', 'type', 'title', 'message', 'link', 'read', 'created_at'] },
  { key: 'profile_edit_requests', label: 'Düzenleme İstekleri', columns: ['id', 'profile_id', 'user_id', 'old_data', 'new_data', 'status', 'admin_response', 'created_at', 'reviewed_at'] },
] as const;

type TableKey = typeof TABLES[number]['key'];

const escapeCsvField = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const DataExportImport = ({ onReload }: { onReload: () => void }) => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importTable, setImportTable] = useState<TableKey>('user_markers');
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportTable = async (tableKey: TableKey, format: 'csv' | 'xlsx') => {
    setExporting(tableKey);
    try {
      const table = TABLES.find(t => t.key === tableKey)!;
      const { data, error } = await supabase.from(tableKey).select('*').order('created_at', { ascending: false }).limit(5000);
      if (error) throw error;
      if (!data || data.length === 0) { toast.info('Tabloda veri bulunamadı'); setExporting(null); return; }

      const header = table.columns.join(format === 'csv' ? ',' : '\t');
      const rows = (data as any[]).map(row =>
        table.columns.map(col => escapeCsvField((row as any)[col])).join(format === 'csv' ? ',' : '\t')
      );
      const content = [header, ...rows].join('\n');

      // BOM for Excel compatibility
      const bom = '\uFEFF';
      const blob = new Blob([bom + content], {
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableKey}_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'xls' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${table.label} — ${data.length} kayıt dışa aktarıldı`);
    } catch (err: any) {
      toast.error(err.message || 'Export hatası');
    }
    setExporting(null);
  };

  const exportAll = async (format: 'csv' | 'xlsx') => {
    for (const table of TABLES) {
      await exportTable(table.key, format);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('Dosyada veri bulunamadı'); setImporting(false); return; }

      const separator = text.includes('\t') ? '\t' : ',';
      const headers = lines[0].split(separator).map(h => h.replace(/^"|"$/g, '').replace(/^\uFEFF/, '').trim());

      let success = 0;
      let errors = 0;

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 1; i < lines.length; i += batchSize) {
        const batch = lines.slice(i, i + batchSize).map(line => {
          const values = parseCsvLine(line, separator);
          const row: Record<string, any> = {};
          headers.forEach((h, idx) => {
            let val = values[idx] || '';
            // Remove surrounding quotes
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"');
            // Try parse JSON for jsonb fields
            if ((h === 'old_data' || h === 'new_data') && val) {
              try { row[h] = JSON.parse(val); return; } catch { /* keep as string */ }
            }
            // Skip id to let DB generate
            if (h === 'id') return;
            if (val === '') { row[h] = null; return; }
            if (val === 'true') { row[h] = true; return; }
            if (val === 'false') { row[h] = false; return; }
            // numeric check for lat/lng/capacity
            if (['lat', 'lng', 'capacity', 'sort_order'].includes(h) && !isNaN(Number(val))) { row[h] = Number(val); return; }
            row[h] = val;
          });
          return row;
        });

        const { error } = await supabase.from(importTable).insert(batch as any);
        if (error) {
          errors += batch.length;
          console.error('Import batch error:', error);
        } else {
          success += batch.length;
        }
      }

      setImportResult({ success, errors });
      if (success > 0) {
        toast.success(`${success} kayıt içe aktarıldı${errors > 0 ? `, ${errors} hata` : ''}`);
        onReload();
      } else {
        toast.error(`Import başarısız: ${errors} hata`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Import hatası');
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-primary" /> Dışa Aktar (Export)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => exportAll('csv')} className="gap-1.5">
              <FileText className="w-4 h-4" /> Tümünü CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAll('xlsx')} className="gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Tümünü XLS
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TABLES.map(table => (
              <div key={table.key} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{table.label}</p>
                  <p className="text-xs text-muted-foreground">{table.columns.length} sütun</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => exportTable(table.key, 'csv')}
                    disabled={exporting === table.key}
                    title="CSV"
                  >
                    {exporting === table.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => exportTable(table.key, 'xlsx')}
                    disabled={exporting === table.key}
                    title="XLS"
                  >
                    {exporting === table.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-primary" /> İçe Aktar (Import)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">CSV veya TSV dosyası yükleyerek veri ekleyebilirsiniz. İlk satır sütun başlığı olmalıdır. <code>id</code> sütunu otomatik oluşturulur.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={importTable} onValueChange={(v) => setImportTable(v as TableKey)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map(t => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="gap-1.5"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'İçe aktarılıyor...' : 'Dosya Seç'}
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xls" className="hidden" onChange={handleImport} />
          </div>

          {/* Template download */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground mb-2">Taslak İndir</p>
            <div className="flex flex-wrap gap-2">
              {TABLES.map(table => (
                <Button
                  key={table.key}
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => {
                    const cols = table.columns.filter(c => c !== 'id');
                    const bom = '\uFEFF';
                    const blob = new Blob([bom + cols.join(',') + '\n'], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${table.key}_template.csv`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-3 h-3" /> {table.label}
                </Button>
              ))}
            </div>
          </div>

          {importResult && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <div className="text-sm">
                <span className="text-foreground font-medium">{importResult.success}</span> kayıt başarılı
                {importResult.errors > 0 && <>, <span className="text-destructive font-medium">{importResult.errors}</span> hata</>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { current += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === sep) { result.push(current); current = ''; }
      else { current += char; }
    }
  }
  result.push(current);
  return result;
}

export default DataExportImport;
