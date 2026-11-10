import { type AnswerMode, type Answer, type AnswerDirection, type AnswerInput, type AssessmentForm, type DetailAnswer, type FormQuestion, type Progress, type Rating } from '@/api/assessments.types';

import { type AnswerGroup, type AnswerGroupItem, type AnswerIssue, type FormStep, type FormStepQuestion, type LocalAnswer, type ReviewItem, type StepReadiness } from './types';

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

export function answerKey(
  questionId: string,
  direction?: AnswerDirection | null,
): string {
  return direction
    ? JSON.stringify([questionId, direction])
    : questionId;
}

export function emptyAnswer(
  questionId: string,
  direction?: AnswerDirection,
): LocalAnswer {
  return {
    questionId,
    ...(direction ? { direction } : {}),
    rating: null,
    na: false,
    comment: '',
    followUp: [],
  };
}

export function fromAnswer(answer: Answer): LocalAnswer {
  return {
    questionId: answer.questionId,
    ...(answer.direction ? { direction: answer.direction } : {}),
    rating: answer.rating,
    na: answer.na,
    comment: answer.comment ?? '',
    followUp: [...answer.followUp],
  };
}

export function answersToMap(
  answers: readonly Answer[],
): Map<string, LocalAnswer> {
  return new Map(
    answers.map((answer) => [
      answerKey(answer.questionId, answer.direction),
      fromAnswer(answer),
    ]),
  );
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
return {
  questionId: answer.questionId,
  ...(answer.direction ? { direction: answer.direction } : {}),
  rating: answer.na ? null : answer.rating,
  na: answer.na,
  comment,
  followUp,
};

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

export function readinessOf(
  questions: readonly FormStepQuestion[],
  answers: ReadonlyMap<string, LocalAnswer>,
  answerMode: AnswerMode = 'SINGLE',
): StepReadiness {
  const missing: string[] = [];
  const invalid: string[] = [];

  const directions: (AnswerDirection | null)[] =
    answerMode === 'IMPORT_EXPORT'
      ? ['IMPORT', 'EXPORT']
      : [null];

  questions.forEach(({ question }) => {
    directions.forEach((direction) => {
      const key = answerKey(question.id, direction);
      const answer = answers.get(key);

      const slotId = direction
        ? `${question.id}:${direction}`
        : question.id;

      if (!isAnswered(answer)) {
        missing.push(slotId);
      } else if (answerIssues(question, answer).length > 0) {
        invalid.push(slotId);
      }
    });
  });

  const total = questions.length * directions.length;

  return {
    answered: total - missing.length,
    total,
    missing,
    invalid,
    complete: missing.length === 0 && invalid.length === 0,
  };
}

export function progressOf(answered: number, total: number): Progress {
  return { answered, total, pct: total === 0 ? 0 : Math.round((answered / total) * 100) };
}

export function reviewItems(
  steps: readonly FormStep[],
  answers: ReadonlyMap<string, LocalAnswer>,
  answerMode: AnswerMode = 'SINGLE',
): ReviewItem[] {
  const items: ReviewItem[] = [];

  const directions: readonly (AnswerDirection | null)[] =
    answerMode === 'IMPORT_EXPORT'
      ? ['IMPORT', 'EXPORT']
      : [null];

  steps.forEach((step, stepIndex) => {
    step.questions.forEach(({ question, index }) => {
      directions.forEach((direction) => {
        const answer = answers.get(
          answerKey(question.id, direction),
        );

        const issues = answerIssues(question, answer);

        if (issues.length === 0) return;

        const reason = issues.some(
          (issue) => issue.field === 'rating',
        )
          ? 'missing'
          : 'comment';

        items.push({
          questionId: question.id,
          ...(direction ? { direction } : {}),
          code: question.code,
          text: question.text,
          index,
          stepIndex,
          stepLabel: step.label,
          reason,
        });
      });
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

/** Read-only groups from a GET /assessments/:id return. */
export function groupsFromDetail(answers: readonly DetailAnswer[]): AnswerGroup[] {
  const groups: AnswerGroup[] = [];
  const byCategory = new Map<string, AnswerGroup>();
  const byQuestion = new Map<string, AnswerGroupItem>();

  answers.forEach((a) => {
    let group = byCategory.get(a.category.id);

    if (!group) {
      group = {
        id: a.category.id,
        name: a.category.name,
        items: [],
      };

      byCategory.set(a.category.id, group);
      groups.push(group);
    }

    const questionKey = JSON.stringify([a.category.id, a.questionId]);
    let item = byQuestion.get(questionKey);

    if (!item) {
      item = {
        question: {
          id: a.questionId,
          code: a.code,
          text: a.text,
        },
        subcategory: a.subcategory?.name ?? null,
        answer: null,
      };

      byQuestion.set(questionKey, item);
      group.items.push(item);
    }

    const answer =
      a.rating !== null || a.na
        ? {
            rating: a.rating,
            na: a.na,
            comment: a.comment,
            followUp: a.followUp,
          }
        : null;

    if (a.direction === 'IMPORT') {
      item.importAnswer = answer;
    } else if (a.direction === 'EXPORT') {
      item.exportAnswer = answer;
    } else {
      // Preserve historical SINGLE assessments.
      item.answer = answer;
    }
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
