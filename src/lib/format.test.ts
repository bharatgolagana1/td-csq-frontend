import { describe, expect, it } from 'vitest';

import { formatDateTimeZone, formatRating } from './format';

describe('formatDateTimeZone', () => {
  it('prints the instant in the zone with its abbreviation, or its UTC offset where the zone has no name', () => {
    expect(formatDateTimeZone('2026-10-05T06:30:00.000Z', 'Asia/Kolkata')).toBe('5 Oct 2026, 12:00 IST');
    expect(formatDateTimeZone(new Date('2026-10-05T06:30:00.000Z'), 'UTC')).toBe('5 Oct 2026, 06:30 UTC+00:00');
  });

  it('prints a dash for a missing or broken instant', () => {
    expect(formatDateTimeZone(null)).toBe('—');
    expect(formatDateTimeZone('not a date')).toBe('—');
  });
});

describe('formatRating', () => {
  it('prints one decimal by default and two beside a rank', () => {
    expect(formatRating(3.849)).toBe('3.8');
    expect(formatRating(3.849, 2)).toBe('3.85');
    expect(formatRating(null, 2)).toBe('—');
  });
});
