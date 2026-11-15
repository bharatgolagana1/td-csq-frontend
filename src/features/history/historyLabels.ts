import { type AnswerMode, type AssessmentKind, type AssessmentStatus, type CustomerType, type HistoryRow, type SurveyType } from '@/api/assessments.types';
import { type PillVariant } from '@/design/primitives';
import { formatDateTimeZone } from '@/lib/format';

export const KIND_LABELS: Record<AssessmentKind, string> = { CUSTOMER: 'Customer', SELF: 'Self' };
export const STATUS_LABELS: Record<AssessmentStatus, string> = { DRAFT: 'Draft', SUBMITTED: 'Submitted' };
export const TYPE_LABELS: Record<CustomerType, string> = { FF: 'Freight forwarder', CB: 'Customs broker' };
export const SURVEY_LABELS: Record<SurveyType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International' };

/** The same pills as the sampling and invitation screens: International in the info tone, Domestic neutral. */
export function surveyVariant(surveyType: SurveyType): PillVariant {
  return surveyType === 'INTERNATIONAL' ? 'info' : 'neutral';
}

export function kindVariant(kind: AssessmentKind): PillVariant {
  return kind === 'SELF' ? 'neutral' : 'info';
}

export function statusPillVariant(status: AssessmentStatus): PillVariant {
  return status === 'SUBMITTED' ? 'success' : 'warn';
}

type AssessorFields = Pick<HistoryRow, 'kind' | 'assessorName' | 'assessor'>;

/** A customer's identity the API did not send (privacy setting off for this viewer). */
export function isIdentityHidden(row: Pick<HistoryRow, 'kind' | 'assessor'>): boolean {
  return row.kind === 'CUSTOMER' && !row.assessor.revealed;
}

/** A customer's score the API withholds without `assessments.scores`; a self-assessment's is always shown. */
export function isScoreHidden(row: Pick<HistoryRow, 'kind'>, canViewScores: boolean): boolean {
  return row.kind === 'CUSTOMER' && !canViewScores;
}

/** Whether the read-only return opens: a customer's needs `assessments.details` (the API answers 403 without it), a self-assessment's never does. */
export function canOpenAssessment(row: Pick<HistoryRow, 'kind'>, canViewDetails: boolean): boolean {
  return row.kind === 'SELF' || canViewDetails;
}

/** Who answered, as the row shows it: the customer contact (unless hidden) or the operator's user. */
export function assessorLabel(row: AssessorFields): string {
  if (row.assessorName) return row.assessorName;
  if (row.kind === 'SELF') return 'Self-assessment';
  return isIdentityHidden(row) ? 'Identity hidden' : 'Unknown assessor';
}

/** The row's answer mode; without `answerMode` on the wire, a row scored by direction is an IMPORT_EXPORT one. */
export function rowAnswerMode(row: Pick<HistoryRow, 'answerMode' | 'importScore' | 'exportScore'>): AnswerMode {
  if (row.answerMode) return row.answerMode;
  return (row.importScore ?? null) !== null || (row.exportScore ?? null) !== null ? 'IMPORT_EXPORT' : 'SINGLE';
}

/** The Submitted column: when the row was submitted; for a draft, when it was last saved (`saved: true`), or that nothing has been saved yet. */
export function submittedCell(row: Pick<HistoryRow, 'submittedAt' | 'lastSavedAt'>, tz: string): { saved: boolean; text: string } {
  if (row.submittedAt) return { saved: false, text: formatDateTimeZone(row.submittedAt, tz) };
  if (row.lastSavedAt) return { saved: true, text: formatDateTimeZone(row.lastSavedAt, tz) };
  return { saved: false, text: 'Not saved yet' };
}
