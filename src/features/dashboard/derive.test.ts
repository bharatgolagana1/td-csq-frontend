import { describe, expect, it } from 'vitest';

import { OPERATOR_REPORT, OPERATOR_REPORT_SUPPRESSED } from '@/api/reports.fixtures';

import { answersTotal, feedbackSegments, heroCounts, heroDelta, levelRows, overallSeries, pairedRows, parameterCount } from './derive';

describe('dashboard derive', () => {
  it('shapes overall / this cycle / previous cycle into two series', () => {
    const { categories, series, note } = overallSeries(OPERATOR_REPORT);
    expect(categories).toEqual(['Overall', 'This cycle', 'Previous cycle']);
    expect(series.map((s) => s.key)).toEqual(['customer', 'self']);
    expect(series[0]?.values).toEqual([4.15, 4.15, 3.85]);
    expect(series[1]?.values).toEqual([4.4, 4.4, 4.3]);
    // The API's overall is the selected cycle's figure: say so rather than imply an all-cycles figure.
    expect(note).toBe('Overall = this cycle until more cycles are scored · this cycle CSQ 2026 H1 · previous CSQ 2025 H2');
  });

  it('captions a genuine all-cycles overall plainly and notes a missing previous cycle', () => {
    const allCycles = { ...OPERATOR_REPORT, overall: { ...OPERATOR_REPORT.overall, customer: { mean: 4.02, n: 245 } } };
    expect(overallSeries(allCycles).note).toBe('This cycle CSQ 2026 H1 · previous CSQ 2025 H2');
    const { series, note } = overallSeries(OPERATOR_REPORT_SUPPRESSED);
    expect(series[0]?.values[2]).toBeNull();
    expect(note).toMatch(/no previous scored cycle/);
  });

  it('computes the hero delta and the assessment counts', () => {
    expect(heroDelta(OPERATOR_REPORT)).toBe(0.3);
    expect(heroDelta(OPERATOR_REPORT_SUPPRESSED)).toBeNull();
    expect(heroCounts(OPERATOR_REPORT)).toBe('129 assessments · 1 self · 128 customer');
    // Older payloads without `assessments`: the customer count and the self mean.
    const { assessments: _counts, ...legacy } = OPERATOR_REPORT;
    expect(heroCounts(legacy)).toBe('128 assessments · self 4.4 · 128 customer');
  });

  it('folds unknown ratings into NA and totals the answers', () => {
    const segments = feedbackSegments([
      { rating: 5, label: 'Excellent', count: 10, pct: 50 },
      { rating: 7, label: 'Odd', count: 10, pct: 50 },
    ]);
    expect(segments.map((s) => s.rating)).toEqual([5, null]);
    expect(answersTotal(OPERATOR_REPORT.feedbackDistribution)).toBe(3250);
  });

  it('flattens the 23 parameters with their category and shapes the paired bars', () => {
    expect(parameterCount(OPERATOR_REPORT.categories)).toBe(23);
    const subs = levelRows(OPERATOR_REPORT.categories, 'subcategories');
    expect(subs).toHaveLength(23);
    expect(subs[0]).toMatchObject({ code: 'INF-1', parent: 'Infrastructure & facilities' });
    const cats = levelRows(OPERATOR_REPORT.categories, 'categories');
    expect(cats).toHaveLength(6);

    const bars = pairedRows(cats);
    expect(bars[0]).toMatchObject({ id: 'cat-INF', label: 'Infrastructure & facilities', current: 4.12, previous: 3.9, delta: 0.22, self: 4.6, n: 128, suppressed: false });
    expect(bars[0]).not.toHaveProperty('sublabel');
    expect(bars[5]).toMatchObject({ id: 'cat-DIG', previous: null, delta: null });
    expect(pairedRows(subs)[0]?.sublabel).toBe('Infrastructure & facilities');
    expect(pairedRows(levelRows(OPERATOR_REPORT_SUPPRESSED.categories, 'categories'))[0]?.suppressed).toBe(true);
  });
});
