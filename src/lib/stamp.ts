import { parseISO } from 'date-fns';
import { enIN } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

import { DEFAULT_TZ, formatDateTime } from './format';

/* Zoned timestamps for log tables (WAVE1 brief §2: dates in the cycle's time
   zone with the zone abbreviation). */

export type Stamp = { full: string; short: string };

/** "7 Oct 2026, 14:30 IST" and the phone-width "7 Oct, 14:30" for an ISO instant in the given zone. */
export function formatStamp(iso: string | null | undefined, tz = DEFAULT_TZ): Stamp {
  if (!iso) return { full: '—', short: '—' };
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return { full: '—', short: '—' };
  // en-IN names Asia/Kolkata "IST" (en-US only has "GMT+5:30").
  const abbr = formatInTimeZone(d, tz, 'zzz', { locale: enIN });
  // Runtimes without zone names return "GMT+5:30"; show the offset instead.
  const zone = /^(GMT|UTC)/.test(abbr) ? `UTC${formatInTimeZone(d, tz, 'xxx')}` : abbr;
  return { full: `${formatDateTime(d, tz)} ${zone}`, short: formatInTimeZone(d, tz, 'd MMM, HH:mm') };
}

/** "14:30:05" for an epoch ms (the "Updated …" caption next to an auto-refresh toggle). */
export function formatClock(epochMs: number, tz = DEFAULT_TZ): string {
  if (!epochMs || Number.isNaN(epochMs)) return '—';
  return formatInTimeZone(new Date(epochMs), tz, 'HH:mm:ss');
}
