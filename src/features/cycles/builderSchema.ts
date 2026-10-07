import { type FieldValues, type Path, type UseFormSetError } from 'react-hook-form';
import { z } from 'zod';

import { isApiError } from '@/api/client';
import { type CreateCycleInput, type CycleDetail, type PatchCycleInput } from '@/api/cycles.types';
import { type Settings } from '@/api/types';
import { DEFAULT_TZ } from '@/lib/format';

import { isCalendarDate, serverWindowField, validateWindows, WALL_RE } from './derive';

/* The cycle builder's form model: one react-hook-form across the five steps,
   validated per step with `STEP_FIELDS` and whole on Save/Publish. Windows are
   always sent explicitly; "Derive windows" fills them from the initiation date
   with the same `settings.defaults` the server would use. */

export const BUILDER_STEPS = [
  { id: 'basics', label: 'Basics', description: 'Name, code, type' },
  { id: 'windows', label: 'Windows', description: 'Sampling and assessment' },
  { id: 'sampling', label: 'Sampling & reminders', description: 'Minimum sample, cadence' },
  { id: 'participants', label: 'Participants', description: 'Airports and operators' },
  { id: 'review', label: 'Review', description: 'Save or publish' },
] as const;

export type BuilderStepId = (typeof BUILDER_STEPS)[number]['id'];

export const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

const wall = z.string().regex(WALL_RE, 'Enter a date and a time');
const count = z.number({ error: 'Enter a number' }).int('Enter a whole number');
const plan = z.object({
  count: count.min(0, 'At least 0').max(50, 'At most 50'),
  everyDays: count.min(1, 'At least every day').max(60, 'At most every 60 days'),
});

export const builderSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the cycle a name').max(200, 'At most 200 characters'),
    code: z.string().trim().toUpperCase().regex(CODE_RE, '2–30 characters: letters, digits, _ or -'),
    type: z.enum(['DOMESTIC', 'INTERNATIONAL', 'BOTH']),
    tz: z.string().trim().min(1, 'Choose a time zone'),
    /** Calendar date the windows were derived from; informational once the windows exist. */
    initiationDate: z.string().refine((v) => v === '' || isCalendarDate(v), 'Enter a real date'),
    sampling: z.object({ start: wall, end: wall }),
    assessment: z.object({ start: wall, end: wall }),
    minSampleSize: count.min(0, 'At least 0').max(100000, 'At most 100 000'),
    reminders: z.object({ sampling: plan, assessment: plan }),
    participatingAirportIds: z.array(z.string()),
    participatingAcoIds: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    for (const p of validateWindows(v)) ctx.addIssue({ code: 'custom', path: p.path.split('.'), message: p.message });
  });

export type BuilderValues = z.infer<typeof builderSchema>;

export const BUILDER_FIELDS = [
  'name',
  'code',
  'type',
  'tz',
  'initiationDate',
  'sampling.start',
  'sampling.end',
  'assessment.start',
  'assessment.end',
  'minSampleSize',
  'reminders.sampling.count',
  'reminders.sampling.everyDays',
  'reminders.assessment.count',
  'reminders.assessment.everyDays',
  'participatingAirportIds',
  'participatingAcoIds',
] as const;

export type BuilderField = (typeof BUILDER_FIELDS)[number];

export const STEP_FIELDS: Record<Exclude<BuilderStepId, 'review'>, BuilderField[]> = {
  basics: ['name', 'code', 'type', 'tz'],
  windows: ['initiationDate', 'sampling.start', 'sampling.end', 'assessment.start', 'assessment.end'],
  sampling: ['minSampleSize', 'reminders.sampling.count', 'reminders.sampling.everyDays', 'reminders.assessment.count', 'reminders.assessment.everyDays'],
  participants: ['participatingAirportIds', 'participatingAcoIds'],
};

export function stepOfField(field: BuilderField): BuilderStepId {
  for (const [step, fields] of Object.entries(STEP_FIELDS) as [BuilderStepId, BuilderField[]][]) {
    if (fields.includes(field)) return step;
  }
  return 'review';
}

