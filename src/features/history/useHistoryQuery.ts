import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { type AssessmentListQuery } from '@/api/assessments.types';
import { type SortState } from '@/design/primitives';

/* History grid state in the URL (`?cycleId=&kind=&status=&customerType=&surveyType=
   &page=&pageSize=&sort=`) so a row → return → back keeps the filters. */

export const FILTER_KEYS = ['cycleId', 'kind', 'status', 'customerType', 'surveyType'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type HistoryFilters = Record<FilterKey, string>;

const DEFAULT_SORT: SortState = { id: 'startedAt', dir: 'desc' };

function parseSort(raw: string | null): SortState {
  if (!raw) return DEFAULT_SORT;
  return raw.startsWith('-') ? { id: raw.slice(1), dir: 'desc' } : { id: raw, dir: 'asc' };
}

export type HistoryQueryState = {
  filters: HistoryFilters;
  filtered: boolean;
  setFilter: (key: FilterKey, value: string) => void;
  clearFilters: () => void;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  sort: SortState;
  setSort: (sort: SortState) => void;
  /** The `GET /assessments` query for the current state. */
  query: AssessmentListQuery;
};

export function useHistoryQuery(): HistoryQueryState {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ''])) as HistoryFilters, [params]);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = Math.max(1, Number(params.get('pageSize')) || 25);
  const sort = parseSort(params.get('sort'));

  const query = useMemo<AssessmentListQuery>(
    () => ({
      page,
      pageSize,
      sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
      ...(filters.cycleId ? { cycleId: filters.cycleId } : {}),
      ...(filters.kind ? { kind: filters.kind as AssessmentListQuery['kind'] } : {}),
      ...(filters.status ? { status: filters.status as AssessmentListQuery['status'] } : {}),
      ...(filters.customerType ? { customerType: filters.customerType as AssessmentListQuery['customerType'] } : {}),
      ...(filters.surveyType ? { surveyType: filters.surveyType as AssessmentListQuery['surveyType'] } : {}),
    }),
    [filters, page, pageSize, sort.dir, sort.id],
  );

  return {
    filters,
    filtered: FILTER_KEYS.some((k) => filters[k] !== ''),
    setFilter: (key, value) =>
      update((next) => {
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
      }),
    clearFilters: () => update((next) => FILTER_KEYS.forEach((k) => next.delete(k))),
    page,
    pageSize,
    setPage: (p) => update((next) => (p > 1 ? next.set('page', String(p)) : next.delete('page'))),
    setPageSize: (size) =>
      update((next) => {
        next.set('pageSize', String(size));
        next.delete('page');
      }),
    sort,
    setSort: (s) => update((next) => next.set('sort', `${s.dir === 'desc' ? '-' : ''}${s.id}`)),
    query,
  };
}
