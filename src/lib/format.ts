import { differenceInSeconds, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const DEFAULT_TZ = 'Asia/Kolkata';

/** Numbers to one decimal place (ratings), "—" when missing. */
export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

export function formatPct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)} %`;
}

/** ISO instant → "7 Oct 2026, 14:30" in the cycle's time zone. */
export function formatDateTime(iso: string | Date | null | undefined, tz = DEFAULT_TZ): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return formatInTimeZone(d, tz, 'd MMM yyyy, HH:mm');
}

export function formatDate(iso: string | Date | null | undefined, tz = DEFAULT_TZ): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return formatInTimeZone(d, tz, 'd MMM yyyy');
}

/** "in 3 days" / "2 hours ago" style relative time. */
export function formatRelative(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

/** Deadline countdown "3d 04h" / "11h 20m" / "Closed". */
export function formatCountdown(iso: string | Date | null | undefined, now = new Date()): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  const total = differenceInSeconds(d, now);
  if (Number.isNaN(total)) return '—';
  if (total <= 0) return 'Closed';
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
}

/** "Asia/Kolkata" → "IST (UTC+05:30)". Falls back to the zone name. */
export function describeTimeZone(tz: string, at = new Date()): string {
  try {
    const abbr = formatInTimeZone(at, tz, 'zzz');
    const offset = formatInTimeZone(at, tz, 'xxx');
    // Runtimes without zone names return "GMT+5:30"; avoid "GMT+5:30 (UTC+05:30)".
    if (/^(GMT|UTC)/.test(abbr)) return `UTC${offset}`;
    return `${abbr} (UTC${offset})`;
  } catch {
    return tz;
  }
}

const ACRONYMS = new Set(['aco', 'acfi', 'ff', 'cb', 'na', 'otp', 'csq', 'cto', 'rbac', 'csv']);

/** SUPER_ADMIN → "Super admin"; ACO_ADMIN → "ACO admin"; ASSESSMENT_OPEN → "Assessment open". */
export function humanise(code: string | null | undefined): string {
  if (!code) return '';
  const words = code
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w));
  const first = words[0];
  if (!first) return '';
  return [ACRONYMS.has(first.toLowerCase()) ? first : first.charAt(0).toUpperCase() + first.slice(1), ...words.slice(1)].join(' ');
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}
