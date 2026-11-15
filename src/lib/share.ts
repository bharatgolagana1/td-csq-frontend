/* Market shares as people type and read them (backend §6: each 0–100 with up
   to two decimals; an airport's set totals 100 ± 0.01). One formatter, so a
   requested 12.5 % never reads "13 %" on one screen and "12.5 %" on another. */

/** Up to two decimals, as entered: 55 → "55 %", 12.5 → "12.5 %", 33.333 → "33.33 %" (a no-break space, so "%" never wraps alone). */
export function formatShare(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${Number(value.toFixed(2))}\u00a0%`;
}

export type ParsedShare = { value: number; error: null } | { value: null; error: string };

/** A share field's text: blank counts as 0; otherwise a plain number from 0 to 100 with up to two decimals — or why it is not one, for the field. */
export function parseShareInput(input: string): ParsedShare {
  const text = input.trim();
  if (text === '') return { value: 0, error: null };
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(text)) return { value: null, error: 'Enter a number, e.g. 12.5' };
  const n = Number(text);
  if (n < 0) return { value: null, error: 'A share can’t be negative' };
  if (n > 100) return { value: null, error: 'At most 100' };
  if (/\.\d{3,}$/.test(text)) return { value: null, error: 'Up to two decimals' };
  return { value: n === 0 ? 0 : n, error: null };
}
