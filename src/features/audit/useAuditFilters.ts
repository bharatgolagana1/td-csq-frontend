import { fromZonedTime } from 'date-fns-tz';
import { useCallback, useMemo, useState } from 'react';

import { type AuditListQuery } from '@/api/audit.types';
import { type SortState } from '@/design/primitives';
import { DEFAULT_TZ } from '@/lib/format';

/* Owns the list state of the audit page — filters, search, date range, page,
   sort — and derives the `GET /audit` query from it. Dates are whole days in
   the platform zone, sent as UTC instants. Any filter change returns to page 1. */

export type AuditFilters = {
  q: string;
  entity: string;
  action: string;
  orgId: string;
  actor: string;
  /** 'YYYY-MM-DD' in the platform zone, inclusive. */
  from: string;
  to: string;
};

export const EMPTY_AUDIT_FILTERS: AuditFilters = { q: '', entity: '', action: '', orgId: '', actor: '', from: '', to: '' };
const DEFAULT_SORT: SortState = { id: 'at', dir: 'desc' };

export function sortParam(sort: SortState): string {
  return `${sort.dir === 'desc' ? '-' : ''}${sort.id}`;
}

/** Start of `from` and end of `to` as ISO instants; invalid dates are dropped. */
export function dateRangeToInstants(from: string, to: string, tz = DEFAULT_TZ): { from?: string; to?: string } {
  const out: { from?: string; to?: string } = {};
  const valid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (valid(from)) {
    const d = fromZonedTime(`${from}T00:00:00`, tz);
    if (!Number.isNaN(d.getTime())) out.from = d.toISOString();
  }
  if (valid(to)) {
    const d = fromZonedTime(`${to}T23:59:59.999`, tz);
    if (!Number.isNaN(d.getTime())) out.to = d.toISOString();
  }
  return out;
}

/** The filter part of the query (no paging), shared by the list and the CSV export. */
export function auditFilterQuery(filters: AuditFilters): Omit<AuditListQuery, 'page' | 'pageSize'> {
  return {
    q: filters.q || undefined,
    entity: filters.entity || undefined,
    action: filters.action || undefined,
    orgId: filters.orgId || undefined,
    actor: filters.actor || undefined,
    ...dateRangeToInstants(filters.from, filters.to),
  };
}

export function useAuditFilters() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(25);
  const [sort, setSortState] = useState<SortState>(DEFAULT_SORT);

  const set = useCallback(<K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => {
    setFilters((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
    setPage(1);
  }, []);
  const reset = useCallback(() => {
    setFilters(EMPTY_AUDIT_FILTERS);
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

  const filterQuery = useMemo(() => ({ ...auditFilterQuery(filters), sort: sortParam(sort) }), [filters, sort]);
  const query = useMemo<AuditListQuery>(() => ({ ...filterQuery, page, pageSize }), [filterQuery, page, pageSize]);
  const hasFilters = Object.values(filters).some((v) => v !== '');

  return { filters, set, reset, hasFilters, page, setPage, pageSize, setPageSize, sort, setSort, query, filterQuery };
}
