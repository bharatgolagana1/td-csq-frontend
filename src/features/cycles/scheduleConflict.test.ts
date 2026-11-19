import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({ getAccessToken: vi.fn(async () => 'tok'), forceRefreshToken: vi.fn(async () => false) }));

import { cycleSummary } from './fixtures';
import { createInput } from './autosave';
import { defaultBuilderValues } from './builderSchema';
import { fetchCycleSchedule, firstFreeInitiationDate, isCycleDateReserved } from './scheduleConflict';
import { apiError, mockApi } from './testSupport';

const existing = cycleSummary();
const tz = 'Asia/Kolkata';

afterEach(() => vi.unstubAllGlobals());

describe('cycle calendar reservations', () => {
  it('blocks sampling and assessment days while allowing dates outside the cycle', () => {
    for (const date of ['2026-10-01', '2026-10-10', '2026-10-11', '2026-11-09']) {
      expect(isCycleDateReserved(date, tz, [existing])).toBe(true);
    }
    for (const date of ['2026-09-30', '2026-11-10', '2026-12-01', '']) {
      expect(isCycleDateReserved(date, tz, [existing])).toBe(false);
    }
  });

  it('excludes the cycle being edited', () => {
    expect(isCycleDateReserved('2026-10-03', tz, [existing], existing.id)).toBe(false);
  });

  it('compares dates in the selected time zone', () => {
    expect(isCycleDateReserved('2026-09-30', 'UTC', [existing])).toBe(true);
    expect(isCycleDateReserved('2026-11-10', 'UTC', [existing])).toBe(false);
  });

  it.each(['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN'] as const)('reserves dates for %s cycles', (status) => {
    expect(isCycleDateReserved('2026-10-03', tz, [cycleSummary({ status })])).toBe(true);
  });

  it.each(['DRAFT', 'ASSESSMENT_CLOSED', 'SCORED', 'ARCHIVED'] as const)('releases dates for %s cycles', (status) => {
    expect(isCycleDateReserved('2026-10-03', tz, [cycleSummary({ status })])).toBe(false);
  });

  it('fetches every page of the schedule', async () => {
    const other = cycleSummary({ id: 'other' });
    const { calls } = mockApi([{ path: '/cycles', reply: ({ url }) => ({
      data: [url.searchParams.get('page') === '1' ? existing : other],
      meta: { page: Number(url.searchParams.get('page')), pageSize: 1, total: 2 },
    }) }]);
    await expect(fetchCycleSchedule()).resolves.toEqual([existing, other]);
    expect(calls.map((call) => call.query.page)).toEqual(['1', '2']);
  });

  it('rejects a schedule fetch failure', async () => {
    mockApi([{ path: '/cycles', reply: () => apiError(503, 'INTERNAL', 'Unavailable') }]);
    await expect(fetchCycleSchedule()).rejects.toThrow('Unavailable');
  });
});

describe('a new draft\u2019s placeholder dates', () => {
  const defaults = { samplingDays: 10, assessmentDays: 30 };

  it('start on the first day whose derived windows clear every running cycle', () => {
    // The running cycle holds 1 Oct – 10 Nov; 40 days from 1 Sep would run into it.
    expect(firstFreeInitiationDate([existing], tz, defaults, '2026-09-01')).toBe('2026-11-10');
    expect(firstFreeInitiationDate([existing], tz, defaults, '2026-08-01')).toBe('2026-08-01');
    expect(firstFreeInitiationDate([], tz, defaults, '2026-10-05')).toBe('2026-10-05');
  });

  it('a draft or a closed cycle reserves nothing', () => {
    expect(firstFreeInitiationDate([{ ...existing, status: 'DRAFT' }], tz, defaults, '2026-10-05')).toBe('2026-10-05');
    expect(firstFreeInitiationDate([{ ...existing, status: 'SCORED' }], tz, defaults, '2026-10-05')).toBe('2026-10-05');
  });

  it('createInput sends the placeholder only when no initiation date was chosen', () => {
    const values = { ...defaultBuilderValues(), name: 'Next cycle', code: 'CSQ-NEXT', tz };
    expect(createInput(values, values, new Date('2026-10-05T06:00:00Z'), '2026-11-10')?.input).toMatchObject({ initiationDate: '2026-11-10' });
    expect(createInput({ ...values, initiationDate: '2026-12-01' }, values, new Date(), '2026-11-10')?.input).toMatchObject({ initiationDate: '2026-12-01' });
    expect(createInput(values, values, new Date('2026-10-05T06:00:00Z'))?.input).toMatchObject({ initiationDate: '2026-10-05' });
  });
});
