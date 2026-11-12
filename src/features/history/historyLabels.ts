import { type AssessmentKind, type AssessmentStatus, type CustomerType, type HistoryRow, type SurveyType } from '@/api/assessments.types';
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

type AssessorFields = Pick<HistoryRow, 'kind' | 'assessorName' | 'assessor'>;

/** A customer's identity the API did not send (privacy setting off for this viewer). */
export function isIdentityHidden(row: Pick<HistoryRow, 'kind' | 'assessor'>): boolean {
  return row.kind === 'CUSTOMER' && !row.assessor.revealed;
}

/** Who answered, as the row shows it: the customer contact (unless hidden) or the operator's user. */
export function assessorLabel(row: AssessorFields): string {
  if (row.assessorName) return row.assessorName;
  if (row.kind === 'SELF') return 'Self-assessment';
  return isIdentityHidden(row) ? 'Identity hidden' : 'Unknown assessor';
}

/** "IST" from "IST (UTC+05:30)" for table cells. */
export function zoneAbbr(tz: string, at?: Date): string {
  return describeTimeZone(tz, at).split(' ')[0] ?? tz;
}
