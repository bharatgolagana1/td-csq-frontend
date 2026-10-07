import { type FormCategory, type FormQuestion, type FormSubcategory, type Rating } from '@/api/assessments.types';

/* Local (unsaved) shapes used by the question-form components and the draft hook. */

/** An answer as the form holds it: `comment` is always a string so textareas stay controlled. */
export type LocalAnswer = {
  questionId: string;
  rating: Rating | null;
  na: boolean;
  comment: string;
  followUp: string[];
};

export type AnswerPatch = Partial<Omit<LocalAnswer, 'questionId'>>;

export type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: string }
  | { kind: 'offline'; pending: number }
  | { kind: 'error'; message: string; requestId?: string; pending: number };

export type AnswerIssueField = 'rating' | 'comment';
export type AnswerIssue = { field: AnswerIssueField; message: string };

/** Readiness of a set of questions (a step or the whole form). */
export type StepReadiness = {
  answered: number;
  total: number;
  /** Unanswered question ids, in form order. */
  missing: string[];
  /** Answered but breaking a rule (a required comment left empty), in form order. */
  invalid: string[];
  /** `missing` and `invalid` are both empty. */
  complete: boolean;
};

export type FormStepQuestion = {
  question: FormQuestion;
  subcategory: FormSubcategory | null;
  /** 1-based position across the whole form. */
  index: number;
};

/** One step of the stepper = one category. */
export type FormStep = {
  id: string;
  label: string;
  category: FormCategory;
  questions: FormStepQuestion[];
};

export type ReviewReason = 'missing' | 'comment';

export type ReviewItem = {
  questionId: string;
  code: string;
  text: string;
  index: number;
  stepIndex: number;
  stepLabel: string;
  reason: ReviewReason;
};

/** Read-only grouping for the answer summary (self-assessment done state, history return). */
export type AnswerGroupItem = {
  question: { id: string; code: string; text: string };
  subcategory: string | null;
  answer: { rating: Rating | null; na: boolean; comment: string | null; followUp: string[] } | null;
};

export type AnswerGroup = { id: string; name: string; items: AnswerGroupItem[] };
