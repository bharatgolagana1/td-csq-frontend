import { keepPreviousData, type QueryClient, useQuery } from '@tanstack/react-query';

import { type AuditEntry, type AuditListQuery } from './audit.types';
import { api } from './client';
import { type Page } from './types';

/* audit module hooks (§6 audit). Read-only; nothing invalidates it except
   the mutations of other modules, which is why entries are fetched fresh. */

export const auditKeys = {
  all: ['audit'] as const,
  list: (query: AuditListQuery) => ['audit', 'list', query] as const,
};

export function useAudit(query: AuditListQuery, enabled = true) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: ({ signal }) => api.list<AuditEntry>('/audit', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** The export reads at most this many entries of the current filter. */
export const AUDIT_EXPORT_LIMIT = 2000;
const EXPORT_PAGE_SIZE = 200;

/**
 * Collects the filtered entries page by page (through the query cache, so pages
 * already on screen are reused) up to `AUDIT_EXPORT_LIMIT`. Returns the rows
 * and whether the limit cut the result short.
 */
export async function fetchAuditForExport(qc: QueryClient, filters: Omit<AuditListQuery, 'page' | 'pageSize'>, limit = AUDIT_EXPORT_LIMIT): Promise<{ rows: AuditEntry[]; total: number; truncated: boolean }> {
  const rows: AuditEntry[] = [];
  let total = 0;
  for (let page = 1; rows.length < limit; page += 1) {
    const query: AuditListQuery = { ...filters, page, pageSize: EXPORT_PAGE_SIZE };
    const result: Page<AuditEntry> = await qc.fetchQuery({
      queryKey: auditKeys.list(query),
      queryFn: ({ signal }) => api.list<AuditEntry>('/audit', query, { signal }),
      staleTime: 30_000,
    });
    total = result.meta.total;
    rows.push(...result.data);
    if (result.data.length < EXPORT_PAGE_SIZE || rows.length >= total) break;
  }
  const truncated = rows.length > limit || total > rows.length;
  return { rows: rows.slice(0, limit), total, truncated };
}
