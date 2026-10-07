import { type InvitationState } from '@/api/invitations.types';
import { type CurrentCycle, type SamplingAuditEntry, type SelectionState, type StateReason, type SurveyType } from '@/api/sampling.types';
import { type PillVariant, type SelectOption } from '@/design/primitives';
import { formatInt, humanise } from '@/lib/format';

/* Labels, pill variants and small derivations for the sampling screen
   (REQUIREMENTS §13–14, §19; backend sampling/domain/lockGate.ts). */

export const SURVEY_TYPE_LABELS: Record<SurveyType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International' };

export function surveyTypeVariant(surveyType: SurveyType): PillVariant {
  return surveyType === 'INTERNATIONAL' ? 'info' : 'neutral';
}

/** The sentence under the Lock button when locking is refused. */
export function lockReasonText(state: Pick<SelectionState, 'reason' | 'required' | 'remaining' | 'eligibleCount'>): string | null {
  switch (state.reason) {
    case null:
      return null;
    case 'NOTHING_SELECTED':
      return 'Select at least one customer before locking.';
    case 'BELOW_MINIMUM':
      return `Select ${formatInt(state.remaining)} more to reach the minimum of ${formatInt(state.required)}.`;
    case 'SELECT_ALL_REQUIRED':
      return `Only ${formatInt(state.eligibleCount)} customers are eligible, fewer than the ${formatInt(state.required)} required — select all of them to lock.`;
    case 'ALREADY_LOCKED':
      return 'The sample is locked.';
    case 'SAMPLING_CLOSED':
      return 'Sampling is not open for this cycle.';
    default:
      return humanise(state.reason satisfies StateReason);
  }
}

/** Caption beside the progress bar: what is left to do. */
export function progressCaption(state: Pick<SelectionState, 'lockable' | 'reason' | 'remaining' | 'shortfallRule' | 'selectedCount'>): string {
  if (state.reason === 'ALREADY_LOCKED') return 'Locked';
  if (state.lockable) return state.shortfallRule === 'SELECT_ALL' ? 'All eligible selected' : 'Ready to lock';
  if (state.selectedCount === 0) return 'Nothing selected yet';
  return `${formatInt(state.remaining)} more to lock`;
}

/** The fixed banner wording (DEMO-PLAN sampling banner). */
export function minimumBanner(required: number): string {
  return `Minimum ${formatInt(required)} customers are required. If fewer are available, select all.`;
}

export type WindowPhase = 'before' | 'open' | 'after';

/** Where the sampling window stands on the clock for this participant. */
export function windowPhase(state: SelectionState, current: CurrentCycle | null, now = new Date()): WindowPhase {
  if (state.editable || state.cycle.status === 'SAMPLING_OPEN') return 'open';
  const start = current?.cycle.sampling.start.utc ?? state.cycle.samplingStart;
  if (state.cycle.status === 'PUBLISHED' && start && now.getTime() < new Date(start).getTime()) return 'before';
  return 'after';
}

/** Which of the operator's current cycles the page opens on. */
export function pickCurrentCycle(cycles: readonly CurrentCycle[], requestedId: string | null): CurrentCycle | null {
  if (cycles.length === 0) return null;
  const requested = requestedId ? cycles.find((c) => c.cycle.id === requestedId) : undefined;
  if (requested) return requested;
  return cycles.find((c) => c.cycle.status === 'SAMPLING_OPEN' && c.participant.sampling.status !== 'LOCKED') ?? cycles.find((c) => c.cycle.status === 'SAMPLING_OPEN') ?? cycles[0] ?? null;
}

export function cycleOptions(cycles: readonly CurrentCycle[]): SelectOption[] {
  return cycles.map((c) => ({ value: c.cycle.id, label: `${c.cycle.name} · ${c.cycle.code} · ${humanise(c.cycle.status)}` }));
}

// --- invitations ---------------------------------------------------------------

export const INVITATION_STATE_LABELS: Record<InvitationState, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  OPENED: 'Opened',
  VERIFIED: 'Verified',
  SUBMITTED: 'Submitted',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

export const INVITATION_STATE_OPTIONS: SelectOption[] = [{ value: '', label: 'All states' }, ...(Object.keys(INVITATION_STATE_LABELS) as InvitationState[]).map((s) => ({ value: s, label: INVITATION_STATE_LABELS[s] }))];

// --- audit -----------------------------------------------------------------------

export type AuditSummary = { label: string; variant: PillVariant; detail: string };

type SelectionAfter = { selectedCount?: number; required?: number; added?: unknown[]; removed?: unknown[]; rejected?: number };
type LockAfter = { selectedCount?: number; required?: number; reason?: string; unlockedBy?: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** A one-line reading of a `sample.*` audit entry. */
export function describeAudit(entry: SamplingAuditEntry): AuditSummary {
  const after = asRecord(entry.after);
  switch (entry.action) {
    case 'sample.selection.changed': {
      const a = after as SelectionAfter;
      const added = Array.isArray(a.added) ? a.added.length : 0;
      const removed = Array.isArray(a.removed) ? a.removed.length : 0;
      const parts = [added ? `+${formatInt(added)}` : null, removed ? `−${formatInt(removed)}` : null].filter(Boolean).join(' ');
      const count = typeof a.selectedCount === 'number' ? `${formatInt(a.selectedCount)} selected` : '';
      return { label: 'Selection changed', variant: 'info', detail: [parts, count].filter(Boolean).join(' · ') };
    }
    case 'sample.locked': {
      const a = after as LockAfter;
      const count = typeof a.selectedCount === 'number' ? `${formatInt(a.selectedCount)} locked` : '';
      const required = typeof a.required === 'number' ? `${formatInt(a.required)} required` : '';
      return { label: 'Locked', variant: 'success', detail: [count, required].filter(Boolean).join(' · ') };
    }
    case 'sample.unlocked': {
      const a = after as LockAfter;
      return { label: 'Unlocked', variant: 'warn', detail: a.reason ? `Reason: ${a.reason}` : '' };
    }
    default:
      return { label: humanise(entry.action.replace(/^sample\./, '').replace(/\./g, ' ')), variant: 'neutral', detail: '' };
  }
}
