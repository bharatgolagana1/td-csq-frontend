import { describe, expect, it } from 'vitest';

import { describeAudit, lockReasonText, pickCurrentCycle, progressCaption, windowPhase } from './samplingLabels';
import { AUDIT, CURRENT, IN_PROGRESS, LOCKABLE, LOCKED, SHORTFALL } from './test-utils';

describe('sampling labels', () => {
  it('explains every lock refusal', () => {
    expect(lockReasonText(IN_PROGRESS)).toBe('Select 13 more to reach the minimum of 50.');
    expect(lockReasonText(SHORTFALL)).toBe('Only 42 customers are eligible, fewer than the 50 required — select all of them to lock.');
    expect(lockReasonText({ ...IN_PROGRESS, reason: 'NOTHING_SELECTED' })).toBe('Select at least one customer before locking.');
    expect(lockReasonText(LOCKED)).toBe('The sample is locked.');
    expect(lockReasonText({ ...IN_PROGRESS, reason: 'SAMPLING_CLOSED' })).toBe('Sampling is not open for this cycle.');
    expect(lockReasonText(LOCKABLE)).toBeNull();
  });

  it('captions the progress bar', () => {
    expect(progressCaption(IN_PROGRESS)).toBe('13 more to lock');
    expect(progressCaption(LOCKABLE)).toBe('Ready to lock');
    expect(progressCaption({ ...LOCKABLE, shortfallRule: 'SELECT_ALL' })).toBe('All eligible selected');
    expect(progressCaption(LOCKED)).toBe('Locked');
    expect(progressCaption({ ...IN_PROGRESS, selectedCount: 0 })).toBe('Nothing selected yet');
  });

  it('derives the window phase', () => {
    expect(windowPhase(IN_PROGRESS, CURRENT)).toBe('open');
    const future = { ...CURRENT, cycle: { ...CURRENT.cycle, sampling: { ...CURRENT.cycle.sampling, start: { wall: '2099-01-01T00:00', utc: '2099-01-01T00:00:00.000Z' } } } };
    expect(windowPhase({ ...IN_PROGRESS, editable: false, cycle: { ...IN_PROGRESS.cycle, status: 'PUBLISHED' } }, future)).toBe('before');
    expect(windowPhase({ ...IN_PROGRESS, editable: false, cycle: { ...IN_PROGRESS.cycle, status: 'SAMPLING_CLOSED' } }, CURRENT)).toBe('after');
  });

  it('picks the requested cycle, else the open one that is not locked yet', () => {
    const locked = { ...CURRENT, cycle: { ...CURRENT.cycle, id: 'cy-a' }, participant: { ...CURRENT.participant, sampling: { ...CURRENT.participant.sampling, status: 'LOCKED' as const } } };
    const open = { ...CURRENT, cycle: { ...CURRENT.cycle, id: 'cy-b' } };
    const published = { ...CURRENT, cycle: { ...CURRENT.cycle, id: 'cy-c', status: 'PUBLISHED' as const } };
    expect(pickCurrentCycle([locked, open, published], null)?.cycle.id).toBe('cy-b');
    expect(pickCurrentCycle([locked, open, published], 'cy-c')?.cycle.id).toBe('cy-c');
    expect(pickCurrentCycle([locked, open, published], 'missing')?.cycle.id).toBe('cy-b');
    expect(pickCurrentCycle([published], null)?.cycle.id).toBe('cy-c');
    expect(pickCurrentCycle([], null)).toBeNull();
  });

  it('summarises audit entries', () => {
    const changed = AUDIT[0];
    if (!changed) throw new Error('fixture');
    expect(describeAudit(changed)).toEqual({ label: 'Selection changed', variant: 'info', detail: '+2 · 37 selected' });
    expect(describeAudit({ ...changed, action: 'sample.locked', after: { selectedCount: 50, required: 50 } })).toEqual({ label: 'Locked', variant: 'success', detail: '50 locked · 50 required' });
    expect(describeAudit({ ...changed, action: 'sample.unlocked', after: { reason: 'Two customers closed down' } })).toEqual({ label: 'Unlocked', variant: 'warn', detail: 'Reason: Two customers closed down' });
    expect(describeAudit({ ...changed, action: 'sample.something.else', after: undefined }).label).toBe('Something else');
  });
});
