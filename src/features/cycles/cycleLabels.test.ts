import { describe, expect, it } from 'vitest';

import { allowedTransitions, cycleSurveyTypes, isActiveStatus, nextCycleDeadline, participantSurveyTypes, pct, phaseOf } from './cycleLabels';
import { cycleSummary } from './fixtures';

describe('cycle status machine', () => {
  it('mirrors the backend manual edges', () => {
    expect(allowedTransitions('DRAFT')).toEqual([]);
    expect(allowedTransitions('PUBLISHED')).toEqual(['SAMPLING_OPEN']);
    expect(allowedTransitions('SAMPLING_CLOSED')).toEqual(['SAMPLING_OPEN', 'ASSESSMENT_OPEN']);
    expect(allowedTransitions('ASSESSMENT_CLOSED')).toEqual(['ASSESSMENT_OPEN', 'SCORED']);
    expect(allowedTransitions('ARCHIVED')).toEqual([]);
  });

  it('knows the phase and the active statuses', () => {
    expect(phaseOf('DRAFT')).toBe('draft');
    expect(phaseOf('SAMPLING_CLOSED')).toBe('sampling');
    expect(phaseOf('ASSESSMENT_OPEN')).toBe('assessment');
    expect(phaseOf('SCORED')).toBe('done');
    expect(isActiveStatus('SAMPLING_OPEN')).toBe(true);
    expect(isActiveStatus('ARCHIVED')).toBe(false);
  });

  it('picks the next clock instant from the status', () => {
    const c = cycleSummary({ status: 'SAMPLING_OPEN' });
    expect(nextCycleDeadline(c)).toEqual({ kind: 'SAMPLING_CLOSES', at: c.sampling.end.utc });
    expect(nextCycleDeadline({ ...c, status: 'SAMPLING_CLOSED' })?.kind).toBe('ASSESSMENT_OPENS');
    expect(nextCycleDeadline({ ...c, status: 'SCORED' })).toBeNull();
  });
});

describe('survey types and percentages', () => {
  it('restricts the cycle types to what an operator runs', () => {
    expect(cycleSurveyTypes('BOTH')).toEqual(['DOMESTIC', 'INTERNATIONAL']);
    expect(participantSurveyTypes('BOTH', { domestic: true, international: false })).toEqual(['DOMESTIC']);
    expect(participantSurveyTypes('INTERNATIONAL', { domestic: true, international: false })).toEqual([]);
  });

  it('clamps percentages and treats an empty whole as zero', () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(5, 4)).toBe(100);
    expect(pct(3, 0)).toBe(0);
  });
});
