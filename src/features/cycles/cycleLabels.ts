import { type CycleStatus, type CycleType, type CycleWindow, type DeadlineKind, type ManualTarget, type SamplingStatus, type SurveyType } from '@/api/cycles.types';
import { type PillVariant } from '@/design/primitives';
import { describeTimeZone, formatDate, formatDateTime } from '@/lib/format';

/* Labels and the status machine the cycles pages share (mirrors backend cycles/domain/transitions.ts). */

export const CYCLE_TYPE_LABELS: Record<CycleType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International', BOTH: 'Both' };

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  SAMPLING_OPEN: 'Sampling open',
  SAMPLING_CLOSED: 'Sampling closed',
  ASSESSMENT_OPEN: 'Assessment open',
  ASSESSMENT_CLOSED: 'Assessment closed',
  SCORED: 'Scored',
  ARCHIVED: 'Archived',
};

export const SAMPLING_STATUS_LABELS: Record<SamplingStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  LOCKED: 'Locked',
  UNLOCKED: 'Unlocked',
};

export const DEADLINE_LABELS: Record<DeadlineKind, string> = {
  SAMPLING_OPENS: 'Sampling opens',
  SAMPLING_CLOSES: 'Sampling closes',
  ASSESSMENT_OPENS: 'Assessment opens',
  ASSESSMENT_CLOSES: 'Assessment closes',
};

export const TYPE_PILL: Record<CycleType, PillVariant> = { DOMESTIC: 'info', INTERNATIONAL: 'neutral', BOTH: 'success' };

/** Manual transitions an operator with cycles.operate may take from each status (TRANSITION_TABLE, via MANUAL). */
export const MANUAL_TRANSITIONS: Partial<Record<CycleStatus, ManualTarget[]>> = {
  PUBLISHED: ['SAMPLING_OPEN'],
  SAMPLING_OPEN: ['SAMPLING_CLOSED'],
  SAMPLING_CLOSED: ['SAMPLING_OPEN', 'ASSESSMENT_OPEN'],
  ASSESSMENT_OPEN: ['ASSESSMENT_CLOSED'],
  ASSESSMENT_CLOSED: ['ASSESSMENT_OPEN', 'SCORED'],
  SCORED: ['ARCHIVED'],
};

export function allowedTransitions(status: CycleStatus): ManualTarget[] {
  return MANUAL_TRANSITIONS[status] ?? [];
}

/** What a manual move means, for the transition dialog. */
export const TRANSITION_HINTS: Record<ManualTarget, string> = {
  SAMPLING_OPEN: 'Operators can select and lock their samples. Re-opening after a close needs an extended sampling end.',
  SAMPLING_CLOSED: 'Selection stops; operators still unlocked are listed for ACFI.',
  ASSESSMENT_OPEN: 'Every pending invitation of a locked participant gets its link and e-mail. Re-opening needs an extended assessment end.',
  ASSESSMENT_CLOSED: 'Participant links stop working; scoring can run.',
  SCORED: 'Marks the scoring run as complete.',
  ARCHIVED: 'Housekeeping; the cycle leaves the active lists for good.',
};

export const SAMPLING_PHASE: readonly CycleStatus[] = ['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED'];
export const ASSESSMENT_PHASE: readonly CycleStatus[] = ['ASSESSMENT_OPEN', 'ASSESSMENT_CLOSED'];
export const ACTIVE_STATUSES: readonly CycleStatus[] = ['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN', 'ASSESSMENT_CLOSED'];

export function isActiveStatus(status: CycleStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export type CyclePhase = 'draft' | 'sampling' | 'assessment' | 'done';

export function phaseOf(status: CycleStatus): CyclePhase {
  if (status === 'DRAFT') return 'draft';
  if (SAMPLING_PHASE.includes(status)) return 'sampling';
  if (ASSESSMENT_PHASE.includes(status)) return 'assessment';
  return 'done';
}

/** The window instant the clock acts on next, from the cycle's own status (no participant needed). */
export function nextCycleDeadline(cycle: { status: CycleStatus; sampling: CycleWindow; assessment: CycleWindow }): { kind: DeadlineKind; at: string } | null {
  switch (cycle.status) {
    case 'PUBLISHED':
      return { kind: 'SAMPLING_OPENS', at: cycle.sampling.start.utc };
    case 'SAMPLING_OPEN':
      return { kind: 'SAMPLING_CLOSES', at: cycle.sampling.end.utc };
    case 'SAMPLING_CLOSED':
      return { kind: 'ASSESSMENT_OPENS', at: cycle.assessment.start.utc };
    case 'ASSESSMENT_OPEN':
      return { kind: 'ASSESSMENT_CLOSES', at: cycle.assessment.end.utc };
    default:
      return null;
  }
}

/** The survey types a cycle of this type runs. */
export function cycleSurveyTypes(type: CycleType): SurveyType[] {
  return type === 'BOTH' ? ['DOMESTIC', 'INTERNATIONAL'] : [type];
}

/** The cycle's types restricted to what the operator actually runs (empty = not eligible). */
export function participantSurveyTypes(type: CycleType, operations: { domestic: boolean; international: boolean }): SurveyType[] {
  return cycleSurveyTypes(type).filter((t) => (t === 'DOMESTIC' ? operations.domestic : operations.international));
}

/** "1 Nov – 11 Nov 2026" in the cycle's zone. */
export function formatWindow(window: CycleWindow, tz: string): string {
  return `${formatDate(window.start.utc, tz)} – ${formatDate(window.end.utc, tz)}`;
}

/** "1 Nov 2026, 00:00 → 11 Nov 2026, 00:00 · IST (UTC+05:30)". */
export function formatWindowLong(window: CycleWindow, tz: string): string {
  return `${formatDateTime(window.start.utc, tz)} → ${formatDateTime(window.end.utc, tz)} · ${describeTimeZone(tz)}`;
}

/** Percentage 0..100 of `part` over `whole`; 0 when the whole is 0. */
export function pct(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}
