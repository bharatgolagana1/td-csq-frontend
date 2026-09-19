import type {
  CycleDraft,
  CycleState,
  ProgrammeOption,
  TerminalClass,
} from '../api/cycleBuilder.types';
import {
  MS,
  durationText,
  formatWallDateTime,
  isComplete,
  toInstant,
} from './zonedTime';

/* ------------------------------------------------------------------ policy */

export type CloseEditRule = 'FREE' | 'EXTEND_ONLY' | 'LOCKED';

export interface EditPolicy {
  identity: boolean;
  /** programme, form scope and minimum sampling size move together */
  scope: boolean;
  samplingWindow: boolean;
  assessmentOpens: boolean;
  assessmentCloses: CloseEditRule;
  reminders: boolean;
  canSchedule: boolean;
  headline: string;
  detail: string;
}

/**
 * What a cycle in each state still allows. Everything that shapes a score is
 * frozen the moment invitations are queued: changing the form or the sample
 * midway would leave two halves of one cycle that cannot be compared. The
 * assessment close is the deliberate exception, because the only lever
 * operations has when responses come in slowly is more time, and it can be
 * extended without invalidating a single answer already given.
 */
export function editPolicyFor(state: CycleState): EditPolicy {
  switch (state) {
    case 'DRAFT':
      return {
        identity: true,
        scope: true,
        samplingWindow: true,
        assessmentOpens: true,
        assessmentCloses: 'FREE',
        reminders: true,
        canSchedule: true,
        headline: 'Draft',
        detail: 'Nothing has been sent and nothing is fixed. Every field stays editable until you schedule this cycle.',
      };
    case 'SCHEDULED':
      return {
        identity: false,
        scope: false,
        samplingWindow: false,
        assessmentOpens: false,
        assessmentCloses: 'EXTEND_ONLY',
        reminders: true,
        canSchedule: false,
        headline: 'Scheduled',
        detail: 'Invitations are queued against these dates. The name, the programme, the form, the sample size, the sampling window and the assessment opening are fixed. You can still extend the assessment close and change reminders that have not gone out.',
      };
    case 'RUNNING':
      return {
        identity: false,
        scope: false,
        samplingWindow: false,
        assessmentOpens: false,
        assessmentCloses: 'EXTEND_ONLY',
        reminders: true,
        canSchedule: false,
        headline: 'Running',
        detail: 'Assessors are answering right now. Changing the form or the sample at this point would leave two halves of one cycle that cannot be compared. You can extend the assessment close and add reminders that have not gone out.',
      };
    case 'CLOSED':
      return {
        identity: false,
        scope: false,
        samplingWindow: false,
        assessmentOpens: false,
        assessmentCloses: 'LOCKED',
        reminders: false,
        canSchedule: false,
        headline: 'Closed',
        detail: 'The assessment window has passed and scoring is complete. This cycle is a record now and is read only.',
      };
    default:
      return editPolicyFor('CLOSED');
  }
}

/* -------------------------------------------------------------- directions */

/** One question, two ratings. The pair depends on what the terminal handles. */
export function directionLabel(terminalClass: TerminalClass): string {
  switch (terminalClass) {
    case 'INTERNATIONAL': return 'Export and Import';
    case 'DOMESTIC': return 'Inbound and Outbound';
    case 'BOTH': return 'Export and Import at international terminals, Inbound and Outbound at domestic ones';
    default: return '';
  }
}

/* -------------------------------------------------------------- validation */

export type IssueSeverity = 'ERROR' | 'WARNING' | 'INFO';

export type CoreField =
  | 'name'
  | 'programmeId'
  | 'formScopeId'
  | 'minSamplingSize'
  | 'timeZone'
  | 'samplingOpens'
  | 'samplingCloses'
  | 'assessmentOpens'
  | 'assessmentCloses'
  | 'reminders';

export type IssueField = CoreField | `reminder:${string}`;

export interface Issue {
  id: string;
  severity: IssueSeverity;
  field: IssueField;
  message: string;
}

export interface ValidationInput {
  draft: CycleDraft;
  /** the cycle as it was loaded, for extend only comparisons */
  baseline: CycleDraft;
  programme: ProgrammeOption | undefined;
  nowMs: number;
}

const MIN_COMFORTABLE_ASSESSMENT = 7 * MS.DAY;
const MIN_COMFORTABLE_SAMPLING = 5 * MS.DAY;

