import type { ApprovalMode, ApprovalStatus, QueueRow } from '../api/approvals.types';
import { assessRisk, totalFlags, type RiskAssessment } from './risk';

export type StatusFilter = ApprovalStatus | 'ALL' | 'OPEN';

export interface QueueFilters {
  search: string;
  status: StatusFilter;
  cycleId: string;
  mode: ApprovalMode | 'ALL';
  onlyFlagged: boolean;
  onlyShort: boolean;
}

export const DEFAULT_FILTERS: QueueFilters = {
  search: '',
  status: 'OPEN',
  cycleId: 'ALL',
  mode: 'ALL',
  onlyFlagged: false,
  onlyShort: false,
};

export type SortKey = 'RISK' | 'SLA' | 'SUBMITTED' | 'OPERATOR' | 'CONTACTS' | 'FLAGS' | 'STATUS';
export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

/** Riskiest first is the default because that is the order a reviewer would pick by hand. */
export const DEFAULT_SORT: SortState = { key: 'RISK', dir: 'desc' };

export function riskIndex(rows: QueueRow[], now: number = Date.now()): Map<string, RiskAssessment> {
  return new Map(rows.map((r) => [r.batchId, assessRisk(r, now)]));
}

export function filterRows(rows: QueueRow[], f: QueueFilters): QueueRow[] {
  const needle = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status === 'OPEN') {
      if (r.status !== 'AWAITING_REVIEW' && r.status !== 'AUTO_APPROVED') return false;
    } else if (f.status !== 'ALL' && r.status !== f.status) {
      return false;
    }
    if (f.cycleId !== 'ALL' && r.cycleId !== f.cycleId) return false;
    if (f.mode !== 'ALL' && r.approvalMode !== f.mode) return false;
    if (f.onlyFlagged && totalFlags(r.flags) === 0) return false;
    if (f.onlyShort && r.contactCount >= r.minimumContacts) return false;
    if (needle) {
      const hay = `${r.operatorName} ${r.terminalName} ${r.airportName} ${r.airportIata} ${r.cycleLabel}`;
      if (!hay.toLowerCase().includes(needle)) return false;
    }
    return true;
  });
}

const STATUS_ORDER: Record<ApprovalStatus, number> = {
  AWAITING_REVIEW: 0,
  AUTO_APPROVED: 1,
  REJECTED: 2,
  APPROVED: 3,
};

export function sortRows(
  rows: QueueRow[],
  sort: SortState,
  risks: Map<string, RiskAssessment>,
): QueueRow[] {
  const dir = sort.dir === 'asc' ? 1 : -1;
  const value = (r: QueueRow): number | string => {
    switch (sort.key) {
      case 'RISK':
        return risks.get(r.batchId)?.score ?? 0;
      case 'SLA':
        return new Date(r.slaDueAt).getTime();
      case 'SUBMITTED':
        return new Date(r.submittedAt).getTime();
      case 'OPERATOR':
        return r.operatorName.toLowerCase();
      case 'CONTACTS':
        return r.contactCount - r.minimumContacts;
      case 'FLAGS':
        return totalFlags(r.flags);
      case 'STATUS':
        return STATUS_ORDER[r.status];
    }
  };

  return [...rows].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * dir;
    if (va === vb) {
      // a stable tiebreak keeps rows from shuffling when scores match
      return a.operatorName.localeCompare(b.operatorName);
    }
    return (Number(va) - Number(vb)) * dir;
  });
}

/** Everything visible, used by the empty state where the default view is itself a filter. */
export const CLEARED_FILTERS: QueueFilters = { ...DEFAULT_FILTERS, status: 'ALL' };

export function isFiltered(f: QueueFilters): boolean {
  return (
    f.search.trim() !== DEFAULT_FILTERS.search ||
    f.status !== DEFAULT_FILTERS.status ||
    f.cycleId !== DEFAULT_FILTERS.cycleId ||
    f.mode !== DEFAULT_FILTERS.mode ||
    f.onlyFlagged !== DEFAULT_FILTERS.onlyFlagged ||
    f.onlyShort !== DEFAULT_FILTERS.onlyShort
  );
}

export function cycleOptions(rows: QueueRow[]): Array<{ id: string; label: string }> {
  const seen = new Map<string, string>();
  for (const r of rows) seen.set(r.cycleId, r.cycleLabel);
  return [...seen.entries()].map(([id, label]) => ({ id, label }));
}
