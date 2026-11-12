/*
 * features/assessmentForm — the shared question form (WAVE1-BRIEF §1: used by
 * the operator's self-assessment AND the public /assess/:token flow).
 *
 * Transport-agnostic: nothing here calls the API. The caller loads the form
 * and the saved answers, then injects `onSave` / `onSubmit`:
 *
 *   <AssessmentStepper
 *     form={form}                       // AssessmentForm: { survey, categories → subcategories → questions }
 *     draft={draft.answers}             // Answer[] as GET …/draft returns them
 *     answerMode={assessment.answerMode ?? 'SINGLE'}   // IMPORT_EXPORT: every question rated for import and export
 *     onSave={(answers) => save(answers)}   // merge PATCH …/answers; may return { lastSavedAt }
 *     onSubmit={() => submit()}         // POST …/submit; reject with the ApiError
 *     storageKey={`csq.assess.${token}`}    // localStorage replay queue (omit = memory only)
 *     tz={cycle.tz}
 *     submitNote="Your answers reach the operator only in aggregate."
 *     onProgress={(p) => …} onStatus={(s) => …} onSubmitted={() => …}
 *   />
 *
 * The public-flow types in api/publicAssess.types are structurally identical
 * to api/assessments.types, so `form` and `draft.answers` pass through as-is.
 *
 * Lower-level pieces (for a custom composition): `useAssessmentDraft`,
 * `QuestionCard`, `ImportExportQuestionCard`, `AnswerControls`,
 * `QuestionHead`, `RatingScale`, `StepHeader`, `ProgressBar`, `SaveStatus`,
 * `StepList`, `ReviewList`, `SubmitConfirm`, `AnswerSummary`, and the pure
 * rules (`formSteps`, `readinessOf`, `reviewItems`, `groupsFromForm`, …).
 */

export { AnswerControls, type AnswerControlsProps } from './AnswerControls';
export { AnswerSummary, type AnswerSummaryProps } from './AnswerSummary';
export { AssessmentStepper, type AssessmentStepperProps } from './AssessmentStepper';
export { ImportExportQuestionCard, type ImportExportQuestionCardProps } from './ImportExportQuestionCard';
export { ProgressBar, type ProgressBarProps } from './ProgressBar';
export { QuestionCard, type QuestionCardProps } from './QuestionCard';
export { QuestionHead, type QuestionHeadProps } from './QuestionHead';
export { RatingScale, type RatingScaleProps } from './RatingScale';
export { ReviewList, type ReviewListProps } from './ReviewList';
export {
  ANSWER_DIRECTIONS,
  answerDirections,
  answerIssues,
  answerKey,
  answersToMap,
  commentHint,
  commentRequired,
  DIRECTION_LABELS,
  emptyAnswer,
  formSteps,
  fromAnswer,
  groupsFromDetail,
  groupsFromForm,
  isAnswered,
  isLowRating,
  isSendable,
  LOW_RATING_MAX,
  ownScore,
  progressOf,
  questionDomId,
  RATING_OPTIONS,
  type RatingValue,
  readinessOf,
  reviewItems,
  showsFollowUp,
  stepIndexOf,
  stepQuestions,
  toAnswerInput,
} from './rules';
export { SaveStatus, type SaveStatusProps } from './SaveStatus';
export { StepHeader, type StepHeaderProps } from './StepHeader';
export { StepList, type StepListItem, type StepListProps } from './StepList';
export { SubmitConfirm, type SubmitConfirmProps } from './SubmitConfirm';
export type {
  AnswerGroup,
  AnswerGroupAnswer,
  AnswerGroupItem,
  AnswerIssue,
  AnswerIssueField,
  AnswerPatch,
  FormStep,
  FormStepQuestion,
  LocalAnswer,
  ReviewItem,
  ReviewReason,
  SaveStatus as SaveStatusValue,
  StepReadiness,
} from './types';
export { type SaveResult, useAssessmentDraft, type UseAssessmentDraftOptions, type UseAssessmentDraftResult } from './useAssessmentDraft';
