import { describe, expect, it } from 'vitest';

import { CYCLE_OPTIONS } from './reports.fixtures';
import { cycleSelectOptions, deltaOf, exportFileName, reportableCycles, resolveReportSelection, surveyTypesOf } from './reports';

describe('reports selection helpers', () => {
  it('orders scored cycles before live ones and drops drafts', () => {
    const rows = [...CYCLE_OPTIONS, { id: 'd', code: 'D', name: 'Draft', type: 'BOTH' as const, status: 'DRAFT' }];
    expect(reportableCycles(rows).map((c) => c.id)).toEqual(['c-26h1', 'c-25h2', 'c-26h2']);
    expect(cycleSelectOptions(rows).map((o) => o.label)).toEqual(['CSQ 2026 H1', 'CSQ 2025 H2', 'CSQ 2026 H2 · provisional']);
  });

  it('resolves the newest scored cycle by default and honours a valid request', () => {
    const byDefault = resolveReportSelection(CYCLE_OPTIONS, {});
    expect(byDefault.cycle?.id).toBe('c-26h1');
    expect(byDefault.surveyType).toBe('DOMESTIC');
    expect(byDefault.surveyTypes).toEqual(['DOMESTIC', 'INTERNATIONAL']);
    expect(byDefault.provisional).toBe(false);

    const live = resolveReportSelection(CYCLE_OPTIONS, { cycleId: 'c-26h2', surveyType: 'INTERNATIONAL' });
    expect(live.cycle?.id).toBe('c-26h2');
    expect(live.surveyType).toBe('INTERNATIONAL');
    expect(live.provisional).toBe(true);

    const unknown = resolveReportSelection(CYCLE_OPTIONS, { cycleId: 'nope', surveyType: 'CARGO' });
    expect(unknown.cycle?.id).toBe('c-26h1');
    expect(unknown.surveyType).toBe('DOMESTIC');

    expect(resolveReportSelection([], {}).cycle).toBeNull();
  });

  it('exposes the survey types a cycle offers', () => {
    expect(surveyTypesOf('DOMESTIC')).toEqual(['DOMESTIC']);
    expect(surveyTypesOf(undefined)).toEqual([]);
  });

  it('computes deltas to 2 dp and only when both sides are known', () => {
    expect(deltaOf(4.15, 3.85)).toBe(0.3);
    expect(deltaOf(3.5, 3.52)).toBe(-0.02);
    expect(deltaOf(null, 3)).toBeNull();
    expect(deltaOf(3, undefined)).toBeNull();
  });

  it('names export files from the query', () => {
    expect(exportFileName({ scope: 'operator', cycleId: 'c1', surveyType: 'DOMESTIC' }, 'CSQ-26H1')).toBe('csq-operator-CSQ-26H1-domestic.csv');
    expect(exportFileName({ scope: 'national' })).toBe('csq-national-current.csv');
  });
});
