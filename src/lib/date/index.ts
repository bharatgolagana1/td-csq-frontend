/**
 * Pure calendar-date helpers on ISO strings (`YYYY-MM-DD`), no date library.
 * A calendar date has no time zone; arithmetic runs on UTC midnights so DST
 * never shifts a day. Months are 1-based everywhere in this module.
 */

/** Calendar date as `YYYY-MM-DD`. */
export type IsoDate = string;
/** Calendar month as `YYYY-MM`. */
export type YearMonth = string;
export type DateRange = { start: IsoDate | null; end: IsoDate | null };

export type GridDay = {
  iso: IsoDate;
  /** Day of month, 1–31. */
  day: number;
  /** Belongs to the previous month (fills the first row). */
  leading: boolean;
  /** Belongs to the next month (fills the last rows). */
  trailing: boolean;
  /** `leading || trailing`. */
  outside: boolean;
};

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YM_RE = /^(\d{4})-(\d{2})$/;

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export function toIso(year: number, month: number, day: number): IsoDate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function ym(year: number, month: number): YearMonth {
  return `${pad(year, 4)}-${pad(month)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses a strict `YYYY-MM-DD` that names a real day; `null` otherwise. */
export function parseIso(iso: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const m = ISO_RE.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isIsoDate(v: unknown): v is IsoDate {
  return typeof v === 'string' && parseIso(v) !== null;
}

export function ymParts(month: YearMonth): { year: number; month: number } {
  const m = YM_RE.exec(month);
  const year = m ? Number(m[1]) : NaN;
  const mo = m ? Number(m[2]) : NaN;
  if (!m || mo < 1 || mo > 12) throw new Error(`Invalid month: ${month}`);
  return { year, month: mo };
}

export function monthOf(iso: IsoDate): YearMonth {
  return iso.slice(0, 7);
}

function toUtc(iso: IsoDate): Date {
  const p = parseIso(iso);
  if (!p) throw new Error(`Invalid date: ${iso}`);
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}

function fromUtc(d: Date): IsoDate {
  return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

export function addMonths(month: YearMonth, n: number): YearMonth {
  const { year, month: m } = ymParts(month);
  const idx = year * 12 + (m - 1) + n;
  return ym(Math.floor(idx / 12), (((idx % 12) + 12) % 12) + 1);
}

/** Same day-of-month `n` months away, clamped to the target month's length. */
export function shiftMonths(iso: IsoDate, n: number): IsoDate {
  const p = parseIso(iso);
  if (!p) throw new Error(`Invalid date: ${iso}`);
  const target = ymParts(addMonths(ym(p.year, p.month), n));
  return toIso(target.year, target.month, Math.min(p.day, daysInMonth(target.year, target.month)));
}

export function startOfMonth(iso: IsoDate): IsoDate {
  return `${monthOf(iso)}-01`;
}

export function endOfMonth(iso: IsoDate): IsoDate {
  const { year, month } = ymParts(monthOf(iso));
  return toIso(year, month, daysInMonth(year, month));
}

/** Monday = 0 … Sunday = 6. */
export function weekdayMon0(iso: IsoDate): number {
  return (toUtc(iso).getUTCDay() + 6) % 7;
}

export function isSameDay(a: IsoDate | null | undefined, b: IsoDate | null | undefined): boolean {
  return Boolean(a) && a === b;
}

export function isSameMonth(a: IsoDate | null | undefined, month: YearMonth): boolean {
  return Boolean(a) && monthOf(a as IsoDate) === month;
}

/** ISO dates compare lexically. Negative when `a` is earlier. */
export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Inclusive, order-agnostic. */
export function isBetween(iso: IsoDate, a: IsoDate, b: IsoDate): boolean {
  const [lo, hi] = sortPair(a, b);
  return iso >= lo && iso <= hi;
}

export function sortPair(a: IsoDate, b: IsoDate): [IsoDate, IsoDate] {
  return a <= b ? [a, b] : [b, a];
}

export function clampIso(iso: IsoDate, min?: IsoDate | null, max?: IsoDate | null): IsoDate {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

/**
 * Six rows of seven days, Monday first, with the days of the neighbouring
 * months flagged so a grid always has the same height.
 */
export function monthGrid(year: number, month: number): GridDay[][] {
  const first = toIso(year, month, 1);
  const start = addDays(first, -weekdayMon0(first));
  const prefix = ym(year, month);
  const rows: GridDay[][] = [];
  let cursor = start;
  for (let r = 0; r < 6; r += 1) {
    const row: GridDay[] = [];
    for (let c = 0; c < 7; c += 1) {
      const leading = cursor < first;
      const trailing = !leading && monthOf(cursor) !== prefix;
      row.push({ iso: cursor, day: Number(cursor.slice(8, 10)), leading, trailing, outside: leading || trailing });
      cursor = addDays(cursor, 1);
    }
    rows.push(row);
  }
  return rows;
}

const DEFAULT_LOCALE = 'en-IN';

function fmt(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
  } catch {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, { ...options, timeZone: 'UTC' });
  }
}

/** `2025-10-08` → "8 Oct 2025" (en-IN). Empty string when invalid. */
export function formatDisplay(iso: IsoDate | null | undefined, locale = DEFAULT_LOCALE): string {
  if (!iso || !parseIso(iso)) return '';
  return fmt(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(toUtc(iso));
}

/** `2025-10` → "October 2025". */
export function formatMonth(month: YearMonth, locale = DEFAULT_LOCALE): string {
  const { year, month: m } = ymParts(month);
  return fmt(locale, { month: 'long', year: 'numeric' }).format(new Date(Date.UTC(year, m - 1, 1)));
}

/** "8 Oct 2025 – 14 Oct 2025"; a half range shows "8 Oct 2025 – …". */
export function formatRangeDisplay(range: DateRange, locale = DEFAULT_LOCALE): string {
  if (!range.start && !range.end) return '';
  const a = formatDisplay(range.start, locale) || '…';
  const b = formatDisplay(range.end, locale) || '…';
  return `${a} – ${b}`;
}

/** Twelve month names, January first. */
export function monthNames(locale = DEFAULT_LOCALE, style: 'long' | 'short' = 'long'): string[] {
  const f = fmt(locale, { month: style });
  return Array.from({ length: 12 }, (_, i) => f.format(new Date(Date.UTC(2000, i, 1))));
}

/** Weekday names Monday first. */
export function weekdayNames(locale = DEFAULT_LOCALE, style: 'long' | 'short' | 'narrow' = 'short'): string[] {
  const f = fmt(locale, { weekday: style });
  // 2024-01-01 is a Monday.
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 1 + i))));
}

/**
 * Lenient parse of what a person types: `2025-10-08`, `8 Oct 2025`,
 * `8 October 2025`, `08/10/2025`, `8-10-2025`, `8.10.2025` (day first).
 */
export function parseDisplay(text: string, locale = DEFAULT_LOCALE): IsoDate | null {
  const t = text.trim();
  if (!t) return null;
  if (ISO_RE.test(t)) return parseIso(t) ? t : null;

  const numeric = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (numeric) {
    const iso = toIso(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]));
    return parseIso(iso) ? iso : null;
  }

  const worded = /^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/.exec(t);
  if (worded) {
    const name = (worded[2] ?? '').toLowerCase();
    const index = [...monthNames(locale, 'long'), ...monthNames('en-IN', 'long')].findIndex(
      (n) => n.toLowerCase() === name || n.toLowerCase().slice(0, 3) === name.slice(0, 3),
    );
    if (index === -1) return null;
    const iso = toIso(Number(worded[3]), (index % 12) + 1, Number(worded[1]));
    return parseIso(iso) ? iso : null;
  }
  return null;
}

/** The wall date in `tz` right now (or at `now`), via Intl. Falls back to the local date for an unknown zone. */
export function todayIso(tz?: string, now: Date = new Date()): IsoDate {
  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
      const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
      const iso = toIso(get('year'), get('month'), get('day'));
      if (parseIso(iso)) return iso;
    } catch {
      /* unknown zone: fall through to the local date */
    }
  }
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
