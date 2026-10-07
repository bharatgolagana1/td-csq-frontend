import { describe, expect, it } from 'vitest';

import { formatClock, formatStamp } from './stamp';

describe('formatStamp', () => {
  it('renders the instant in the cycle zone with its abbreviation', () => {
    const s = formatStamp('2026-10-07T09:00:00.000Z', 'Asia/Kolkata');
    expect(s.full).toMatch(/^7 Oct 2026, 14:30 (IST|UTC\+05:30)$/);
    expect(s.short).toBe('7 Oct, 14:30');
  });

  it('shows a dash for missing or invalid instants', () => {
    expect(formatStamp(null)).toEqual({ full: '—', short: '—' });
    expect(formatStamp('not-a-date')).toEqual({ full: '—', short: '—' });
  });
});

describe('formatClock', () => {
  it('renders HH:mm:ss in the zone', () => {
    expect(formatClock(Date.UTC(2026, 9, 7, 9, 0, 5), 'Asia/Kolkata')).toBe('14:30:05');
    expect(formatClock(0)).toBe('—');
  });
});
