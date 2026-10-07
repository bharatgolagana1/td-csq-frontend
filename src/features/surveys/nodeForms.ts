import { type UseFormSetError } from 'react-hook-form';
import { z } from 'zod';

import { isApiError } from '@/api/client';
import { type Category, type CategoryNode, type CreateQuestionInput, type PatchQuestionInput, type Question, type StakeholderType, type SubcategoryNode } from '@/api/surveys.types';

/* zod schemas for the node forms (mirroring surveys.schemas.ts) and the value
   mappers between API nodes and form values. Numbers arrive as strings from
   inputs; '' means "not set" (null on the wire). */

const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9._-]{0,79}$/, 'Use 1–80 characters: letters, digits, dot, _ or -');

const name = z.string().trim().min(1, 'Enter a name').max(200, 'At most 200 characters');

/** '' → null; otherwise a number 0–100. */
const weight = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      ctx.addIssue({ code: 'custom', message: 'Enter a percentage between 0 and 100' });
      return z.NEVER;
    }
    return n;
  });

export const categorySchema = z.object({ code, name, weightPct: weight });
export type CategoryFormValues = z.input<typeof categorySchema>;
export type CategoryFormOutput = z.output<typeof categorySchema>;
export const CATEGORY_FIELDS = ['code', 'name', 'weightPct'] as const;

export const subcategorySchema = z.object({ categoryId: z.string().min(1, 'Choose a category'), code, name });
export type SubcategoryFormValues = z.input<typeof subcategorySchema>;
export const SUBCATEGORY_FIELDS = ['categoryId', 'code', 'name'] as const;

export const MAX_FOLLOW_UP_OPTIONS = 10;

export const questionSchema = z
  .object({
    /** `cat:<id>` or `sub:<id>`: where the question sits. */
    placement: z.string().min(1, 'Choose where the question sits'),
    code,
    text: z.string().trim().min(1, 'Enter the question').max(2000, 'At most 2000 characters'),
    help: z.string().trim().max(2000, 'At most 2000 characters'),
    mandatory: z.boolean(),
    commentMode: z.enum(['OPTIONAL', 'REQUIRED', 'REQUIRED_ON_LOW', 'NONE']),
    stakeholderTypes: z.array(z.enum(['FF', 'CB'])).min(1, 'Choose at least one stakeholder type'),
    followUpEnabled: z.boolean(),
    followUpPrompt: z.string().trim().max(300, 'At most 300 characters'),
    followUpOptions: z.array(z.string().trim().max(200, 'At most 200 characters')).max(MAX_FOLLOW_UP_OPTIONS, `At most ${MAX_FOLLOW_UP_OPTIONS} options`),
    active: z.boolean(),
    weightPct: weight,
  })
  .superRefine((v, ctx) => {
    // The follow-up is all-or-nothing on the wire: { prompt, options[1..10] } or null.
    if (!v.followUpEnabled) return;
    if (v.followUpPrompt === '') ctx.addIssue({ code: 'custom', path: ['followUpPrompt'], message: 'Enter the follow-up prompt' });
    if (v.followUpOptions.filter((o) => o !== '').length === 0) ctx.addIssue({ code: 'custom', path: ['followUpOptions'], message: 'Add at least one option' });
  });
export type QuestionFormValues = z.input<typeof questionSchema>;
export type QuestionFormOutput = z.output<typeof questionSchema>;

/** Server field path → question form field (`followUp.options.2` → `followUpOptions`, parents → `placement`). */
export function questionFormField(path: string): keyof QuestionFormValues | null {
  if (path === 'categoryId' || path === 'subcategoryId') return 'placement';
  if (path === 'followUp' || path === 'followUp.prompt') return 'followUpPrompt';
  if (path.startsWith('followUp.options')) return 'followUpOptions';
  const direct: (keyof QuestionFormValues)[] = ['code', 'text', 'help', 'mandatory', 'commentMode', 'stakeholderTypes', 'active', 'weightPct'];
  return direct.find((f) => f === path) ?? null;
}

type ServerIssue = { path?: string | (string | number)[]; field?: string; message?: string };

