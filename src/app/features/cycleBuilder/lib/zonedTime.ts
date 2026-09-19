import type { ZonedDateTime } from '../api/cycleBuilder.types';

/**
 * Wall clock to instant and back, in an explicit IANA zone, using Intl only.
 * No date library is installed and this is the whole of what the builder needs.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

interface ZoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function partsInZone(utcMs: number, timeZone: string): ZoneParts {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const out: ZoneParts = { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
  for (const part of dtf.formatToParts(new Date(utcMs))) {
    const value = Number(part.value);
    switch (part.type) {
      case 'year': out.year = value; break;
      case 'month': out.month = value; break;
      case 'day': out.day = value; break;
      // some engines render midnight as hour 24 of the same date under hour12: false
      case 'hour': out.hour = value % 24; break;
      case 'minute': out.minute = value; break;
      case 'second': out.second = value; break;
      default: break;
    }
  }
  return out;
}

export function isValidZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** How far ahead of UTC `timeZone` is at that instant, in milliseconds. */
export function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const p = partsInZone(utcMs, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isComplete(z: ZonedDateTime): boolean {
  return DATE_RE.test(z.date) && TIME_RE.test(z.time) && isValidZone(z.timeZone);
}

/** The instant a wall clock reading names, or null when it names none. */
export function toInstant(z: ZonedDateTime): number | null {
  const d = DATE_RE.exec(z.date);
  const t = TIME_RE.exec(z.time);
  if (!d || !t || !isValidZone(z.timeZone)) return null;

  const year = Number(d[1]);
  const month = Number(d[2]);
  const day = Number(d[3]);
  const hour = Number(t[1]);
  const minute = Number(t[2]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59) return null;

  const naive = Date.UTC(year, month - 1, day, hour, minute);
  // the offset that applies is the one in force at the real instant, which a
  // single pass can only approximate across a daylight saving change
  const firstPass = naive - zoneOffsetMs(naive, z.timeZone);
  return naive - zoneOffsetMs(firstPass, z.timeZone);
}

export function fromInstant(utcMs: number, timeZone: string): ZonedDateTime {
  const p = partsInZone(utcMs, timeZone);
  return {
    date: `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
    timeZone,
  };
}

/** Move a wall clock reading to another zone, keeping the instant it names. */
export function withZone(z: ZonedDateTime, timeZone: string): ZonedDateTime {
  return { ...z, timeZone };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Formatted from the typed reading itself. Handing the string to `new Date()`
 * and letting the browser localise it would shift the day for any viewer west
 * of Greenwich, which is exactly the class of error this screen exists to stop.
 */
export function formatWallDate(z: ZonedDateTime, withWeekday = true): string {
  const d = DATE_RE.exec(z.date);
  if (!d) return 'no date';
  const year = Number(d[1]);
  const month = Number(d[2]);
  const day = Number(d[3]);
  const stem = `${pad(day)} ${MONTHS[month - 1] ?? '???'} ${year}`;
  if (!withWeekday) return stem;
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${stem}`;
}

export function formatWallDateTime(z: ZonedDateTime, withWeekday = true): string {
  if (!isComplete(z)) return 'not set';
  return `${formatWallDate(z, withWeekday)}, ${z.time}`;
}

/** Short form for axis ticks and dense rows: "05 Oct". */
export function formatShortDate(z: ZonedDateTime): string {
  const d = DATE_RE.exec(z.date);
  if (!d) return '';
  return `${pad(Number(d[3]))} ${MONTHS[Number(d[2]) - 1] ?? ''}`;
}

export function formatOffset(utcMs: number, timeZone: string): string {
  const minutes = Math.round(zoneOffsetMs(utcMs, timeZone) / MINUTE);
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** The same moment stated in UTC, so two zones can be compared by eye. */
export function formatUtcInstant(utcMs: number): string {
  const z = fromInstant(utcMs, 'UTC');
  return `${formatWallDate(z, false)}, ${z.time} UTC`;
}

export function durationText(fromMs: number, toMs: number): string {
  const total = toMs - fromMs;
  if (total <= 0) return 'no time at all';
  const days = Math.floor(total / DAY);
  const hours = Math.floor((total % DAY) / HOUR);
  if (days === 0 && hours === 0) return 'under an hour';
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export const MS = { MINUTE, HOUR, DAY };
