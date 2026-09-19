import type {
  AssessorKind,
  AssessorType,
  CategoryCode,
  CycleState,
  DirectionKey,
} from '../api/history.types';

export const CATEGORY_ORDER: CategoryCode[] = [
  'INFRASTRUCTURE_FACILITIES',
  'SECURITY_SAFETY',
  'PROCESSES',
  'TRADE_FACILITATION',
];

export const CATEGORY_LABEL: Record<CategoryCode, string> = {
  INFRASTRUCTURE_FACILITIES: 'Infrastructure / Facilities',
  SECURITY_SAFETY: 'Security / Safety',
  PROCESSES: 'Processes',
  TRADE_FACILITATION: 'Trade Facilitation',
};

export const ASSESSOR_KIND_LABEL: Record<AssessorKind, string> = {
  SELF: 'Self',
  CUSTOMER: 'Customer',
  EXTERNAL: 'External',
};

export const ASSESSOR_TYPE_LABEL: Record<AssessorType, string> = {
  CTO: 'Cargo terminal operator',
  FREIGHT_FORWARDER: 'Freight forwarder',
  CUSTOMS_BROKER: 'Customs broker',
  INDEPENDENT_AUDITOR: 'Independent auditor',
};

export const DIRECTION_LABEL: Record<DirectionKey, string> = {
  EXPORT: 'Export',
  IMPORT: 'Import',
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
};

export const CYCLE_STATE_LABEL: Record<CycleState, string> = {
  SAMPLING: 'Sampling open',
  ASSESSMENT_OPEN: 'Assessment open',
  CLOSED: 'Closed',
  SCORED: 'Scored',
};

/**
 * Dates are formatted in UTC. The API sends instants, and rendering them in the
 * reader's zone would slide a submission across midnight for anyone travelling,
 * which turns a cycle cutoff into an argument.
 */
const DAY = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const DAY_TIME = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export function formatDay(iso: string | null): string {
  if (!iso) return 'Not submitted';
  return DAY.format(new Date(iso));
}

export function formatDayTime(iso: string | null): string {
  if (!iso) return 'Not submitted';
  return `${DAY_TIME.format(new Date(iso))} UTC`;
}

/** YYYY-MM-DD, read as a calendar day rather than an instant. */
export function formatWindowDay(day: string): string {
  return DAY.format(new Date(`${day}T00:00:00Z`));
}

export function dayToUtc(day: string): number {
  return new Date(`${day}T00:00:00Z`).getTime();
}
