import { type AnswerMode, type AssessmentKind, type AssessmentStatus, type CustomerType, type HistoryRow, type SurveyType } from '@/api/assessments.types';
import { type PillVariant } from '@/design/primitives';
import { describeTimeZone } from '@/lib/format';

export const KIND_LABELS: Record<AssessmentKind, string> = { CUSTOMER: 'Customer', SELF: 'Self' };
export const STATUS_LABELS: Record<AssessmentStatus, string> = { DRAFT: 'Draft', SUBMITTED: 'Submitted' };
export const TYPE_LABELS: Record<CustomerType, string> = { FF: 'Freight forwarder', CB: 'Customs broker' };
export const SURVEY_LABELS: Record<SurveyType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International' };

export function kindVariant(kind: AssessmentKind): PillVariant {
  return kind === 'SELF' ? 'neutral' : 'info';
}

export function statusPillVariant(status: AssessmentStatus): PillVariant {
  return status === 'SUBMITTED' ? 'success' : 'warn';
}

/** Who answered, as the row shows it: the customer contact (masked unless revealed) or the operator's user. */
export function assessorLabel(row: Pick<HistoryRow, 'kind' | 'assessorName'>): string {
  if (row.assessorName) return row.assessorName;
  return row.kind === 'SELF' ? 'Self-assessment' : 'Unknown assessor';
}

/** The row's answer mode; without `answerMode` on the wire, a row scored by direction is an IMPORT_EXPORT one. */
export function rowAnswerMode(row: Pick<HistoryRow, 'answerMode' | 'importScore' | 'exportScore'>): AnswerMode {
  if (row.answerMode) return row.answerMode;
  return (row.importScore ?? null) !== null || (row.exportScore ?? null) !== null ? 'IMPORT_EXPORT' : 'SINGLE';
}

/** "IST" from "IST (UTC+05:30)" for table cells. */
export function zoneAbbr(tz: string, at?: Date): string {
  return describeTimeZone(tz, at).split(' ')[0] ?? tz;
}
