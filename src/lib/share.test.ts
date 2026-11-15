import { describe, expect, it } from 'vitest';

import { formatShare, parseShareInput } from './share';

describe('formatShare', () => {
  it('keeps up to two decimals, never rounding a share to a whole number', () => {
    expect(formatShare(12.5)).toBe('12.5\u00a0%');
    expect(formatShare(55)).toBe('55\u00a0%');
    expect(formatShare(33.333)).toBe('33.33\u00a0%');
    expect(formatShare(99.999)).toBe('100\u00a0%');
    expect(formatShare(0)).toBe('0\u00a0%');
    expect(formatShare(null)).toBe('—');
    expect(formatShare(undefined)).toBe('—');
    expect(formatShare(Number.NaN)).toBe('—');
  });
});

describe('parseShareInput', () => {
  it('accepts blank (0) and plain numbers from 0 to 100 with up to two decimals', () => {
    expect(parseShareInput('')).toEqual({ value: 0, error: null });
    expect(parseShareInput(' 12.5 ')).toEqual({ value: 12.5, error: null });
    expect(parseShareInput('100')).toEqual({ value: 100, error: null });
    expect(parseShareInput('.5')).toEqual({ value: 0.5, error: null });
    expect(parseShareInput('-0')).toEqual({ value: 0, error: null });
  });

  it('says why anything else is not a share: non-numeric, negative, above 100, too precise', () => {
    expect(parseShareInput('abc')).toEqual({ value: null, error: 'Enter a number, e.g. 12.5' });
    expect(parseShareInput('12,5')).toEqual({ value: null, error: 'Enter a number, e.g. 12.5' });
    expect(parseShareInput('1e2')).toEqual({ value: null, error: 'Enter a number, e.g. 12.5' });
    expect(parseShareInput('0x10')).toEqual({ value: null, error: 'Enter a number, e.g. 12.5' });
    expect(parseShareInput('-5')).toEqual({ value: null, error: 'A share can’t be negative' });
    expect(parseShareInput('150')).toEqual({ value: null, error: 'At most 100' });
    expect(parseShareInput('12.345')).toEqual({ value: null, error: 'Up to two decimals' });
  });
});
