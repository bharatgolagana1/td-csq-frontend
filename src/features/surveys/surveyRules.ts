import { type Category, type Question, type SurveyIssue } from '@/api/surveys.types';

/* Pure rules mirrored from the backend's survey-rules.ts so the editor can show
   the 100 % guard live and the publish dialog can list what blocks publishing
   before the server is asked. Empty categories are a warning only: the API
   publishes them (the assessor form just drops empty groups). */

export const WEIGHT_TOLERANCE = 0.01;

export type WeightSummary =
  | { state: 'unweighted'; total: 0; count: number }
  | { state: 'partial'; total: number; count: number; missing: string[] }
  | { state: 'ok'; total: number; count: number }
  | { state: 'off'; total: number; count: number };

type Weighted = { code: string; weightPct: number | null };

/** Siblings are all-or-none: every one weighted and totalling 100, or none. */
export function summariseWeights(siblings: readonly Weighted[]): WeightSummary {
  const count = siblings.length;
  const weighted = siblings.filter((s) => s.weightPct !== null);
  if (weighted.length === 0) return { state: 'unweighted', total: 0, count };
  const total = round2(weighted.reduce((sum, s) => sum + (s.weightPct ?? 0), 0));
  if (weighted.length < count) return { state: 'partial', total, count, missing: siblings.filter((s) => s.weightPct === null).map((s) => s.code) };
  if (Math.abs(total - 100) > WEIGHT_TOLERANCE) return { state: 'off', total, count };
  return { state: 'ok', total, count };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const activeQuestions = (qs: readonly Question[]): Question[] => qs.filter((q) => q.active);

/** Weight messages per level, with the same paths the API reports. */
export function weightIssues(categories: readonly Category[]): SurveyIssue[] {
  const issues: SurveyIssue[] = [];
  const check = (path: string, what: string, siblings: readonly Weighted[]) => {
    const s = summariseWeights(siblings);
    if (s.state === 'partial') issues.push({ path, message: `weightPct is set on some ${what} but not on ${s.missing.join(', ')}` });
    if (s.state === 'off') issues.push({ path, message: `${what} weights must total 100 (got ${s.total})` });
  };
  check('categories', 'categories', categories);
  categories.forEach((c) => {
    check(`categories.${c.code}.questions`, 'questions', activeQuestions(c.questions));
    c.subcategories.forEach((s) => check(`categories.${c.code}.subcategories.${s.code}.questions`, 'questions', activeQuestions(s.questions)));
  });
  return issues;
}

/** Everything that must hold before a DRAFT becomes PUBLISHED (blocking). */
export function publishIssues(categories: readonly Category[]): SurveyIssue[] {
  const issues: SurveyIssue[] = [];
  if (categories.length === 0) issues.push({ path: 'categories', message: 'A survey needs at least one category' });
  const active = countActiveQuestions(categories);
  if (categories.length > 0 && active === 0) issues.push({ path: 'questions', message: 'A survey needs at least one active question' });
  return [...issues, ...weightIssues(categories)];
}

/** Categories (and subcategories) without an active question: published, but never shown to an assessor. */
export function emptyGroupWarnings(categories: readonly Category[]): SurveyIssue[] {
  const warnings: SurveyIssue[] = [];
  categories.forEach((c) => {
    const direct = activeQuestions(c.questions).length;
    const nested = c.subcategories.reduce((n, s) => n + activeQuestions(s.questions).length, 0);
    if (direct + nested === 0) warnings.push({ path: `categories.${c.code}`, message: `Category ${c.code} (${c.name}) has no active question` });
    c.subcategories.forEach((s) => {
      if (activeQuestions(s.questions).length === 0) warnings.push({ path: `categories.${c.code}.subcategories.${s.code}`, message: `Subcategory ${s.code} (${s.name}) has no active question` });
    });
  });
  return warnings;
}

/** Client + server issues, de-duplicated by path + message. */
export function mergeIssues(...lists: readonly SurveyIssue[][]): SurveyIssue[] {
  const seen = new Set<string>();
  const out: SurveyIssue[] = [];
  lists.flat().forEach((i) => {
    const key = `${i.path}|${i.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(i);
  });
  return out;
}

export function countActiveQuestions(categories: readonly Category[]): number {
  return categories.reduce((n, c) => n + activeQuestions(c.questions).length + c.subcategories.reduce((m, s) => m + activeQuestions(s.questions).length, 0), 0);
}

export function countQuestions(categories: readonly Category[]): number {
  return categories.reduce((n, c) => n + c.questions.length + c.subcategories.reduce((m, s) => m + s.questions.length, 0), 0);
}

/** Active-question count per category, keyed by category code. */
export function countByHead(categories: readonly Category[]): Map<string, { code: string; name: string; count: number }> {
  const out = new Map<string, { code: string; name: string; count: number }>();
  categories.forEach((c) => {
    const count = activeQuestions(c.questions).length + c.subcategories.reduce((m, s) => m + activeQuestions(s.questions).length, 0);
    out.set(c.code, { code: c.code, name: c.name, count });
  });
  return out;
}
