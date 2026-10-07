import { describe, expect, it } from 'vitest';

import { describeShareFit, projectedTotal, shareFit } from './shareProjection';

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
    expect(describeShareFit(100)).toBe('Totals 100 %');
    expect(describeShareFit(110)).toBe('10 % over 100');
    expect(describeShareFit(95.5)).toBe('4.5 % short of 100');
  });
});
