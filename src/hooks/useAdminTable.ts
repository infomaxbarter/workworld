import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

interface Options<T> {
  data: T[];
  searchFields?: (keyof T | ((row: T) => string))[];
  initialPageSize?: number;
  initialSortKey?: keyof T;
  initialSortDir?: SortDir;
}

export function useAdminTable<T extends { id: string }>({
  data,
  searchFields = [],
  initialPageSize = 10,
  initialSortKey,
  initialSortDir = 'desc',
}: Options<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<keyof T | undefined>(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(row =>
      searchFields.some(f => {
        const v = typeof f === 'function' ? f(row) : (row as any)[f];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAllVisible = () => {
    setSelected(prev => {
      const allSelected = paged.every(r => prev.has(r.id));
      const next = new Set(prev);
      paged.forEach(r => (allSelected ? next.delete(r.id) : next.add(r.id)));
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const sortBy = (key: keyof T) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  return {
    search, setSearch,
    page: safePage, setPage, pageSize, setPageSize, totalPages,
    sortKey, sortDir, sortBy,
    selected, toggle, toggleAllVisible, clearSelection,
    filtered, sorted, paged,
    total: sorted.length,
    rawTotal: data.length,
  };
}
