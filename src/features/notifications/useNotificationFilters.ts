import { useCallback, useMemo, useState } from 'react';

import { type NotificationListQuery, type NotificationStatus } from '@/api/notifications.types';
import { type SortState } from '@/design/primitives';

/* Owns the list state of the notifications page — filters, search, page, sort —
   and derives the `GET /notifications` query from it. Any filter change
   returns to page 1. */

export type NotificationFilters = {
  q: string;
  template: string;
  status: NotificationStatus | '';
  cycleId: string;
  acoId: string;
};

export const EMPTY_FILTERS: NotificationFilters = { q: '', template: '', status: '', cycleId: '', acoId: '' };
const DEFAULT_SORT: SortState = { id: 'createdAt', dir: 'desc' };

export function sortParam(sort: SortState): string {
  return `${sort.dir === 'desc' ? '-' : ''}${sort.id}`;
}

export function useNotificationFilters() {
  const [filters, setFilters] = useState<NotificationFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(25);
  const [sort, setSortState] = useState<SortState>(DEFAULT_SORT);

  const set = useCallback(<K extends keyof NotificationFilters>(key: K, value: NotificationFilters[K]) => {
    setFilters((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPage(1);
  }, []);

  const setSort = useCallback((s: SortState) => {
    setSortState(s);
    setPage(1);
  }, []);

  const query = useMemo<NotificationListQuery>(
    () => ({
      q: filters.q || undefined,
      template: filters.template || undefined,
      status: filters.status || undefined,
      cycleId: filters.cycleId || undefined,
      acoId: filters.acoId || undefined,
      page,
      pageSize,
      sort: sortParam(sort),
    }),
    [filters, page, pageSize, sort],
  );

  const hasFilters = Object.values(filters).some((v) => v !== '');

  return { filters, set, reset, hasFilters, page, setPage, pageSize, setPageSize, sort, setSort, query };
}
