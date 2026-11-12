/*
 * features/assessmentForm — the shared question form (WAVE1-BRIEF §1: used by
 * the operator's self-assessment AND the public /assess/:token flow).
 *
 * Transport-agnostic: nothing here calls the API. The caller loads the form
 * and the saved answers and section remarks, then injects `onSave` /
 * `onSaveRemarks` / `onSubmit`:
 *
 *   <AssessmentStepper
 *     form={form}                       // AssessmentForm: { survey, categories → subcategories → questions }
 *     draft={draft.answers}             // Answer[] as GET …/draft returns them
 *     answerMode={assessment.answerMode ?? 'SINGLE'}   // IMPORT_EXPORT: every question rated for import and export
 *     remarks={draft.sectionRemarks}    // SectionRemark[]: one remark per category, required before submitting
 *     onSave={(answers) => save(answers)}   // merge PATCH …/answers; may return { lastSavedAt }
 *     onSaveRemarks={(remarks) => saveRemarks(remarks)}   // merge PATCH …/remarks, same schedule and save status
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
 * `QuestionHead`, `RatingScale`, `SectionRemarkField`, `StepHeader`, `ProgressBar`, `SaveStatus`,
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
export { SectionRemarkField, type SectionRemarkFieldProps } from './SectionRemarkField';
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
  hasRemark,
  isAnswered,
  isLowRating,
  isSendable,
  LOW_RATING_MAX,
  missingRemarks,
  ownScore,
  progressOf,
  questionDomId,
  RATING_OPTIONS,
  type RatingValue,
  readinessOf,
  REMARK_MAX_LENGTH,
  remarkDomId,
  remarkReviewItems,
  remarksToMap,
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
  RemarkReviewItem,
  ReviewItem,
  ReviewReason,
  SaveStatus as SaveStatusValue,
  SectionReadiness,
  StepReadiness,
} from './types';
export { type SaveResult, useAssessmentDraft, type UseAssessmentDraftOptions, type UseAssessmentDraftResult } from './useAssessmentDraft';
