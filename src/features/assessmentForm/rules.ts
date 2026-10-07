import { type Answer, type AnswerInput, type AssessmentForm, type DetailAnswer, type FormQuestion, type Progress, type Rating } from '@/api/assessments.types';

import { type AnswerGroup, type AnswerIssue, type FormStep, type FormStepQuestion, type LocalAnswer, type ReviewItem, type StepReadiness } from './types';

/* Form rules (backend ARCHITECTURE §7 "Form rules"), mirrored client-side so the
   form validates inline and never sends an answer the server would refuse:
   every active question needs a rating or NA; a comment when the comment mode
   says so (REQUIRED_ON_LOW ⇒ Fair/Poor); follow-up options only on Fair/Poor
   and only from the question's list. Pure: no React, no IO. */

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

export function emptyAnswer(questionId: string): LocalAnswer {
  return { questionId, rating: null, na: false, comment: '', followUp: [] };
}

export function fromAnswer(answer: Answer): LocalAnswer {
  return { questionId: answer.questionId, rating: answer.rating, na: answer.na, comment: answer.comment ?? '', followUp: [...answer.followUp] };
}

export function answersToMap(answers: readonly Answer[]): Map<string, LocalAnswer> {
  return new Map(answers.map((a) => [a.questionId, fromAnswer(a)]));
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
  return { questionId: answer.questionId, rating: answer.na ? null : answer.rating, na: answer.na, comment, followUp };
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

/** Readiness of a list of questions against the local answers (§7: every question answered; rules satisfied). */
export function readinessOf(questions: readonly FormStepQuestion[], answers: ReadonlyMap<string, LocalAnswer>): StepReadiness {
  const missing: string[] = [];
  const invalid: string[] = [];
  questions.forEach(({ question }) => {
    const answer = answers.get(question.id);
    if (!isAnswered(answer)) missing.push(question.id);
    else if (answerIssues(question, answer).length > 0) invalid.push(question.id);
  });
  return { answered: questions.length - missing.length, total: questions.length, missing, invalid, complete: missing.length === 0 && invalid.length === 0 };
}

export function progressOf(answered: number, total: number): Progress {
  return { answered, total, pct: total === 0 ? 0 : Math.round((answered / total) * 100) };
}

/** Everything the review step lists: unanswered questions and required comments left empty, in form order. */
export function reviewItems(steps: readonly FormStep[], answers: ReadonlyMap<string, LocalAnswer>): ReviewItem[] {
  const items: ReviewItem[] = [];
  steps.forEach((step, stepIndex) => {
    step.questions.forEach(({ question, index }) => {
      const answer = answers.get(question.id);
      const issues = answerIssues(question, answer);
      if (issues.length === 0) return;
      const reason = issues.some((i) => i.field === 'rating') ? 'missing' : 'comment';
      items.push({ questionId: question.id, code: question.code, text: question.text, index, stepIndex, stepLabel: step.label, reason });
    });
  });
  return items;
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

/** Read-only groups (category → items) for the answer summary from a form and its saved answers. */
export function groupsFromForm(form: AssessmentForm, answers: readonly Answer[]): AnswerGroup[] {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  return formSteps(form).map((step) => ({
    id: step.id,
    name: step.label,
    items: step.questions.map(({ question, subcategory }) => {
      const a = byId.get(question.id);
      return {
        question: { id: question.id, code: question.code, text: question.text },
        subcategory: subcategory?.name ?? null,
        answer: a ? { rating: a.rating, na: a.na, comment: a.comment, followUp: a.followUp } : null,
      };
    }),
  }));
}

/** Read-only groups from a `GET /assessments/:id` return (every form question with its answer, in form order). */
export function groupsFromDetail(answers: readonly DetailAnswer[]): AnswerGroup[] {
  const groups: AnswerGroup[] = [];
  const byCategory = new Map<string, AnswerGroup>();
  answers.forEach((a) => {
    let group = byCategory.get(a.category.id);
    if (!group) {
      group = { id: a.category.id, name: a.category.name, items: [] };
      byCategory.set(a.category.id, group);
      groups.push(group);
    }
    group.items.push({
      question: { id: a.questionId, code: a.code, text: a.text },
      subcategory: a.subcategory?.name ?? null,
      answer: a.rating !== null || a.na ? { rating: a.rating, na: a.na, comment: a.comment, followUp: a.followUp } : null,
    });
  });
  return groups;
}

export function stepIndexOf(steps: readonly FormStep[], questionId: string): number {
  return steps.findIndex((s) => s.questions.some((q) => q.question.id === questionId));
}

/** DOM id of a question card, for jump links. */
export function questionDomId(questionId: string): string {
  return `q-${questionId}`;
}
