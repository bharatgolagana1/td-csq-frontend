import { type Answer, type AnswerDirection, type AnswerInput, type AnswerMode, type AssessmentForm, type DetailAnswer, type FormQuestion, type Progress, type Rating, type SectionRemark } from '@/api/assessments.types';

import { type AnswerGroup, type AnswerGroupAnswer, type AnswerGroupItem, type AnswerIssue, type FormStep, type FormStepQuestion, type LocalAnswer, type RemarkReviewItem, type ReviewItem, type StepReadiness } from './types';

/* Form rules (backend ARCHITECTURE §7 "Form rules"), mirrored client-side so the
   form validates inline and never sends an answer the server would refuse:
   every active question needs a rating or NA; a comment when the comment mode
   says so (REQUIRED_ON_LOW ⇒ Fair/Poor); follow-up options only on Fair/Poor
   and only from the question's list. An IMPORT_EXPORT form asks every question
   twice, once per direction, and each direction follows the same rules. Every
   section (category) also takes one remark, whatever the answer mode, and
   submitting waits for all of them. Pure: no React, no IO. */

export type RatingValue = Rating | 'NA';

/** The six segmented options, in display order. */
export const RATING_OPTIONS: readonly { value: RatingValue; label: string; short: string }[] = [
  { value: 5, label: 'Excellent', short: 'Exc.' },
  { value: 4, label: 'Very good', short: 'V. good' },
  { value: 3, label: 'Good', short: 'Good' },
  { value: 2, label: 'Fair', short: 'Fair' },
  { value: 1, label: 'Poor', short: 'Poor' },
  { value: 'NA', label: 'NA', short: 'NA' },
];

/** Fair (2) and Poor (1) are the "low" ratings that ask for a comment / follow-up. */
export const LOW_RATING_MAX = 2;

export function isLowRating(rating: Rating | null | undefined): boolean {
  return rating !== null && rating !== undefined && rating <= LOW_RATING_MAX;
}

export const ANSWER_DIRECTIONS: readonly AnswerDirection[] = ['IMPORT', 'EXPORT'];

export const DIRECTION_LABELS: Record<AnswerDirection, string> = { IMPORT: 'Import', EXPORT: 'Export' };

/** The answers a question takes: one per direction under IMPORT_EXPORT, a single undirected one otherwise. */
export function answerDirections(mode: AnswerMode = 'SINGLE'): readonly (AnswerDirection | undefined)[] {
  return mode === 'IMPORT_EXPORT' ? ANSWER_DIRECTIONS : [undefined];
}

/** Key of a local answer: the question id, with `:IMPORT` / `:EXPORT` for a directed one. */
export function answerKey(questionId: string, direction?: AnswerDirection | null): string {
  return direction ? `${questionId}:${direction}` : questionId;
}

export function emptyAnswer(questionId: string, direction?: AnswerDirection): LocalAnswer {
  return { questionId, ...(direction ? { direction } : {}), rating: null, na: false, comment: '', followUp: [] };
}

export function fromAnswer(answer: Answer): LocalAnswer {
  return { questionId: answer.questionId, ...(answer.direction ? { direction: answer.direction } : {}), rating: answer.rating, na: answer.na, comment: answer.comment ?? '', followUp: [...answer.followUp] };
}

export function answersToMap(answers: readonly Answer[]): Map<string, LocalAnswer> {
  return new Map(answers.map((a) => [answerKey(a.questionId, a.direction), fromAnswer(a)]));
}

export function isAnswered(answer: LocalAnswer | undefined): boolean {
  return Boolean(answer && (answer.rating !== null || answer.na));
}

export function commentRequired(question: FormQuestion, answer: LocalAnswer | undefined): boolean {
  if (question.commentMode === 'REQUIRED') return true;
  if (question.commentMode === 'REQUIRED_ON_LOW') return isLowRating(answer?.rating);
  return false;
}

export function showsFollowUp(question: FormQuestion, answer: LocalAnswer | undefined): boolean {
  return question.followUp !== null && question.followUp.options.length > 0 && isLowRating(answer?.rating);
}

export function commentHint(question: FormQuestion, answer: LocalAnswer | undefined): string | undefined {
  if (question.commentMode === 'NONE') return undefined;
  if (commentRequired(question, answer)) return question.commentMode === 'REQUIRED' ? 'Required' : 'Required for a Fair or Poor rating';
  if (question.commentMode === 'REQUIRED_ON_LOW') return 'Optional · required for a Fair or Poor rating';
  return 'Optional';
}

