import { describe, expect, it } from 'vitest';

import { addCalendarDays, deriveWindows, reminderSchedule, serverWindowField, timelineLayout, validateWindows, wallToDate } from './derive';

describe('deriveWindows', () => {
  it('derives sampling then assessment from one initiation date with midnight activation', () => {
    const w = deriveWindows('2026-10-01', { samplingDays: 10, assessmentDays: 30 });
    expect(w).toEqual({
      sampling: { start: '2026-10-01T00:00', end: '2026-10-11T00:00' },
      assessment: { start: '2026-10-11T00:00', end: '2026-11-10T00:00' },
    });
  });

  it('crosses month and year ends on the calendar', () => {
    expect(addCalendarDays('2026-12-25', 10)).toBe('2027-01-04');
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(() => addCalendarDays('2026-13-01', 1)).toThrow(RangeError);
  });
});

describe('validateWindows', () => {
  const ok = { sampling: { start: '2026-10-01T00:00', end: '2026-10-11T00:00' }, assessment: { start: '2026-10-11T00:00', end: '2026-11-10T00:00' } };

  it('accepts ordered windows and assessment starting at sampling end', () => {
    expect(validateWindows(ok)).toEqual([]);
  });

  it('reports every violated rule with the field to highlight', () => {
    const bad = { sampling: { start: '2026-10-11T00:00', end: '2026-10-01T00:00' }, assessment: { start: '2026-09-30T00:00', end: '2026-09-29T00:00' } };
    expect(validateWindows(bad).map((p) => p.path)).toEqual(['sampling.end', 'assessment.end', 'assessment.start']);
  });

  it('stays silent while a value is still empty (the required message covers it)', () => {
    expect(validateWindows({ ...ok, assessment: { start: '', end: '2026-11-10T00:00' } })).toEqual([]);
  });

  it('maps the server paths onto the form fields', () => {
    expect(serverWindowField('body.sampling')).toBe('sampling.end');
    expect(serverWindowField('assessment')).toBe('assessment.end');
    expect(serverWindowField('assessment.start')).toBe('assessment.start');
    expect(serverWindowField('name')).toBeNull();
  });
});

describe('reminderSchedule', () => {
  it('fires every N days from the window start at 09:00 and never at or after the end', () => {
    const w = { start: '2026-10-01T00:00', end: '2026-10-11T00:00' };
    expect(reminderSchedule(w, { count: 3, everyDays: 3 })).toEqual(['2026-10-04T09:00', '2026-10-07T09:00', '2026-10-10T09:00']);
    expect(reminderSchedule(w, { count: 5, everyDays: 3 })).toHaveLength(3);
    expect(reminderSchedule(w, { count: 0, everyDays: 3 })).toEqual([]);
    expect(reminderSchedule({ start: '', end: '' }, { count: 3, everyDays: 3 })).toEqual([]);
  });
});

describe('timelineLayout', () => {
  it('positions both windows along the span and marks today when inside it', () => {
    const w = { sampling: { start: '2026-10-01T00:00', end: '2026-10-11T00:00' }, assessment: { start: '2026-10-11T00:00', end: '2026-11-10T00:00' } };
    const layout = timelineLayout(w, 'Asia/Kolkata', wallToDate('2026-10-06T00:00', 'Asia/Kolkata') ?? new Date());
    expect(layout).not.toBeNull();
    expect(layout?.sampling.left).toBe(0);
    expect(layout?.sampling.width).toBeCloseTo(25, 0);
    expect(layout?.assessment.left).toBeCloseTo(25, 0);
    expect(layout?.assessment.width).toBeCloseTo(75, 0);
    expect(layout?.today).toBeCloseTo(12.5, 0);
    expect(layout?.days).toEqual({ sampling: 10, assessment: 30 });
  });

  it('is null until all four edges are set', () => {
    expect(timelineLayout({ sampling: { start: '2026-10-01T00:00', end: '' }, assessment: { start: '', end: '' } }, 'Asia/Kolkata')).toBeNull();
  });
});
