import { formatShare, parseShareInput } from '@/lib/share';

/* Pure helpers for the "after approval" market-share preview (§7 Onboarding). */

export { formatShare };

/** The API accepts a total of 100 ± 0.01. */
export const SHARE_TOLERANCE = 0.01;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** The airport's total once this registration is approved with `requested` (null/undefined = no share). */
export function projectedTotal(currentTotal: number, requested: number | null | undefined): number {
  return round2(currentTotal + (requested ?? 0));
}

export type ShareFit = { ok: boolean; diff: number };

/** How far a total is from 100: `diff` > 0 over, < 0 short. */
export function shareFit(total: number): ShareFit {
  const diff = round2(total - 100);
  return { ok: Math.abs(diff) <= SHARE_TOLERANCE, diff };
}

/** "Totals 100 %" · "4 % over 100" · "4 % short of 100". */
export function describeShareFit(total: number): string {
  const { ok, diff } = shareFit(total);
  if (ok) return 'Totals 100\u00a0%';
  const text = formatShare(Math.abs(diff));
  return diff > 0 ? `${text} over 100` : `${text} short of 100`;
}

/** "" → 0; a number 0–100 with up to two decimals → that number; anything else → null (invalid; `parseShareInput` says why). */
export function parseShare(input: string): number | null {
  return parseShareInput(input).value;
}

/**
 * The other operators' shares scaled to fill `room` (100 − the new operator's
 * share): proportional to what they hold, equal when they all hold 0, to two
 * decimals with the rounding drift on the largest, so the result sums to
 * `room` exactly.
 */
export function scaleToFit(values: readonly number[], room: number): number[] {
  if (values.length === 0) return [];
  const target = Math.max(0, round2(room));
  const base = values.reduce((sum, v) => sum + v, 0);
  const scaled = values.map((v) => round2(base > 0 ? (v * target) / base : target / values.length));
  const drift = round2(target - scaled.reduce((sum, v) => sum + v, 0));
  const largest = scaled.indexOf(Math.max(...scaled));
  scaled[largest] = round2((scaled[largest] ?? 0) + drift);
  return scaled;
}
