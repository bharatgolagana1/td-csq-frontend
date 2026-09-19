import type { AssessorKind, ScoreBand, SubmissionRow } from '../api/history.types';
import { SCORE_BANDS, bandOf } from './scoring';

export type KindFilter = 'ALL' | AssessorKind;
export type BandFilter = 'ALL' | ScoreBand | 'UNSCORED';
export type SortKey = 'submittedAt' | 'score' | 'respondent';
export type SortDir = 'asc' | 'desc';

export const KIND_OPTIONS: Array<{ value: KindFilter; label: string }> = [
  { value: 'ALL', label: 'All assessors' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'SELF', label: 'Self' },
  { value: 'EXTERNAL', label: 'External' },
];

export const BAND_OPTIONS: Array<{ value: BandFilter; label: string }> = [
  { value: 'ALL', label: 'Any score' },
  ...SCORE_BANDS.map((b) => ({
    value: b.key as BandFilter,
    label: b.key === 'R1' ? `${b.label} (under 1.5)` : `${b.label} (${b.min.toFixed(1)} and above)`,
  })),
  { value: 'UNSCORED', label: 'Not scored yet' },
];

export function matchesKind(row: SubmissionRow, kind: KindFilter): boolean {
  return kind === 'ALL' || row.assessorKind === kind;
}

export function matchesBand(row: SubmissionRow, band: BandFilter): boolean {
  if (band === 'ALL') return true;
  if (band === 'UNSCORED') return row.score === null;
  return bandOf(row.score) === band;
}

/**
 * Responses that are still open sort to the foot whichever way the column runs.
 * They have no date and no score, and letting them head an ascending sort would
 * push the material the operator came to read below the fold.
 */
export function sortRows(rows: SubmissionRow[], key: SortKey, dir: SortDir): SubmissionRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'IN_PROGRESS' ? 1 : -1;
    if (key === 'respondent') return sign * a.respondent.reference.localeCompare(b.respondent.reference);
    if (key === 'score') {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return sign * (a.score - b.score);
    }
    if (a.submittedAt === null && b.submittedAt === null) return 0;
    if (a.submittedAt === null) return 1;
    if (b.submittedAt === null) return -1;
    return sign * a.submittedAt.localeCompare(b.submittedAt);
  });
}