/** Inline validation for one question. Empty when the answer is complete and valid. */
export function answerIssues(question: FormQuestion, answer: LocalAnswer | undefined): AnswerIssue[] {
  const issues: AnswerIssue[] = [];
  if (!isAnswered(answer)) issues.push({ field: 'rating', message: 'Choose a rating or NA' });
  if (commentRequired(question, answer) && !(answer?.comment ?? '').trim()) {
    issues.push({ field: 'comment', message: question.commentMode === 'REQUIRED' ? 'A comment is required for this question' : 'A comment is required for a Fair or Poor rating' });
  }
  return issues;
}

/** Answered and valid: safe to send to the server. */
export function isSendable(question: FormQuestion, answer: LocalAnswer | undefined): answer is LocalAnswer {
  return answer !== undefined && answerIssues(question, answer).length === 0;
}

/** The wire shape of a local answer, applying the rules the server enforces (no comment on NONE, follow-up only on low and only listed options). */
export function toAnswerInput(question: FormQuestion, answer: LocalAnswer): AnswerInput {
  const comment = question.commentMode === 'NONE' ? null : answer.comment.trim() || null;
  const listed = new Set(question.followUp?.options ?? []);
  const followUp = isLowRating(answer.rating) ? Array.from(new Set(answer.followUp.filter((o) => listed.has(o)))) : [];
  return { questionId: answer.questionId, ...(answer.direction ? { direction: answer.direction } : {}), rating: answer.na ? null : answer.rating, na: answer.na, comment, followUp };
}

/** One step per category; questions in display order (subcategories first, then direct questions), numbered across the form. */
export function formSteps(form: AssessmentForm): FormStep[] {
  let index = 0;
  return form.categories.map((category) => ({
    id: category.id,
    label: category.name,
    category,
    questions: [
      ...category.subcategories.flatMap((subcategory) => subcategory.questions.map((question) => ({ question, subcategory, index: ++index }))),
      ...category.questions.map((question) => ({ question, subcategory: null, index: ++index })),
    ],
  }));
}

export function stepQuestions(steps: readonly FormStep[]): FormStepQuestion[] {
  return steps.flatMap((s) => s.questions);
}

/** Readiness of a list of questions against the local answers (§7: every question answered — in both directions under IMPORT_EXPORT; rules satisfied). */
export function readinessOf(questions: readonly FormStepQuestion[], answers: ReadonlyMap<string, LocalAnswer>, mode: AnswerMode = 'SINGLE'): StepReadiness {
  const missing: string[] = [];
  const invalid: string[] = [];
  const directions = answerDirections(mode);
  questions.forEach(({ question }) => {
    directions.forEach((direction) => {
      const key = answerKey(question.id, direction);
      const answer = answers.get(key);
      if (!isAnswered(answer)) missing.push(key);
      else if (answerIssues(question, answer).length > 0) invalid.push(key);
    });
  });
  const total = questions.length * directions.length;
  return { answered: total - missing.length, total, missing, invalid, complete: missing.length === 0 && invalid.length === 0 };
}

export function progressOf(answered: number, total: number): Progress {
  return { answered, total, pct: total === 0 ? 0 : Math.round((answered / total) * 100) };
}

/** Everything the review step lists: unanswered questions and required comments left empty, in form order (import before export). */
export function reviewItems(steps: readonly FormStep[], answers: ReadonlyMap<string, LocalAnswer>, mode: AnswerMode = 'SINGLE'): ReviewItem[] {
  const items: ReviewItem[] = [];
  const directions = answerDirections(mode);
  steps.forEach((step, stepIndex) => {
    step.questions.forEach(({ question, index }) => {
      directions.forEach((direction) => {
        const issues = answerIssues(question, answers.get(answerKey(question.id, direction)));
        if (issues.length === 0) return;
        const reason = issues.some((i) => i.field === 'rating') ? 'missing' : 'comment';
        items.push({ questionId: question.id, ...(direction ? { direction } : {}), code: question.code, text: question.text, index, stepIndex, stepLabel: step.label, reason });
      });
    });
  });
  return items;
}

// --- section remarks ---------------------------------------------------------

/** The longest remark the server takes. */
export const REMARK_MAX_LENGTH = 2000;

/** A section's remark counts once it holds more than whitespace (the server trims, and clears an empty one). */
export function hasRemark(remark: string | undefined): boolean {
  return Boolean(remark?.trim());
}

