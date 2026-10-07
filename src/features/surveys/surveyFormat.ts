import { type CommentMode, type StakeholderType, type SurveyStatus, type SurveyType } from '@/api/surveys.types';
import { type PillVariant } from '@/design/primitives';
import { DEFAULT_TZ, describeTimeZone, formatDateTime } from '@/lib/format';

/* Labels and formatters for the surveys area. Dates follow the §2 convention:
   the platform time zone with its abbreviation (surveys are not tied to a cycle). */

export const TYPE_LABEL: Record<SurveyType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International' };

export const STAKEHOLDER_LABEL: Record<StakeholderType, string> = { FF: 'Freight forwarder', CB: 'Customs broker' };
export const STAKEHOLDER_PLURAL: Record<StakeholderType, string> = { FF: 'Freight forwarders', CB: 'Customs brokers' };

export const COMMENT_MODE_LABEL: Record<CommentMode, string> = {
  OPTIONAL: 'Optional',
  REQUIRED: 'Required',
  REQUIRED_ON_LOW: 'Required on Fair or Poor',
  NONE: 'No comment box',
};

export const COMMENT_MODE_OPTIONS = (Object.keys(COMMENT_MODE_LABEL) as CommentMode[]).map((value) => ({ value, label: COMMENT_MODE_LABEL[value] }));

export const STATUS_LABEL: Record<SurveyStatus, string> = { DRAFT: 'Draft', PUBLISHED: 'Published', RETIRED: 'Retired' };

export function statusPillVariant(status: SurveyStatus): PillVariant {
  return status === 'PUBLISHED' ? 'success' : status === 'DRAFT' ? 'warn' : 'neutral';
}

export function versionLabel(version: number): string {
  return `v${version}`;
}

/** "2 Oct 2026, 14:30 IST" (zone abbreviation appended, §2). */
export function formatZoned(iso: string | null | undefined, tz = DEFAULT_TZ): string {
  if (!iso) return '—';
  const abbr = describeTimeZone(tz).split(' ')[0] ?? '';
  return `${formatDateTime(iso, tz)} ${abbr}`.trim();
}

/** Published heading text for a version. */
export function describePublished(publishedAt: string | null | undefined): string {
  return publishedAt ? `Published ${formatZoned(publishedAt)}` : 'Not published';
}

export function pluralQuestions(n: number): string {
  return `${n} ${n === 1 ? 'question' : 'questions'}`;
}