/** `VALIDATION.details` → flat `{ path, message }` issues (zod `issues[]` or a bare array). */
export function serverIssues(error: unknown): { path: string; message: string }[] {
  if (!isApiError(error, 'VALIDATION')) return [];
  const details = error.details as { issues?: ServerIssue[] } | ServerIssue[] | undefined;
  const list = Array.isArray(details) ? details : Array.isArray(details?.issues) ? details.issues : [];
  return list.flatMap((issue) => {
    const raw = issue.field ?? (Array.isArray(issue.path) ? issue.path.join('.') : issue.path);
    return raw ? [{ path: raw.replace(/^body\./, ''), message: issue.message ?? 'Invalid value' }] : [];
  });
}

/** Maps a question VALIDATION error onto the form; true when at least one field received a message. */
export function applyQuestionServerErrors(error: unknown, setError: UseFormSetError<QuestionFormValues>): boolean {
  let applied = false;
  serverIssues(error).forEach(({ path, message }) => {
    const field = questionFormField(path);
    if (!field) return;
    setError(field, { type: 'server', message });
    applied = true;
  });
  return applied;
}

/** A duplicate code answers CONFLICT with no field details; it belongs on the code field. */
export function applyCodeConflict<T extends { code: string }>(error: unknown, setError: UseFormSetError<T>): boolean {
  if (!isApiError(error, 'CONFLICT')) return false;
  setError('code' as Parameters<UseFormSetError<T>>[0], { type: 'server', message: error.message });
  return true;
}

/** '' → null, otherwise the number (NaN stays null) — for live weight guards while typing. */
export function parseWeight(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const placementKey = (categoryId: string, subcategoryId: string | null | undefined) => (subcategoryId ? `sub:${subcategoryId}` : `cat:${categoryId}`);

export function parsePlacement(placement: string, categories: readonly Category[]): { categoryId: string; subcategoryId: string | null } {
  const [kind, id = ''] = placement.split(':');
  if (kind === 'cat') return { categoryId: id, subcategoryId: null };
  const owner = categories.find((c) => c.subcategories.some((s) => s.id === id));
  return { categoryId: owner?.id ?? '', subcategoryId: id };
}

/** Options for the "Placed under" select: every category and its subcategories. */
export function placementOptions(categories: readonly Category[]): { value: string; label: string }[] {
  return categories.flatMap((c) => [
    { value: placementKey(c.id, null), label: `${c.code} · ${c.name}` },
    ...c.subcategories.map((s) => ({ value: placementKey(c.id, s.id), label: `${c.code} › ${s.code} · ${s.name}` })),
  ]);
}

export const toStr = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

export function categoryValues(c?: Pick<CategoryNode, 'code' | 'name' | 'weightPct'>): CategoryFormValues {
  return { code: c?.code ?? '', name: c?.name ?? '', weightPct: toStr(c?.weightPct) };
}

export function subcategoryValues(s?: Pick<SubcategoryNode, 'categoryId' | 'code' | 'name'>, categoryId = ''): SubcategoryFormValues {
  return { categoryId: s?.categoryId ?? categoryId, code: s?.code ?? '', name: s?.name ?? '' };
}

export function questionValues(q?: Question, placement = ''): QuestionFormValues {
  return {
    placement: q ? placementKey(q.categoryId, q.subcategoryId) : placement,
    code: q?.code ?? '',
    text: q?.text ?? '',
    help: q?.help ?? '',
    mandatory: q?.mandatory ?? true,
    commentMode: q?.commentMode ?? 'OPTIONAL',
    stakeholderTypes: q?.stakeholderTypes ?? (['FF', 'CB'] as StakeholderType[]),
    followUpEnabled: Boolean(q?.followUp),
    followUpPrompt: q?.followUp?.prompt ?? '',
    followUpOptions: q?.followUp?.options ?? [],
    active: q?.active ?? true,
    weightPct: toStr(q?.weightPct),
  };
}

/** Form output → the full question body (used for both create and patch). */
export function questionInput(values: QuestionFormOutput, categories: readonly Category[]): CreateQuestionInput & PatchQuestionInput {
  const { categoryId, subcategoryId } = parsePlacement(values.placement, categories);
  const options = values.followUpOptions.map((o) => o.trim()).filter(Boolean);
  return {
    categoryId,
    subcategoryId,
    code: values.code,
    text: values.text,
    help: values.help === '' ? null : values.help,
    mandatory: values.mandatory,
    commentMode: values.commentMode,
    stakeholderTypes: values.stakeholderTypes,
    followUp: values.followUpEnabled ? { prompt: values.followUpPrompt, options } : null,
    active: values.active,
    weightPct: values.weightPct,
  };
}
