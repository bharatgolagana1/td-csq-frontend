import { fromZonedTime } from 'date-fns-tz';

import { type ReminderPlan } from '@/api/types';
import { type WindowInput } from '@/api/cycles.types';

/* Pure schedule helpers mirroring the backend's cycles/domain (derive.ts,
   windows.ts) so the builder can preview what the server will store.
   Wall-clock strings are 'YYYY-MM-DDTHH:mm' in the cycle's time zone; because
   the format is fixed-width they compare correctly as strings. */

export const WALL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CycleWindows = { sampling: WindowInput; assessment: WindowInput };

/** True when `value` is 'YYYY-MM-DD' and names a real calendar day (mirrors the backend's isCalendarDate). */
export function isCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y = 0, m = 0, d = 0] = value.split('-').map(Number);
  if (y < 1970 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Calendar arithmetic on 'YYYY-MM-DD', independent of any time zone. */
export function addCalendarDays(date: string, days: number): string {
  if (!isCalendarDate(date)) throw new RangeError(`Invalid calendar date "${date}"`);
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * sampling.start = initiation day 00:00 · sampling.end = + samplingDays 00:00 ·
 * assessment.start = sampling.end (midnight activation) · assessment.end = + assessmentDays 00:00.
 */
export function deriveWindows(initiationDate: string, defaults: { samplingDays: number; assessmentDays: number }): CycleWindows {
  const samplingEnd = addCalendarDays(initiationDate, Math.max(1, defaults.samplingDays));
  const assessmentEnd = addCalendarDays(samplingEnd, Math.max(1, defaults.assessmentDays));
  return {
    sampling: { start: `${initiationDate}T00:00`, end: `${samplingEnd}T00:00` },
    assessment: { start: `${samplingEnd}T00:00`, end: `${assessmentEnd}T00:00` },
  };
}

/**
 * Reminder k (1..count) fires on the window's start day + k·everyDays at `hour`
 * local; reminders at or after the window end are dropped. Wall-clock strings.
 */
export function reminderSchedule(window: WindowInput, policy: ReminderPlan, hour = 9): string[] {
  if (!WALL_RE.test(window.start) || !WALL_RE.test(window.end)) return [];
  const count = Math.max(0, Math.floor(policy.count));
  const every = Math.max(1, Math.floor(policy.everyDays));
  const startDate = window.start.slice(0, 10);
  const wallHour = String(hour).padStart(2, '0');
  const out: string[] = [];
  for (let k = 1; k <= count; k += 1) {
    const at = `${addCalendarDays(startDate, k * every)}T${wallHour}:00`;
    if (at >= window.end) break;
    out.push(at);
  }
  return out;
}

export type WindowField = 'sampling.start' | 'sampling.end' | 'assessment.start' | 'assessment.end';
export type WindowProblem = { path: WindowField; message: string };

/** Ordering rules: sampling.start < sampling.end ≤ assessment.start < assessment.end. Every violation is reported. */
export function validateWindows(w: CycleWindows): WindowProblem[] {
  const problems: WindowProblem[] = [];
  const all = [w.sampling.start, w.sampling.end, w.assessment.start, w.assessment.end];
  if (all.some((v) => !WALL_RE.test(v))) return problems; // the field-level "required" message covers it
  if (!(w.sampling.start < w.sampling.end)) problems.push({ path: 'sampling.end', message: 'Sampling must end after it starts' });
  if (!(w.assessment.start < w.assessment.end)) problems.push({ path: 'assessment.end', message: 'Assessment must end after it starts' });
  if (w.assessment.start < w.sampling.end) problems.push({ path: 'assessment.start', message: 'Assessment cannot start before sampling has ended' });
  return problems;
}

/** The server reports 'sampling' / 'assessment' for an empty window; the form highlights that window's end. */
export function serverWindowField(path: string): WindowField | null {
  const name = path.replace(/^body\./, '');
  if (name === 'sampling') return 'sampling.end';
  if (name === 'assessment') return 'assessment.end';
  if (name === 'sampling.start' || name === 'sampling.end' || name === 'assessment.start' || name === 'assessment.end') return name;
  return null;
}

/** Instant of a wall-clock value in `tz` (invalid → null). */
export function wallToDate(wall: string, tz: string): Date | null {
  if (!WALL_RE.test(wall)) return null;
  try {
    const d = fromZonedTime(wall, tz);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export type TimelineLayout = {
  /** Percent positions along the span from sampling.start to assessment.end. */
  sampling: { left: number; width: number };
  assessment: { left: number; width: number };
  /** Null when today is outside the span. */
  today: number | null;
  days: { sampling: number; assessment: number };
};

/** Positions for the two-window timeline; null when the windows are not all set or empty. */
export function timelineLayout(w: CycleWindows, tz: string, now = new Date()): TimelineLayout | null {
  const s0 = wallToDate(w.sampling.start, tz);
  const s1 = wallToDate(w.sampling.end, tz);
  const a0 = wallToDate(w.assessment.start, tz);
  const a1 = wallToDate(w.assessment.end, tz);
  if (!s0 || !s1 || !a0 || !a1) return null;
  const from = Math.min(s0.getTime(), a0.getTime());
  const to = Math.max(s1.getTime(), a1.getTime());
  const span = to - from;
  if (span <= 0) return null;
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - from) / span) * 100));
  const day = 86_400_000;
  const t = now.getTime();
  return {
    sampling: { left: pct(s0.getTime()), width: Math.max(0, pct(s1.getTime()) - pct(s0.getTime())) },
    assessment: { left: pct(a0.getTime()), width: Math.max(0, pct(a1.getTime()) - pct(a0.getTime())) },
    today: t >= from && t <= to ? pct(t) : null,
    days: { sampling: Math.round((s1.getTime() - s0.getTime()) / day), assessment: Math.round((a1.getTime() - a0.getTime()) / day) },
  };
}
