import { type AnswerDirection, type FormCategory, type FormQuestion, type FormSubcategory, type Rating } from '@/api/assessments.types';

/* Local (unsaved) shapes used by the question-form components and the draft hook. */

/** An answer as the form holds it: `comment` is always a string so textareas stay controlled. IMPORT_EXPORT forms hold one per question and direction. */
export type LocalAnswer = {
  questionId: string;
  direction?: AnswerDirection;
  rating: Rating | null;
  na: boolean;
  comment: string;
  followUp: string[];
};

export type AnswerPatch = Partial<Omit<LocalAnswer, 'questionId' | 'direction'>>;

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
  /** Unanswered answer keys (`answerKey`: the question id, plus `:IMPORT` / `:EXPORT` per direction), in form order. */
  missing: string[];
  /** Answered but breaking a rule (a required comment left empty), in form order. */
  invalid: string[];
  /** `missing` and `invalid` are both empty. */
  complete: boolean;
};

/** Readiness of a step or of the whole form, section remarks included (the draft hook's view). */
export type SectionReadiness = StepReadiness & {
  /** Sections (category ids) still without a remark, in form order. */
  missingRemarks: string[];
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
  /** The direction that needs attention (IMPORT_EXPORT forms). */
  direction?: AnswerDirection;
  code: string;
  text: string;
  index: number;
  stepIndex: number;
  stepLabel: string;
  reason: ReviewReason;
};

/** A section the review step lists because its remark is still empty ("<section> · Remarks needed"). */
export type RemarkReviewItem = {
  /** The section's category id. */
  stepId: string;
  stepIndex: number;
  stepLabel: string;
};

export type AnswerGroupAnswer = { rating: Rating | null; na: boolean; comment: string | null; followUp: string[] };

/** Read-only grouping for the answer summary (self-assessment done state, history return). IMPORT_EXPORT returns fill `importAnswer` and `exportAnswer` instead of `answer`. */
export type AnswerGroupItem = {
  question: { id: string; code: string; text: string };
  subcategory: string | null;
  answer: AnswerGroupAnswer | null;
  importAnswer?: AnswerGroupAnswer | null;
  exportAnswer?: AnswerGroupAnswer | null;
};

/** `remark`: the section's remark, null when it has none. */
export type AnswerGroup = { id: string; name: string; items: AnswerGroupItem[]; remark?: string | null };