export function remarksToMap(remarks: readonly SectionRemark[]): Map<string, string> {
  return new Map(remarks.map((r) => [r.categoryId, r.remark]));
}

/** Sections (category ids) still without a remark, in form order. */
export function missingRemarks(steps: readonly FormStep[], remarks: ReadonlyMap<string, string>): string[] {
  return steps.filter((s) => !hasRemark(remarks.get(s.id))).map((s) => s.id);
}

/** The review step's "<section> · Remarks needed" entries, in form order. */
export function remarkReviewItems(steps: readonly FormStep[], remarks: ReadonlyMap<string, string>): RemarkReviewItem[] {
  return steps.flatMap((step, stepIndex) => (hasRemark(remarks.get(step.id)) ? [] : [{ stepId: step.id, stepIndex, stepLabel: step.label }]));
}

/** DOM id of a section's remark field, for jump links. */
export function remarkDomId(categoryId: string): string {
  return `remark-${categoryId}`;
}

/** The assessment's own NA-excluding mean rating, 1 dp; null when nothing is rated. */
export function ownScore(answers: Iterable<{ rating: Rating | null; na?: boolean }>): number | null {
  let sum = 0;
  let n = 0;
  for (const a of answers) {
    if (a.rating === null) continue;
    sum += a.rating;
    n += 1;
  }
  if (n === 0) return null;
  return Math.round((sum / n) * 10) / 10;
}

function groupAnswer(a: Answer | undefined): AnswerGroupAnswer | null {
  return a ? { rating: a.rating, na: a.na, comment: a.comment, followUp: a.followUp } : null;
}

/** Read-only groups (category → items, and the section's remark) for the answer summary from a form and its saved answers. */
export function groupsFromForm(form: AssessmentForm, answers: readonly Answer[], mode: AnswerMode = 'SINGLE', remarks: readonly SectionRemark[] = []): AnswerGroup[] {
  const byKey = new Map(answers.map((a) => [answerKey(a.questionId, a.direction), a]));
  const remarkOf = remarksToMap(remarks);
  return formSteps(form).map((step) => ({
    id: step.id,
    name: step.label,
    remark: remarkOf.get(step.id) ?? null,
    items: step.questions.map(({ question, subcategory }) => ({
      question: { id: question.id, code: question.code, text: question.text },
      subcategory: subcategory?.name ?? null,
      ...(mode === 'IMPORT_EXPORT'
        ? { answer: null, importAnswer: groupAnswer(byKey.get(answerKey(question.id, 'IMPORT'))), exportAnswer: groupAnswer(byKey.get(answerKey(question.id, 'EXPORT'))) }
        : { answer: groupAnswer(byKey.get(question.id)) }),
    })),
  }));
}

/** Read-only groups from a `GET /assessments/:id` return (every form question with its answer, in form order; an IMPORT_EXPORT return lists each question once per direction), each with its section's remark. */
export function groupsFromDetail(answers: readonly DetailAnswer[], remarks: readonly SectionRemark[] = []): AnswerGroup[] {
  const groups: AnswerGroup[] = [];
  const byCategory = new Map<string, AnswerGroup>();
  const byQuestion = new Map<string, AnswerGroupItem>();
  const remarkOf = remarksToMap(remarks);
  answers.forEach((a) => {
    let group = byCategory.get(a.category.id);
    if (!group) {
      group = { id: a.category.id, name: a.category.name, items: [], remark: remarkOf.get(a.category.id) ?? null };
      byCategory.set(a.category.id, group);
      groups.push(group);
    }
    let item = byQuestion.get(a.questionId);
    if (!item) {
      item = { question: { id: a.questionId, code: a.code, text: a.text }, subcategory: a.subcategory?.name ?? null, answer: null };
      byQuestion.set(a.questionId, item);
      group.items.push(item);
    }
    const answer = a.rating !== null || a.na ? groupAnswer(a) : null;
    if (a.direction === 'IMPORT') item.importAnswer = answer;
    else if (a.direction === 'EXPORT') item.exportAnswer = answer;
    else item.answer = answer;
  });
  return groups;
}

export function stepIndexOf(steps: readonly FormStep[], questionId: string): number {
  return steps.findIndex((s) => s.questions.some((q) => q.question.id === questionId));
}

/** DOM id of a question card (or of one direction's part of it), for jump links. */
export function questionDomId(questionId: string, direction?: AnswerDirection): string {
  return direction ? `q-${questionId}-${direction.toLowerCase()}` : `q-${questionId}`;
}
