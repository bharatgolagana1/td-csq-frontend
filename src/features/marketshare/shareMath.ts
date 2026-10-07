/* Pure arithmetic behind the editor's live total and the 100 % guard (§6: total = 100 ± 0.01). */

export const SHARE_TOLERANCE = 0.01;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** "" → 0; a number 0–100 → that number; anything else → null (invalid). */
export function parseShare(input: string): number | null {
  const text = input.trim();
  if (text === '') return 0;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const n = Number(text);
  return n >= 0 && n <= 100 ? n : null;
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
  if (ok) return 'Totals 100 %';
  const abs = Math.abs(diff);
  return `${formatShare(abs)} ${diff > 0 ? 'over' : 'short of'} 100`;
}

/** Integers plain, otherwise up to two decimals: 55 → "55 %", 12.5 → "12.5 %". */
export function formatShare(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '')} %`;
}
