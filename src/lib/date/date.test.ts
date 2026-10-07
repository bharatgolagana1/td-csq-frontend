import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  daysInMonth,
  endOfMonth,
  formatDisplay,
  formatMonth,
  formatRangeDisplay,
  isBetween,
  isSameDay,
  monthGrid,
  parseDisplay,
  parseIso,
  shiftMonths,
  startOfMonth,
  todayIso,
  weekdayMon0,
  weekdayNames,
} from './index';

describe('iso helpers', () => {
  it('parses only real dates', () => {
    expect(parseIso('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseIso('2023-02-29')).toBeNull();
    expect(parseIso('2025-13-01')).toBeNull();
    expect(parseIso('2025-1-1')).toBeNull();
    expect(parseIso('')).toBeNull();
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2025-10-31', 1)).toBe('2025-11-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
  });

  it('adds months and clamps the day', () => {
    expect(addMonths('2025-12', 1)).toBe('2026-01');
    expect(addMonths('2025-01', -1)).toBe('2024-12');
    expect(addMonths('2025-10', -12)).toBe('2024-10');
    expect(shiftMonths('2025-01-31', 1)).toBe('2025-02-28');
    expect(shiftMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(shiftMonths('2025-10-07', 12)).toBe('2026-10-07');
  });

  it('knows month lengths, boundaries and weekdays', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(startOfMonth('2025-10-14')).toBe('2025-10-01');
    expect(endOfMonth('2025-10-14')).toBe('2025-10-31');
    expect(weekdayMon0('2025-10-06')).toBe(0); // Monday
    expect(weekdayMon0('2025-10-12')).toBe(6); // Sunday
    expect(weekdayNames()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('compares inclusively in either order', () => {
    expect(isSameDay('2025-10-08', '2025-10-08')).toBe(true);
    expect(isSameDay(null, null)).toBe(false);
    expect(isBetween('2025-10-10', '2025-10-08', '2025-10-14')).toBe(true);
    expect(isBetween('2025-10-10', '2025-10-14', '2025-10-08')).toBe(true);
    expect(isBetween('2025-10-08', '2025-10-08', '2025-10-14')).toBe(true);
    expect(isBetween('2025-10-15', '2025-10-08', '2025-10-14')).toBe(false);
  });
});

describe('monthGrid', () => {
  it('is six rows of seven starting on the Monday on or before the first', () => {
    const grid = monthGrid(2025, 10); // 1 Oct 2025 is a Wednesday
    expect(grid).toHaveLength(6);
    expect(grid.every((r) => r.length === 7)).toBe(true);
    expect(grid[0]?.map((d) => d.iso)).toEqual(['2025-09-29', '2025-09-30', '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05']);
    expect(grid[0]?.[0]).toMatchObject({ day: 29, leading: true, trailing: false, outside: true });
    expect(grid[0]?.[2]).toMatchObject({ day: 1, leading: false, trailing: false, outside: false });
    expect(grid[4]?.[4]).toMatchObject({ iso: '2025-10-31', outside: false });
    expect(grid[4]?.[5]).toMatchObject({ iso: '2025-11-01', trailing: true, outside: true });
    expect(grid[5]?.[6]?.iso).toBe('2025-11-09');
  });

  it('starts without leading days when the first is a Monday', () => {
    const grid = monthGrid(2025, 9); // 1 Sep 2025 is a Monday
    expect(grid[0]?.[0]).toMatchObject({ iso: '2025-09-01', leading: false });
    expect(grid.flat().filter((d) => d.leading)).toHaveLength(0);
    expect(grid.flat().filter((d) => !d.outside)).toHaveLength(30);
  });

  it('handles leap Februaries and year boundaries', () => {
    const feb = monthGrid(2024, 2); // 1 Feb 2024 is a Thursday
    expect(feb.flat().filter((d) => !d.outside)).toHaveLength(29);
    expect(feb.flat().find((d) => d.iso === '2024-02-29')).toMatchObject({ outside: false });
    const jan = monthGrid(2026, 1); // 1 Jan 2026 is a Thursday
    expect(jan[0]?.map((d) => d.iso)).toEqual(['2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']);
    const dec = monthGrid(2025, 12);
    expect(dec.flat().filter((d) => d.trailing).map((d) => d.iso)).toContain('2026-01-01');
  });
});

describe('formatting and parsing', () => {
  it('formats for en-IN', () => {
    expect(formatDisplay('2025-10-08')).toBe('8 Oct 2025');
    expect(formatDisplay(null)).toBe('');
    expect(formatDisplay('nope')).toBe('');
    expect(formatMonth('2025-10')).toBe('October 2025');
    expect(formatRangeDisplay({ start: '2025-10-08', end: '2025-10-14' })).toBe('8 Oct 2025 – 14 Oct 2025');
    expect(formatRangeDisplay({ start: '2025-10-08', end: null })).toBe('8 Oct 2025 – …');
    expect(formatRangeDisplay({ start: null, end: null })).toBe('');
  });

  it('parses what people type', () => {
    expect(parseDisplay('2025-10-08')).toBe('2025-10-08');
    expect(parseDisplay('8 Oct 2025')).toBe('2025-10-08');
    expect(parseDisplay('8 October 2025')).toBe('2025-10-08');
    expect(parseDisplay('08/10/2025')).toBe('2025-10-08');
    expect(parseDisplay('8-10-2025')).toBe('2025-10-08');
    expect(parseDisplay('31/02/2025')).toBeNull();
    expect(parseDisplay('2025-10-0')).toBeNull();
    expect(parseDisplay('')).toBeNull();
  });

  it('gives the wall date of a time zone', () => {
    const at = new Date('2026-10-07T20:00:00Z');
    expect(todayIso('Asia/Kolkata', at)).toBe('2026-10-08');
    expect(todayIso('America/Los_Angeles', at)).toBe('2026-10-07');
    expect(todayIso('UTC', at)).toBe('2026-10-07');
    expect(todayIso('Not/AZone', at)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
