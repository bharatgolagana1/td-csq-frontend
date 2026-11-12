import { describe, expect, it } from 'vitest';

import { comparisonDirection, cycleSelectOptions, deltaOf, exportFileName, reportableCycles, resolveReportSelection, shownDirection, surveyTypesOf } from './reports';
import { COMPARISON_REPORT, CYCLE_OPTIONS, OPERATOR_REPORT, OPERATOR_REPORT_EXPORT, OPERATOR_REPORT_IMPORT } from './reports.fixtures';

describe('reports selection helpers', () => {
  it('orders scored cycles before live ones and drops drafts', () => {
    const rows = [...CYCLE_OPTIONS, { id: 'd', code: 'D', name: 'Draft', type: 'BOTH' as const, answerMode: 'SINGLE' as const, status: 'DRAFT' }];
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

  it('shows a direction only for an IMPORT_EXPORT cycle, and the pick until its report is in', () => {
    expect(shownDirection(OPERATOR_REPORT)).toBeNull();
    expect(shownDirection(OPERATOR_REPORT, 'EXPORT')).toBeNull();
    expect(shownDirection(OPERATOR_REPORT_IMPORT)).toBe('IMPORT');
    expect(shownDirection(OPERATOR_REPORT_EXPORT, 'IMPORT')).toBe('EXPORT');
    expect(shownDirection(undefined, 'EXPORT')).toBe('EXPORT');
    expect(shownDirection(undefined)).toBeNull();

    expect(comparisonDirection(COMPARISON_REPORT)).toBeNull();
    const mixed = { ...COMPARISON_REPORT, cycles: COMPARISON_REPORT.cycles.map((c, i) => (i === 1 ? { ...c, answerMode: 'IMPORT_EXPORT' as const, direction: 'EXPORT' as const } : c)) };
    expect(comparisonDirection(mixed)).toBe('EXPORT');
  });

  it('names export files from the query', () => {
    expect(exportFileName({ scope: 'operator', cycleId: 'c1', surveyType: 'DOMESTIC' }, 'CSQ-26H1')).toBe('csq-operator-CSQ-26H1-domestic.csv');
    expect(exportFileName({ scope: 'national' })).toBe('csq-national-current.csv');
    expect(exportFileName({ scope: 'operator', cycleId: 'c1', surveyType: 'DOMESTIC', direction: 'IMPORT' })).toBe('csq-operator-c1-domestic-import.csv');
    expect(exportFileName({ scope: 'operator', cycleId: 'c1', surveyType: 'DOMESTIC', direction: 'EXPORT' })).toBe('csq-operator-c1-domestic-export.csv');
  });
});
