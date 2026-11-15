import { formatShare, parseShareInput } from '@/lib/share';

/* Pure arithmetic behind the editor's live total and the 100 % guard (§6: total = 100 ± 0.01). */

export { formatShare };

export const SHARE_TOLERANCE = 0.01;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** "" → 0; a number 0–100 with up to two decimals → that number; anything else → null (invalid; `parseShareInput` says why). */
export function parseShare(input: string): number | null {
  return parseShareInput(input).value;
}

export function sumShares(values: (number | null)[]): number {
  return round2(values.reduce<number>((sum, v) => sum + (v ?? 0), 0));
}

export type TotalFit = { ok: boolean; diff: number };

/** `diff` > 0 over 100, < 0 short; `ok` within the tolerance. */
export function totalFit(total: number): TotalFit {
  const diff = round2(total - 100);
  return { ok: Math.abs(diff) <= SHARE_TOLERANCE, diff };
}

/** "Totals 100 %" · "4 % over 100" · "4.5 % short of 100". */
export function describeTotal(total: number): string {
  const { ok, diff } = totalFit(total);
  if (ok) return 'Totals 100\u00a0%';
  const abs = Math.abs(diff);
  return `${formatShare(abs)} ${diff > 0 ? 'over' : 'short of'} 100`;
}

