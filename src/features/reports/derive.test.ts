import { describe, expect, it } from 'vitest';

import { AIRPORT_REPORT, AIRPORT_REPORT_FOR_OPERATOR, COMPARISON_REPORT, NATIONAL_REPORT } from '@/api/reports.fixtures';

import { airportOperatorRows, comparisonBarKey, comparisonDelta, coverageCaption, nationalAirportBars, nationalOperatorRows, orderedCycles, participationFunnel, valuesInOrder } from './derive';

describe('reports derive', () => {
  it('describes market-share coverage', () => {
    expect(coverageCaption(AIRPORT_REPORT.overall)).toBe('Market share applied · 100 % of the airport’s share covered');
    expect(coverageCaption(AIRPORT_REPORT_FOR_OPERATOR.overall)).toBe('Equal weights — no market-share snapshot · 55 % of operators covered');
  });

  it('ranks the operators behind an airport, suppressed ones unranked', () => {
    const rows = airportOperatorRows([...(AIRPORT_REPORT.operators ?? []), { acoId: 'x', code: 'X', name: 'Tiny', mean: null, sharePct: 5, suppressed: true }]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, null]);
    expect(rows[0]).toMatchObject({ label: 'Cargo Service Center', extra: '55 %', rankOf: 2 });
    expect(rows[2]?.sublabel).toBe('X · suppressed');
  });

  it('shapes the national rows and the funnel', () => {
    expect(nationalAirportBars(NATIONAL_REPORT.airports)).toHaveLength(12);
    const ops = nationalOperatorRows(NATIONAL_REPORT.operators);
    expect(ops[0]).toMatchObject({ label: 'Mumbai Cargo Terminal', sublabel: 'MCT-BOM · BOM', rank: 1, extra: '141' });
    expect(ops[ops.length - 1]).toMatchObject({ rating: null, extra: '2 · suppressed' });
    expect(participationFunnel(NATIONAL_REPORT.participation).map((r) => r.value)).toEqual([1040, 880, 812]);
  });

  it('orders compared cycles earliest first and computes later − earlier', () => {
    const reversed = { ...COMPARISON_REPORT, cycles: [...COMPARISON_REPORT.cycles].reverse() };
    const order = orderedCycles(reversed);
    expect(order.map((c) => c.id)).toEqual(['c-25h2', 'c-26h1']);
    const overall = order.map((c) => COMPARISON_REPORT.overall.find((o) => o.cycleId === c.id));
    expect(comparisonDelta(overall)).toBe(0.3);

    const row = COMPARISON_REPORT.categories[2];
    expect(row?.code).toBe('PRO');
    const values = valuesInOrder(row?.values ?? [], order);
    expect(values.map((v) => v?.customer.mean)).toEqual([3.52, 3.74]);
    expect(comparisonDelta(values)).toBe(0.22);
    expect(comparisonDelta([values[0]])).toBeNull();
    expect([comparisonBarKey(0, 2), comparisonBarKey(1, 2)]).toEqual(['self', 'customer']);
  });
});
