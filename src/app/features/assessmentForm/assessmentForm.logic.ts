import type {
  DirectionCode,
  DraftAnswers,
  FollowUp,
  Instrument,
  MissingItem,
  Parameter,
  Progress,
  RatingValue,
} from './api/assessmentForm.types';

/** Ascending, worst on the left: the reading direction people expect from a scale. */
export const RATING_STEPS: ReadonlyArray<{ value: RatingValue; label: string }> = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Very Good' },
  { value: 5, label: 'Excellent' },
];

export const NA_STEP: { value: RatingValue; label: string } = {
  value: 'NA',
  label: 'Not applicable',
};

export const DIRECTION_LABEL: Record<DirectionCode, string> = {
  EXPORT: 'Export',
  IMPORT: 'Import',
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
};

const RATING_COLOR: Record<string, string> = {
  '5': 'var(--csq-r5)',
  '4': 'var(--csq-r4)',
  '3': 'var(--csq-r3)',
  '2': 'var(--csq-r2)',
  '1': 'var(--csq-r1)',
  NA: 'var(--csq-na)',
};

export function ratingColor(value: RatingValue): string {
  return RATING_COLOR[String(value)] ?? 'var(--csq-na)';
}

export function ratingLabel(value: RatingValue): string {
  if (value === 'NA') return NA_STEP.label;
  return RATING_STEPS.find((s) => s.value === value)?.label ?? String(value);
}

/** Fair and Poor are the two ratings that open a follow-up. */
export function isLowRating(value: RatingValue | undefined): boolean {
  return value === 1 || value === 2;
}

export function answerKey(parameterId: string, direction: DirectionCode): string {
  return `${parameterId}|${direction}`;
}

export function emptyDraft(): DraftAnswers {
  return { ratings: {}, followUps: {}, comments: {}, savedAt: null };
}

export function emptyFollowUp(): FollowUp {
  return { reasons: [], note: '' };
}

/**
 * Progress is counted over directions, not questions. A question with EXPORT
 * answered and IMPORT blank is half done, and saying otherwise is how an
 * assessor reaches the end believing they have finished.
 */
export function progressOf(
  parameters: Parameter[],
  directions: DirectionCode[],
  draft: DraftAnswers,
): Progress {
  let answered = 0;
  for (const p of parameters) {
    for (const d of directions) {
      if (draft.ratings[answerKey(p.id, d)] !== undefined) answered += 1;
    }
  }
  return { answered, total: parameters.length * directions.length };
}

/** Keyed by head code rather than typed exhaustively, so a new head cannot crash the tabs. */
export function progressByHead(
  instrument: Instrument,
  directions: DirectionCode[],
  draft: DraftAnswers,
): Record<string, Progress> {
  const out: Record<string, Progress> = {};
  for (const head of instrument.heads) {
    const params = instrument.parameters.filter((p) => p.head === head.code);
    out[head.code] = progressOf(params, directions, draft);
  }
  return out;
}

export function missingItems(
  instrument: Instrument,
  directions: DirectionCode[],
  draft: DraftAnswers,
): MissingItem[] {
  const out: MissingItem[] = [];
  instrument.parameters.forEach((p, i) => {
    for (const d of directions) {
      if (draft.ratings[answerKey(p.id, d)] === undefined) {
        out.push({
          parameterId: p.id,
          parameterNumber: i + 1,
          shortLabel: p.shortLabel,
          head: p.head,
          direction: d,
        });
      }
    }
  });
  return out;
}

/**
 * Low ratings carrying no reason and no note. Surfaced as a nudge at review,
 * never as a block: forcing free text on a phone is how a submission is abandoned.
 */
export function lowRatingsWithoutReason(
  instrument: Instrument,
  directions: DirectionCode[],
  draft: DraftAnswers,
): number {
  let n = 0;
  for (const p of instrument.parameters) {
    for (const d of directions) {
      const key = answerKey(p.id, d);
      if (!isLowRating(draft.ratings[key])) continue;
      const f = draft.followUps[key];
      if (!f || (f.reasons.length === 0 && f.note.trim() === '')) n += 1;
    }
  }
  return n;
}

export function countLowRatings(
  instrument: Instrument,
  directions: DirectionCode[],
  draft: DraftAnswers,
): number {
  let n = 0;
  for (const p of instrument.parameters) {
    for (const d of directions) {
      if (isLowRating(draft.ratings[answerKey(p.id, d)])) n += 1;
    }
  }
  return n;
}

const RATING_VALUES: readonly RatingValue[] = [1, 2, 3, 4, 5, 'NA'];

function toRating(value: unknown): RatingValue | null {
  return RATING_VALUES.find((r) => r === value) ?? null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return {};
  return value as Record<string, unknown>;
}

/**
 * A draft recovered from device storage is untrusted: it may have been written
 * by an older build of this form. Anything unrecognised is dropped rather than
 * allowed to reach the scoring payload.
 */
export function coerceDraft(raw: unknown): DraftAnswers | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = asRecord(raw);

  const ratings: Record<string, RatingValue> = {};
  for (const [k, v] of Object.entries(asRecord(o.ratings))) {
    const r = toRating(v);
    if (r !== null) ratings[k] = r;
  }

  const followUps: Record<string, FollowUp> = {};
  for (const [k, v] of Object.entries(asRecord(o.followUps))) {
    const f = asRecord(v);
    followUps[k] = {
      reasons: toStringArray(f.reasons),
      note: typeof f.note === 'string' ? f.note : '',
    };
  }

  const comments: Record<string, string> = {};
  for (const [k, v] of Object.entries(asRecord(o.comments))) {
    if (typeof v === 'string') comments[k] = v;
  }

  return { ratings, followUps, comments, savedAt: typeof o.savedAt === 'string' ? o.savedAt : null };
}

export function formatClock(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const date = formatDate(iso);
  const time = formatClock(iso);
  return date && time ? `${date} at ${time}` : date;
}
