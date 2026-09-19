import type { FlagTally, IntegrityCode, QueueRow } from '../api/approvals.types';
import { FLAG_META, FLAG_ORDER, SEVERITY_WEIGHT } from './integrity';

export type RiskBand = 'HIGH' | 'ELEVATED' | 'ROUTINE';

export interface RiskAssessment {
  score: number;
  band: RiskBand;
  /** the plain reasons behind the score, shown rather than left implicit */
  reasons: string[];
}

export const RISK_BAND_META: Record<RiskBand, { label: string; colour: string }> = {
  HIGH: { label: 'High', colour: 'var(--csq-r1)' },
  ELEVATED: { label: 'Elevated', colour: 'var(--csq-r2)' },
  ROUTINE: { label: 'Routine', colour: 'var(--csq-r3)' },
};

const HOUR = 3600_000;

export function hoursUntil(iso: string, now: number = Date.now()): number {
  return (new Date(iso).getTime() - now) / HOUR;
}

export function flagEntries(tally: FlagTally): Array<{ code: IntegrityCode; count: number }> {
  return FLAG_ORDER.filter((code) => (tally[code] ?? 0) > 0).map((code) => ({
    code,
    count: tally[code] ?? 0,
  }));
}

export function totalFlags(tally: FlagTally): number {
  return flagEntries(tally).reduce((sum, e) => sum + e.count, 0);
}

/**
 * Ordering the queue by what a reviewer would triage by hand: conflicted
 * contacts first, then samples that cannot legally be approved, then the clock.
 * A decided batch carries no risk, whatever it once looked like.
 */
export function assessRisk(row: QueueRow, now: number = Date.now()): RiskAssessment {
  if (row.status === 'APPROVED' || row.status === 'REJECTED') {
    return { score: 0, band: 'ROUTINE', reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  for (const { code, count } of flagEntries(row.flags)) {
    const meta = FLAG_META[code];
    score += SEVERITY_WEIGHT[meta.severity] * count;
    reasons.push(`${count} ${meta.label.toLowerCase()}`);
  }

  const shortfall = row.minimumContacts - row.contactCount;
  if (shortfall > 0) {
    score += 25;
    reasons.push(`${shortfall} short of the ${row.minimumContacts} minimum`);
  }

  // only a batch someone is actually expected to review can be late
  if (row.status === 'AWAITING_REVIEW') {
    const left = hoursUntil(row.slaDueAt, now);
    if (left < 0) {
      score += 30;
      reasons.push('past its review deadline');
    } else if (left < 24) {
      score += 15;
      reasons.push('due within a day');
    }
  }

  // an operator on automatic approval was never gated, so anything odd in the
  // batch went live unseen: surface it rather than filing it as decided
  if (row.status === 'AUTO_APPROVED' && score > 0) {
    score += 10;
    reasons.push('approved automatically without review');
  }

  const band: RiskBand = score >= 30 ? 'HIGH' : score >= 12 ? 'ELEVATED' : 'ROUTINE';
  return { score, band, reasons };
}

export function formatSla(iso: string, now: number = Date.now()): { text: string; colour: string; overdue: boolean } {
  const left = hoursUntil(iso, now);
  const overdue = left < 0;
  const abs = Math.abs(left);
  const days = Math.floor(abs / 24);
  const hours = Math.floor(abs % 24);
  const span = days > 0 ? `${days}d ${hours}h` : `${Math.max(1, Math.round(abs))}h`;
  return {
    text: overdue ? `${span} overdue` : `${span} left`,
    colour: overdue ? 'var(--csq-r1)' : left < 24 ? 'var(--csq-r2)' : 'var(--csq-muted)',
    overdue,
  };
}

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME_FMT.format(new Date(iso));
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = (now - new Date(iso).getTime()) / HOUR;
  if (diff < 1) return 'just now';
  if (diff < 24) return `${Math.round(diff)}h ago`;
  const days = Math.round(diff / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}