export function stepIndex(step: BuilderStepId): number {
  return BUILDER_STEPS.findIndex((s) => s.id === step);
}

export function defaultBuilderValues(settings?: Settings | undefined): BuilderValues {
  const d = settings?.defaults;
  return {
    name: '',
    code: '',
    type: 'BOTH',
    tz: d?.tz ?? DEFAULT_TZ,
    initiationDate: '',
    sampling: { start: '', end: '' },
    assessment: { start: '', end: '' },
    minSampleSize: 50,
    reminders: {
      sampling: { count: d?.reminders.sampling.count ?? 3, everyDays: d?.reminders.sampling.everyDays ?? 3 },
      assessment: { count: d?.reminders.assessment.count ?? 10, everyDays: d?.reminders.assessment.everyDays ?? 2 },
    },
    participatingAirportIds: [],
    participatingAcoIds: [],
  };
}

/** Form values for editing a draft. */
export function valuesFromCycle(cycle: CycleDetail): BuilderValues {
  return {
    name: cycle.name,
    code: cycle.code,
    type: cycle.type,
    tz: cycle.tz,
    initiationDate: cycle.sampling.start.wall.slice(0, 10),
    sampling: { start: cycle.sampling.start.wall, end: cycle.sampling.end.wall },
    assessment: { start: cycle.assessment.start.wall, end: cycle.assessment.end.wall },
    minSampleSize: cycle.minSampleSize,
    reminders: { sampling: { ...cycle.reminders.sampling }, assessment: { ...cycle.reminders.assessment } },
    participatingAirportIds: [...cycle.participatingAirportIds],
    participatingAcoIds: [...cycle.participatingAcoIds],
  };
}

export function toCreateInput(v: BuilderValues): CreateCycleInput {
  return {
    name: v.name,
    code: v.code,
    type: v.type,
    tz: v.tz,
    sampling: { ...v.sampling },
    assessment: { ...v.assessment },
    minSampleSize: v.minSampleSize,
    reminders: { sampling: { ...v.reminders.sampling }, assessment: { ...v.reminders.assessment } },
    participatingAirportIds: v.participatingAirportIds,
    participatingAcoIds: v.participatingAcoIds,
  };
}

export function toPatchInput(v: BuilderValues): PatchCycleInput {
  return toCreateInput(v);
}

type Issue = { path?: (string | number)[] | string; field?: string; message?: string };

function issuesOf(details: unknown): Issue[] {
  if (!details) return [];
  if (Array.isArray(details)) return details as Issue[];
  if (typeof details === 'object') {
    const d = details as { issues?: Issue[]; errors?: Issue[]; path?: string; message?: string };
    if (Array.isArray(d.issues)) return d.issues;
    if (Array.isArray(d.errors)) return d.errors;
    if (typeof d.path === 'string') return [{ path: d.path, message: d.message }];
  }
  return [];
}

/** `participatingAcoIds.3` → `participatingAcoIds`; `body.sampling` → `sampling.end`; others as-is. */
export function builderFieldOf(path: string): BuilderField | null {
  const name = path.replace(/^body\./, '');
  const window = serverWindowField(name);
  if (window) return window;
  const root = name.replace(/\.\d+$/, '');
  return (BUILDER_FIELDS as readonly string[]).includes(root) ? (root as BuilderField) : null;
}

/**
 * Maps a VALIDATION error onto the form; returns the first step that now has
 * an error so the builder can jump there, or null when nothing applied.
 */
export function applyBuilderServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fallbackMessage?: string): BuilderStepId | null {
  if (!isApiError(error, 'VALIDATION')) return null;
  const steps: BuilderStepId[] = [];
  issuesOf(error.details).forEach((issue) => {
    const raw = issue.field ?? (Array.isArray(issue.path) ? issue.path.join('.') : issue.path);
    if (!raw) return;
    const field = builderFieldOf(raw);
    if (!field) return;
    setError(field as Path<T>, { type: 'server', message: issue.message ?? fallbackMessage ?? error.message });
    steps.push(stepOfField(field));
  });
  if (steps.length === 0) return null;
  return steps.sort((a, b) => stepIndex(a) - stepIndex(b))[0] ?? null;
}
