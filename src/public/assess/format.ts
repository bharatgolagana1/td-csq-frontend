import { parseISO } from 'date-fns';

import { type PublicInvitation, type SurveyType } from '@/api/publicAssess.types';
import { DEFAULT_TZ, describeTimeZone, formatDateTime, formatRelative } from '@/lib/format';

/* Small formatters for the public page: everything in the cycle's time zone
   with its abbreviation (brief §2), never the phone's zone. */

export function cycleTz(invitation: Pick<PublicInvitation, 'cycle'> | null | undefined): string {
  return invitation?.cycle.tz || DEFAULT_TZ;
}

/** Zones whose runtime name is often missing (headless and older engines print "GMT+5:30"); none of these observe DST. */
const KNOWN_ABBR: Record<string, string> = { 'Asia/Kolkata': 'IST', 'Asia/Calcutta': 'IST' };

/** "IST" (or "UTC+05:30" where the runtime has no zone names and we know none either). */
export function zoneAbbr(tz: string, at = new Date()): string {
  const abbr = describeTimeZone(tz, at).split(' ')[0] ?? tz;
  if (/^UTC[+-]/.test(abbr) && KNOWN_ABBR[tz]) return KNOWN_ABBR[tz];
  return abbr;
}

/** "31 Oct 2026, 23:59 IST" */
export function formatZoned(iso: string | null | undefined, tz: string): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDateTime(d, tz)} ${zoneAbbr(tz, d)}`;
}

export function closesOn(invitation: PublicInvitation): { absolute: string; relative: string; past: boolean } {
  const tz = cycleTz(invitation);
  const end = parseISO(invitation.cycle.assessmentEnd);
  const valid = !Number.isNaN(end.getTime());
  const past = valid && end.getTime() <= Date.now();
  return {
    absolute: formatZoned(invitation.cycle.assessmentEnd, tz),
    relative: valid ? (past ? 'closed' : `closes ${formatRelative(end)}`) : '',
    past,
  };
}

export function surveyTypeLabel(type: SurveyType | undefined): string {
  if (type === 'DOMESTIC') return 'Domestic';
  if (type === 'INTERNATIONAL') return 'International';
  return '—';
}

export function stakeholderLabel(type: 'FF' | 'CB' | undefined): string | null {
  if (type === 'FF') return 'Freight forwarder';
  if (type === 'CB') return 'Customs broker';
  return null;
}
