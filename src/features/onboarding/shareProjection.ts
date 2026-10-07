/* Pure helpers for the "after approval" market-share preview (§7 Onboarding). */

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
  if (ok) return 'Totals 100 %';
  const abs = Math.abs(diff);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(2).replace(/0+$/, '');
  return diff > 0 ? `${text} % over 100` : `${text} % short of 100`;
}
