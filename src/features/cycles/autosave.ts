import { formatInTimeZone } from 'date-fns-tz';

import { type CreateCycleInput, type CycleDetail, type PatchCycleInput } from '@/api/cycles.types';

import { type BuilderField, builderFields, type BuilderValues } from './builderSchema';
import { isCalendarDate, validateWindows } from './derive';

/* What the builder's autosave sends (pure; `useDraftAutosave` applies it).
   The form is split into parts that save independently: a part goes to the
   server only when it is valid on its own, so a half-typed window never
   blocks saving the name. The server's copy is remembered per part as JSON,
   which tells what changed since the last save and what is still unsaved. */

export const AUTOSAVE_PARTS = ['name', 'code', 'type', 'answerMode', 'tz', 'windows', 'minSampleSize', 'reminders', 'participants'] as const;
export type AutosavePart = (typeof AUTOSAVE_PARTS)[number];

/** The parts a draft cannot be created without (the Basics step). */
export const BASICS_PARTS: readonly AutosavePart[] = ['name', 'code', 'type', 'answerMode', 'tz'];

type Field = keyof typeof builderFields.shape;

const PART_FIELDS: Record<AutosavePart, readonly Field[]> = {
  name: ['name'],
  code: ['code'],
  type: ['type'],
  answerMode: ['answerMode'],
  tz: ['tz'],
  windows: ['sampling', 'assessment'],
  minSampleSize: ['minSampleSize'],
  reminders: ['reminders'],
  participants: ['participatingAirportIds', 'participatingAcoIds'],
};

/** The form fields a part covers, as react-hook-form names them (to highlight what blocks a save). */
export const PART_FORM_FIELDS: Record<AutosavePart, readonly BuilderField[]> = {
  name: ['name'],
  code: ['code'],
  type: ['type'],
  answerMode: ['answerMode'],
  tz: ['tz'],
  windows: ['sampling.start', 'sampling.end', 'assessment.start', 'assessment.end'],
  minSampleSize: ['minSampleSize'],
  reminders: ['reminders.sampling.count', 'reminders.sampling.everyDays', 'reminders.assessment.count', 'reminders.assessment.everyDays'],
  participants: ['participatingAirportIds', 'participatingAcoIds'],
};

/** Part → JSON of the value the server holds. */
export type SavedParts = Partial<Record<AutosavePart, string>>;

function normalise(field: Field, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return field === 'code' ? value.trim().toUpperCase() : value.trim();
}

/** A part as comparable JSON (trimmed text, upper-case code), valid or not. */
export function partJson(values: BuilderValues, part: AutosavePart): string {
  return JSON.stringify(PART_FIELDS[part].map((field) => normalise(field, values[field])));
}

/** The part as the API takes it, or null while it is not valid on its own. */
export function partInput(values: BuilderValues, part: AutosavePart): PatchCycleInput | null {
  const out: Record<string, unknown> = {};
  for (const field of PART_FIELDS[part]) {
    const parsed = builderFields.shape[field].safeParse(values[field]);
    if (!parsed.success) return null;
    out[field] = parsed.data;
  }
  if (part === 'windows' && validateWindows({ sampling: values.sampling, assessment: values.assessment }).length > 0) return null;
  return out as PatchCycleInput;
}

export function snapshotOf(values: BuilderValues, parts: readonly AutosavePart[] = AUTOSAVE_PARTS): SavedParts {
  return Object.fromEntries(parts.map((part) => [part, partJson(values, part)])) as SavedParts;
}

/** Windows never entered (all four empty) are not an unsaved change: there is nothing to lose. */
function windowsUntouched(values: BuilderValues): boolean {
  return [values.sampling.start, values.sampling.end, values.assessment.start, values.assessment.end].every((v) => v === '');
}

/** Parts whose local value differs from the server's copy. */
export function unsavedParts(values: BuilderValues, saved: SavedParts): AutosavePart[] {
  return AUTOSAVE_PARTS.filter((part) => partJson(values, part) !== saved[part] && !(part === 'windows' && windowsUntouched(values)));
}

/** The PATCH for every unsaved part that is valid; null when there is nothing to send. */
export function pendingPatch(values: BuilderValues, saved: SavedParts): { patch: PatchCycleInput; parts: AutosavePart[] } | null {
  const parts = unsavedParts(values, saved).filter((part) => partInput(values, part) !== null);
  if (parts.length === 0) return null;
  return { patch: Object.assign({}, ...parts.map((part) => partInput(values, part))) as PatchCycleInput, parts };
}

/** Unsaved parts that cannot be sent as they stand (they need fixing first). */
export function blockedParts(values: BuilderValues, saved: SavedParts): AutosavePart[] {
  return unsavedParts(values, saved).filter((part) => partInput(values, part) === null);
}

/** Today's date in the cycle's zone ('YYYY-MM-DD'); UTC when the zone is not one the browser knows. */
export function todayIn(tz: string, now = new Date()): string {
  try {
    return formatInTimeZone(now, tz, 'yyyy-MM-dd');
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/**
 * The POST that creates the draft once Basics is valid; null before. Other
 * parts go as they are when valid, else as `fallback` has them (the server
 * needs a sample size, reminders and windows). Windows that are not set yet
 * are left to the server, derived from `initiationDate` (else today) with
 * the platform defaults. `sent` is what the server will hold, per part.
 */
export function createInput(values: BuilderValues, fallback: BuilderValues, now = new Date()): { input: CreateCycleInput; sent: SavedParts } | null {
  if (BASICS_PARTS.some((part) => partInput(values, part) === null)) return null;
  const sent: BuilderValues = { ...values };
  const take = (part: AutosavePart): PatchCycleInput => {
    const own = partInput(values, part);
    if (own) return own;
    PART_FIELDS[part].forEach((field) => Object.assign(sent, { [field]: fallback[field] }));
    return partInput(fallback, part) ?? {};
  };
  const windows = partInput(values, 'windows');
  const initiationDate = isCalendarDate(values.initiationDate) ? values.initiationDate : todayIn(values.tz.trim(), now);
  const input = {
    ...Object.assign({}, ...BASICS_PARTS.map((part) => partInput(values, part))),
    ...(windows ?? { initiationDate }),
    ...take('minSampleSize'),
    ...take('reminders'),
    ...take('participants'),
  } as CreateCycleInput;
  const parts = AUTOSAVE_PARTS.filter((part) => part !== 'windows' || windows !== null);
  return { input, sent: snapshotOf(sent, parts) };
}

/** The windows the server holds, as form values (for a draft whose windows it derived). */
export function windowsOf(cycle: Pick<CycleDetail, 'sampling' | 'assessment'>): Pick<BuilderValues, 'sampling' | 'assessment' | 'initiationDate'> {
  return {
    initiationDate: cycle.sampling.start.wall.slice(0, 10),
    sampling: { start: cycle.sampling.start.wall, end: cycle.sampling.end.wall },
    assessment: { start: cycle.assessment.start.wall, end: cycle.assessment.end.wall },
  };
}
