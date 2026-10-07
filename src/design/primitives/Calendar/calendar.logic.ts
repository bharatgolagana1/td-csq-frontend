import { type DateRange, type IsoDate, isBetween, sortPair } from '@/lib/date';

export type CalendarMarkerTone = 'warn' | 'info' | 'accent' | 'neutral';
export type CalendarMarker = { label: string; tone?: CalendarMarkerTone };
/** Markers keyed by ISO date; each day shows the first chip plus "+N". */
export type CalendarMarkers = Record<IsoDate, CalendarMarker[]>;

/** Range mode: the first pick sets the start, the second the end (sorted); a third starts over. */
export function nextRange(current: DateRange, iso: IsoDate): DateRange {
  if (current.start && !current.end) {
    const [start, end] = sortPair(current.start, iso);
    return { start, end };
  }
  return { start: iso, end: null };
}

export function rangesEqual(a: DateRange, b: DateRange): boolean {
  return a.start === b.start && a.end === b.end;
}

export type Band = { lo: IsoDate; hi: IsoDate; preview: boolean };

/** The highlighted span: the committed range, or the start → hovered/focused day while picking. */
export function bandFor(range: DateRange, previewEnd: IsoDate | null): Band | null {
  if (range.start && range.end) {
    const [lo, hi] = sortPair(range.start, range.end);
    return lo === hi ? null : { lo, hi, preview: false };
  }
  if (range.start && previewEnd && previewEnd !== range.start) {
    const [lo, hi] = sortPair(range.start, previewEnd);
    return { lo, hi, preview: true };
  }
  return null;
}

export function inBand(band: Band | null, iso: IsoDate): boolean {
  return band !== null && isBetween(iso, band.lo, band.hi);
}

export function makeIsDisabled(min?: IsoDate, max?: IsoDate, disabled?: (iso: IsoDate) => boolean): (iso: IsoDate) => boolean {
  return (iso) => Boolean((min && iso < min) || (max && iso > max) || disabled?.(iso));
}
