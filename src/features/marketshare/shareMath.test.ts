import { describe, expect, it } from 'vitest';

import { describeTotal, formatShare, parseShare, sumShares, totalFit } from './shareMath';

describe('shareMath', () => {
  it('parses inputs: blank is 0, out of range or junk is invalid', () => {
    expect(parseShare('')).toBe(0);
    expect(parseShare(' 55 ')).toBe(55);
    expect(parseShare('12.5')).toBe(12.5);
    expect(parseShare('100')).toBe(100);
    expect(parseShare('101')).toBeNull();
    expect(parseShare('-1')).toBeNull();
    expect(parseShare('abc')).toBeNull();
    expect(parseShare('1.234')).toBeNull();
  });

  it('sums to two decimals and treats invalid rows as 0', () => {
    expect(sumShares([33.33, 33.33, 33.34])).toBe(100);
    expect(sumShares([0.1, 0.2])).toBe(0.3);
    expect(sumShares([50, null])).toBe(50);
  });

  it('guards the 100 % total within the API tolerance', () => {
    expect(totalFit(100)).toEqual({ ok: true, diff: 0 });
    expect(totalFit(99.99).ok).toBe(true);
    expect(totalFit(100.01).ok).toBe(true);
    expect(totalFit(100.02).ok).toBe(false);
    expect(totalFit(96)).toEqual({ ok: false, diff: -4 });
    expect(totalFit(104.5)).toEqual({ ok: false, diff: 4.5 });
  });

  it('describes and formats totals', () => {
    expect(describeTotal(100)).toBe('Totals 100 %');
    expect(describeTotal(96)).toBe('4 % short of 100');
    expect(describeTotal(104.5)).toBe('4.5 % over 100');
    expect(formatShare(55)).toBe('55 %');
    expect(formatShare(12.5)).toBe('12.5 %');
    expect(formatShare(null)).toBe('—');
  });
});
