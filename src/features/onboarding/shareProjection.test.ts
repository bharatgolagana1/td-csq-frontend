import { describe, expect, it } from 'vitest';

import { describeShareFit, formatShare, parseShare, projectedTotal, scaleToFit, shareFit } from './shareProjection';

describe('shareProjection', () => {
  it('adds the requested share to the current total, to two decimals', () => {
    expect(projectedTotal(90, 10)).toBe(100);
    expect(projectedTotal(33.333, 33.333)).toBe(66.67);
    expect(projectedTotal(100, null)).toBe(100);
    expect(projectedTotal(100, undefined)).toBe(100);
  });

  it('accepts 100 within the API tolerance only', () => {
    expect(shareFit(100)).toEqual({ ok: true, diff: 0 });
    expect(shareFit(100.01).ok).toBe(true);
    expect(shareFit(99.99).ok).toBe(true);
    expect(shareFit(100.02)).toEqual({ ok: false, diff: 0.02 });
    expect(shareFit(96)).toEqual({ ok: false, diff: -4 });
  });

  it('describes the fit for the reviewer', () => {
    expect(describeShareFit(100)).toBe('Totals 100\u00a0%');
    expect(describeShareFit(110)).toBe('10\u00a0% over 100');
    expect(describeShareFit(95.5)).toBe('4.5\u00a0% short of 100');
  });

  it('parses what the reviewer types: blank is 0, at most two decimals, never above 100', () => {
    expect(parseShare('')).toBe(0);
    expect(parseShare(' 12.5 ')).toBe(12.5);
    expect(parseShare('100')).toBe(100);
    expect(parseShare('100.5')).toBeNull();
    expect(parseShare('1.234')).toBeNull();
    expect(parseShare('-3')).toBeNull();
    expect(parseShare('abc')).toBeNull();
    expect(formatShare(49.5)).toBe('49.5\u00a0%');
    expect(formatShare(100)).toBe('100\u00a0%');
  });

  it('scales the others into the room the new operator leaves, summing to it exactly', () => {
    expect(scaleToFit([55, 45], 90)).toEqual([49.5, 40.5]);
    // Thirds: the rounding drift lands on the largest so the set still sums to the room.
    const thirds = scaleToFit([1, 1, 1], 100);
    expect(thirds.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 10);
    expect(thirds).toEqual([33.34, 33.33, 33.33]);
    // Nobody holds anything yet: split evenly.
    expect(scaleToFit([0, 0], 60)).toEqual([30, 30]);
    expect(scaleToFit([60, 40], 0)).toEqual([0, 0]);
    expect(scaleToFit([], 50)).toEqual([]);
  });
});
