import { describe, expect, it } from 'vitest';

import { type Customer } from './customers.types';
import { applySelectionChange, eligibleEntries, eligibleSurveyTypes, evaluateLock, normaliseCurrent, selectionKey } from './sampling';
import { type SelectionState } from './sampling.types';

const customer = (id: string, surveyType: Customer['surveyType'], status: Customer['status'] = 'ACTIVE'): Customer => ({
  id,
  acoId: 'org',
  airportId: 'ap',
  name: id,
  contactPerson: id,
  email: `${id}@example.com`,
  phone: '+919876543210',
  type: 'FF',
  surveyType,
  status,
  tags: [],
  lastSampledCycleId: null,
  importBatchId: null,
  createdAt: '',
  updatedAt: '',
});

describe('evaluateLock (mirror of the backend lock gate)', () => {
  it('refuses with nothing selected', () => {
    expect(evaluateLock({ required: 50, selectedCount: 0, eligibleCount: 120 })).toMatchObject({ lockable: false, reason: 'NOTHING_SELECTED', remaining: 50, target: 50, progress: '0 / 50', progressPct: 0 });
  });
  it('refuses below the minimum', () => {
    expect(evaluateLock({ required: 50, selectedCount: 37, eligibleCount: 120 })).toMatchObject({ lockable: false, reason: 'BELOW_MINIMUM', shortfallRule: null, remaining: 13, progressPct: 74 });
  });
  it('allows at or above the minimum', () => {
    expect(evaluateLock({ required: 50, selectedCount: 50, eligibleCount: 120 })).toMatchObject({ lockable: true, reason: null, remaining: 0, progressPct: 100 });
    expect(evaluateLock({ required: 50, selectedCount: 61, eligibleCount: 120 })).toMatchObject({ lockable: true, progress: '61 / 50', progressPct: 100 });
  });
  it('under a shortfall, allows only when everything eligible is selected', () => {
    expect(evaluateLock({ required: 50, selectedCount: 10, eligibleCount: 42 })).toMatchObject({ lockable: false, reason: 'SELECT_ALL_REQUIRED', shortfallRule: 'SELECT_ALL', target: 42, remaining: 32, progress: '10 / 50', progressPct: 24 });
    expect(evaluateLock({ required: 50, selectedCount: 42, eligibleCount: 42 })).toMatchObject({ lockable: true, reason: null, shortfallRule: 'SELECT_ALL', remaining: 0, progressPct: 100 });
  });
});

describe('eligibility', () => {
  it('expands BOTH customers into one entry per survey type the cycle and participant cover', () => {
    expect(eligibleSurveyTypes('BOTH', 'BOTH')).toEqual(['DOMESTIC', 'INTERNATIONAL']);
    expect(eligibleSurveyTypes('BOTH', 'DOMESTIC')).toEqual(['DOMESTIC']);
    expect(eligibleSurveyTypes('INTERNATIONAL', 'DOMESTIC')).toEqual([]);
    expect(eligibleSurveyTypes('BOTH', 'BOTH', ['DOMESTIC'])).toEqual(['DOMESTIC']);
    const entries = eligibleEntries([customer('a', 'BOTH'), customer('b', 'INTERNATIONAL'), customer('c', 'DOMESTIC', 'INACTIVE')], 'BOTH');
    expect(entries.map((e) => e.key)).toEqual(['a:DOMESTIC', 'a:INTERNATIONAL', 'b:INTERNATIONAL']);
  });
});

describe('applySelectionChange (optimistic update)', () => {
  const base: SelectionState = {
    cycle: { id: 'cy', code: 'C', name: 'Cycle', type: 'BOTH', status: 'SAMPLING_OPEN', samplingStart: null, samplingEnd: null },
    participant: { cycleId: 'cy', acoId: 'org', airportId: null, surveyTypes: ['DOMESTIC', 'INTERNATIONAL'], requiredSampleSize: 3, sampling: { status: 'IN_PROGRESS', selectedCount: 2, lockedAt: null, lockedBy: null, lockedByUser: null, unlockedAt: null, unlockedBy: null, unlockedByUser: null, unlockReason: null } },
    required: 3,
    selectedCount: 2,
    eligibleCount: 10,
    lockable: false,
    reason: 'BELOW_MINIMUM',
    shortfallRule: null,
    remaining: 1,
    target: 3,
    progress: '2 / 3',
    progressPct: 67,
    editable: true,
    selection: [
      { id: 's1', customerId: 'a', customer: null, surveyType: 'DOMESTIC', state: 'SELECTED', addedAt: '', addedBy: null },
      { id: 's2', customerId: 'a', customer: null, surveyType: 'INTERNATIONAL', state: 'SELECTED', addedAt: '', addedBy: null },
    ],
  };

  it('adds, removes, ignores duplicates and re-evaluates the gate', () => {
    const next = applySelectionChange(base, { add: [{ customerId: 'b', surveyType: 'DOMESTIC' }, { customerId: 'a', surveyType: 'DOMESTIC' }], remove: [{ customerId: 'a', surveyType: 'INTERNATIONAL' }] });
    expect(next.selection.map(selectionKey)).toEqual(['a:DOMESTIC', 'b:DOMESTIC']);
    expect(next.selectedCount).toBe(2);
    expect(next.participant.sampling.selectedCount).toBe(2);
    expect(next.reason).toBe('BELOW_MINIMUM');
    const locked = applySelectionChange(next, { add: [{ customerId: 'c', surveyType: 'DOMESTIC' }], remove: [] });
    expect(locked).toMatchObject({ selectedCount: 3, lockable: true, reason: null, progress: '3 / 3', progressPct: 100 });
  });

  it('keeps window reasons', () => {
    const closed = applySelectionChange({ ...base, reason: 'SAMPLING_CLOSED', lockable: false }, { add: [{ customerId: 'b', surveyType: 'DOMESTIC' }], remove: [] });
    expect(closed.reason).toBe('SAMPLING_CLOSED');
    expect(closed.lockable).toBe(false);
  });
});

describe('normaliseCurrent', () => {
  it('accepts a list, a single object or nothing', () => {
    const one = { cycle: { id: 'x' }, participant: {}, nextDeadline: null };
    expect(normaliseCurrent([one])).toHaveLength(1);
    expect(normaliseCurrent(one)).toHaveLength(1);
    expect(normaliseCurrent(null)).toEqual([]);
    expect(normaliseCurrent(undefined)).toEqual([]);
  });
});