export function validateCycle({ draft, baseline, programme, nowMs }: ValidationInput): Issue[] {
  const issues: Issue[] = [];
  const policy = editPolicyFor(draft.state);
  const add = (severity: IssueSeverity, field: IssueField, message: string) => {
    issues.push({ id: `${field}:${issues.length}`, severity, field, message });
  };

  if (!draft.name.trim()) {
    add('ERROR', 'name', 'Give the cycle a name. Assessors see it in the invitation, so "FY 2026-27 H2" reads better than "Cycle 4".');
  }
  if (!draft.programmeId) add('ERROR', 'programmeId', 'Choose the programme this cycle belongs to.');
  if (!draft.formScopeId) add('ERROR', 'formScopeId', 'Choose the form this cycle runs.');

  if (draft.minSamplingSize === null || draft.minSamplingSize < 1) {
    add('ERROR', 'minSamplingSize', 'Set how many customers each terminal has to nominate.');
  } else if (programme && draft.minSamplingSize < programme.minSamplingSize) {
    add('ERROR', 'minSamplingSize', `${programme.label} requires at least ${programme.minSamplingSize} customers per terminal. A cycle can ask for more than the programme floor, never for less.`);
  }

  const boundaries = [
    { field: 'samplingOpens' as const, value: draft.samplingOpens, label: 'Sampling opens' },
    { field: 'samplingCloses' as const, value: draft.samplingCloses, label: 'Sampling closes' },
    { field: 'assessmentOpens' as const, value: draft.assessmentOpens, label: 'Assessment opens' },
    { field: 'assessmentCloses' as const, value: draft.assessmentCloses, label: 'Assessment closes' },
  ];
  for (const b of boundaries) {
    if (!isComplete(b.value)) {
      add('ERROR', b.field, 'Set both a date and a time. A window with no time on it is a window that opens at whatever midnight the server thinks it is.');
    }
  }

  const sOpen = toInstant(draft.samplingOpens);
  const sClose = toInstant(draft.samplingCloses);
  const aOpen = toInstant(draft.assessmentOpens);
  const aClose = toInstant(draft.assessmentCloses);

  if (sOpen !== null && sClose !== null && sClose <= sOpen) {
    add('ERROR', 'samplingCloses', `Sampling closes before it opens. Pick a moment after ${formatWallDateTime(draft.samplingOpens, false)}.`);
  }
  if (aOpen !== null && aClose !== null && aClose <= aOpen) {
    add('ERROR', 'assessmentCloses', `Assessment closes before it opens. Pick a moment after ${formatWallDateTime(draft.assessmentOpens, false)}.`);
  }
  if (sOpen !== null && aOpen !== null && aOpen < sOpen) {
    add('ERROR', 'assessmentOpens', 'Assessment opens before sampling does. No customer has been nominated at that point, so there would be nobody to send an assessment to.');
  }

  // the past is only a mistake while the cycle can still be scheduled
  if (draft.state === 'DRAFT') {
    if (sOpen !== null && sOpen < nowMs) {
      add('ERROR', 'samplingOpens', 'Sampling opens in the past. Operators cannot be asked to nominate customers before now.');
    }
    if (aOpen !== null && aOpen < nowMs) {
      add('ERROR', 'assessmentOpens', 'Assessment opens in the past. Invitations cannot be sent backwards.');
    }
  }

  if (policy.assessmentCloses === 'EXTEND_ONLY') {
    const wasClose = toInstant(baseline.assessmentCloses);
    if (aClose !== null && wasClose !== null && aClose < wasClose) {
      add('ERROR', 'assessmentCloses', `You can extend the assessment window, not shorten it. Assessors are holding a link that says it closes ${formatWallDateTime(baseline.assessmentCloses, false)}.`);
    }
  }

  if (sOpen !== null && sClose !== null && sClose > sOpen && sClose - sOpen < MIN_COMFORTABLE_SAMPLING) {
    add('WARNING', 'samplingCloses', `Sampling is open for ${durationText(sOpen, sClose)}. Operators need time to pull a real customer list together, and a thin sample weakens the score it produces.`);
  }
  if (aOpen !== null && aClose !== null && aClose > aOpen && aClose - aOpen < MIN_COMFORTABLE_ASSESSMENT) {
    add('WARNING', 'assessmentCloses', `The assessment window is ${durationText(aOpen, aClose)}. Every assessor answers 23 parameters twice, on a phone, from a link in a message. A window this short costs responses.`);
  }

  // the legal overlap, stated so nobody reads it as a mistake
  if (aOpen !== null && sClose !== null && sClose > aOpen) {
    add('INFO', 'samplingCloses', `Sampling is still open for ${durationText(aOpen, sClose)} after assessment begins. Customers nominated in that time can still be sampled and still get a link. This is intended and is not an error.`);
  }

  /* reminders */
  const editableReminders = draft.reminders.filter((r) => !r.alreadySent);
  if (policy.reminders && editableReminders.length === 0 && draft.state !== 'CLOSED') {
    add('WARNING', 'reminders', 'No reminders are scheduled. Response rates on a form of this length depend on them more than on the invitation.');
  }

  const seen = new Set<number>();
  for (const reminder of draft.reminders) {
    if (reminder.alreadySent) continue;
    const whenField: IssueField = `reminder:${reminder.id}:at`;
    const whoField: IssueField = `reminder:${reminder.id}:audiences`;

    if (reminder.audiences.length === 0) {
      add('ERROR', whoField, 'Choose who this reminder goes to.');
    }

    if (!isComplete(reminder.at)) {
      add('ERROR', whenField, 'Set both a date and a time for this reminder.');
      continue;
    }

    const at = toInstant(reminder.at);
    if (at === null) {
      add('ERROR', whenField, 'That is not a real date.');
      continue;
    }
    if (aOpen !== null && at < aOpen) {
      add('ERROR', whenField, `This lands ${durationText(at, aOpen)} before assessment opens, when nobody holds a link yet. Move it inside the assessment window.`);
    } else if (aClose !== null && at > aClose) {
      add('ERROR', whenField, `This lands ${durationText(aClose, at)} after assessment closes, when nothing can be submitted. Move it inside the assessment window.`);
    }
    if (at < nowMs) {
      add('ERROR', whenField, 'That moment has already passed, so this reminder would never be sent.');
    }

    if (seen.has(at)) {
      add('WARNING', whenField, 'Another reminder is set for exactly this moment. Assessors get two messages at once.');
    } else {
      seen.add(at);
    }
  }

  return issues;
}

