import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ReactNode } from 'react';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  total: number;
  selectedCount?: number;
  onClearSelection?: () => void;
  bulkActions?: ReactNode;
  rightSlot?: ReactNode;
}

const PAGE_SIZES = [10, 25, 50, 100];

const AdminToolbar = ({
  search, onSearch, placeholder,
  page, totalPages, pageSize, onPageChange, onPageSizeChange,
  total, selectedCount = 0, onClearSelection, bulkActions, rightSlot,
}: Props) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-2 mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={placeholder || t('admin.search_placeholder') || 'Search...'}
            className="pl-8 h-9"
          />
        </div>
        {rightSlot}
        <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border">
          <span className="text-sm font-medium">{selectedCount} {t('admin.selected') || 'selected'}</span>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {bulkActions}
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} {t('admin.results') || 'results'}</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2">{page} / {totalPages}</span>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminToolbar;