export function issuesFor(issues: Issue[], field: IssueField): Issue[] {
  return issues.filter((i) => i.field === field);
}

export function errorsIn(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.severity === 'ERROR');
}

/* ---------------------------------------------------------------- timeline */

export interface TimelineBar {
  fromMs: number;
  toMs: number;
  leftPct: number;
  widthPct: number;
}

export interface TimelinePin {
  id: string;
  atMs: number;
  leftPct: number;
  label: string;
  valid: boolean;
}

export interface TimelineModel {
  startMs: number;
  endMs: number;
  sampling: TimelineBar | null;
  assessment: TimelineBar | null;
  overlap: TimelineBar | null;
  ticks: Array<{ atMs: number; leftPct: number }>;
  pins: TimelinePin[];
  nowPct: number | null;
}

const TICK_COUNT = 5;

/** null when there is not yet enough of a cycle to draw. */
export function buildTimeline(draft: CycleDraft, nowMs: number): TimelineModel | null {
  const sOpen = toInstant(draft.samplingOpens);
  const sClose = toInstant(draft.samplingCloses);
  const aOpen = toInstant(draft.assessmentOpens);
  const aClose = toInstant(draft.assessmentCloses);

  const known = [sOpen, sClose, aOpen, aClose].filter((v): v is number => v !== null);
  if (known.length < 2) return null;

  const first = Math.min(...known);
  const last = Math.max(...known);
  if (last === first) return null;

  const pad = (last - first) * 0.05;
  const startMs = first - pad;
  const endMs = last + pad;
  const span = endMs - startMs;
  const pct = (ms: number) => ((ms - startMs) / span) * 100;

  const bar = (from: number | null, to: number | null): TimelineBar | null => {
    if (from === null || to === null || to <= from) return null;
    return { fromMs: from, toMs: to, leftPct: pct(from), widthPct: pct(to) - pct(from) };
  };

  const sampling = bar(sOpen, sClose);
  const assessment = bar(aOpen, aClose);

  let overlap: TimelineBar | null = null;
  if (sampling && assessment) {
    const from = Math.max(sampling.fromMs, assessment.fromMs);
    const to = Math.min(sampling.toMs, assessment.toMs);
    overlap = bar(from, to);
  }

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const atMs = startMs + (span * i) / (TICK_COUNT - 1);
    return { atMs, leftPct: (i / (TICK_COUNT - 1)) * 100 };
  });

  const pins: TimelinePin[] = [];
  draft.reminders.forEach((reminder, index) => {
    const at = toInstant(reminder.at);
    if (at === null) return;
    const inWindow = aOpen !== null && aClose !== null && at >= aOpen && at <= aClose;
    pins.push({
      id: reminder.id,
      atMs: at,
      leftPct: pct(at),
      label: `Reminder ${index + 1}`,
      valid: inWindow,
    });
  });

  const nowPct = nowMs >= startMs && nowMs <= endMs ? pct(nowMs) : null;

  return { startMs, endMs, sampling, assessment, overlap, ticks, pins, nowPct };
}
