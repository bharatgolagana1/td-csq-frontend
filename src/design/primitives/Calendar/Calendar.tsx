import { type FocusEvent, type KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';
import { addDays, addMonths, type DateRange, formatMonth, type IsoDate, isBetween, isSameMonth, monthGrid, monthOf, shiftMonths, weekdayMon0, weekdayNames, type YearMonth, ymParts } from '@/lib/date';

import { IconButton } from '../IconButton/IconButton';
import styles from './Calendar.module.css';
import { bandFor, type CalendarMarkers, inBand, makeIsDisabled, nextRange } from './calendar.logic';
import { DayCell } from './DayCell';
import { MonthYearMenu } from './MonthYearMenu';

export type { CalendarMarker, CalendarMarkers, CalendarMarkerTone } from './calendar.logic';

type CalendarBaseProps = {
  /** Visible month, `YYYY-MM`; controlled. */
  month: YearMonth;
  onMonthChange: (month: YearMonth) => void;
  min?: IsoDate;
  max?: IsoDate;
  /** Extra rule on top of min/max (e.g. weekends). */
  disabled?: (iso: IsoDate) => boolean;
  /** Event chips under the day: one chip plus "+N", full text in a tooltip. */
  markers?: CalendarMarkers;
  /** Highlighted as today; pass `todayIso(tz)` for the cycle zone. */
  today?: IsoDate;
  /** Monday-first grids only (ARCHITECTURE §3: Indian working week). */
  weekStartsOn?: 1;
  /** 40px cells (md) or 44px (lg, phones). */
  size?: 'md' | 'lg';
  /** Card chrome: surface, border, radius. Pickers turn it off. */
  framed?: boolean;
  /** Marks the roving day with `data-autofocus` so a focus trap lands on it when the calendar opens. */
  initialFocus?: boolean;
  /** Accessible name of the whole widget. */
  label?: string;
  locale?: string;
  className?: string;
};

export type CalendarSingleProps = CalendarBaseProps & {
  mode: 'single';
  value: IsoDate | null;
  onChange: (value: IsoDate | null) => void;
};

export type CalendarRangeProps = CalendarBaseProps & {
  mode: 'range';
  value: DateRange;
  onChange: (value: DateRange) => void;
};

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

/**
 * The month grid (controlled). `role="grid"` with roving tabindex: arrows move
 * a day/week, Home/End the week ends, PageUp/Down a month, Shift+PageUp/Down a
 * year, Enter/Space select. Range mode previews the band to the hovered or
 * focused day while the end is unset.
 */
export function Calendar(props: CalendarProps) {
  const { month, onMonthChange, min, max, disabled, markers, today, size = 'md', framed = true, initialFocus = false, label = 'Calendar', locale, className } = props;
  const id = useId();
  const labelId = `${id}-month`;
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<IsoDate | null>(null);
  const [cursor, setCursor] = useState<IsoDate | null>(null);
  const [hover, setHover] = useState<IsoDate | null>(null);
  const [focusWithin, setFocusWithin] = useState(false);

  const { year, month: m } = ymParts(month);
  const grid = useMemo(() => monthGrid(year, m), [year, m]);
  const weekdays = useMemo(() => weekdayNames(locale, 'short'), [locale]);
  const isDisabled = useMemo(() => makeIsDisabled(min, max, disabled), [min, max, disabled]);

  const range: DateRange = props.mode === 'range' ? props.value : { start: props.value, end: props.value };
  const anchor = range.start && isSameMonth(range.start, month) ? range.start : today && isSameMonth(today, month) ? today : `${month}-01`;
  const activeCursor = cursor && isSameMonth(cursor, month) ? cursor : anchor;

  const previewEnd = props.mode === 'range' && range.start && !range.end ? (hover ?? (focusWithin ? activeCursor : null)) : null;
  const band = props.mode === 'range' ? bandFor(range, previewEnd) : null;

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    gridRef.current?.querySelector<HTMLElement>(`[data-iso="${target}"]`)?.focus();
  });

  const moveCursor = useCallback(
    (next: IsoDate) => {
      setCursor(next);
      pendingFocus.current = next;
      if (!isSameMonth(next, month)) onMonthChange(monthOf(next));
    },
    [month, onMonthChange],
  );

  const select = useCallback(
    (iso: IsoDate) => {
      if (isDisabled(iso)) return;
      setCursor(iso);
      if (!isSameMonth(iso, month)) onMonthChange(monthOf(iso));
      if (props.mode === 'single') props.onChange(iso);
      else props.onChange(nextRange(props.value, iso));
    },
    [isDisabled, month, onMonthChange, props],
  );

  const onDayKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, iso: IsoDate) => {
      let next: IsoDate;
      switch (e.key) {
        case 'ArrowRight':
          next = addDays(iso, 1);
          break;
        case 'ArrowLeft':
          next = addDays(iso, -1);
          break;
        case 'ArrowDown':
          next = addDays(iso, 7);
          break;
        case 'ArrowUp':
          next = addDays(iso, -7);
          break;
        case 'Home':
          next = addDays(iso, -weekdayMon0(iso));
          break;
        case 'End':
          next = addDays(iso, 6 - weekdayMon0(iso));
          break;
        case 'PageUp':
          next = shiftMonths(iso, e.shiftKey ? -12 : -1);
          break;
        case 'PageDown':
          next = shiftMonths(iso, e.shiftKey ? 12 : 1);
          break;
        default:
          return;
      }
      e.preventDefault();
      moveCursor(next);
    },
    [moveCursor],
  );

  const onGridBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!gridRef.current?.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
  };

  const prevDisabled = Boolean(min && `${addMonths(month, -1)}-31` < min);
  const nextDisabled = Boolean(max && `${addMonths(month, 1)}-01` > max);
  const showChips = markers !== undefined;

  return (
    <div className={cn(styles.root, styles[size], framed && styles.framed, showChips && styles.withChips, className)} role="group" aria-label={label}>
      <div className={styles.header}>
        <IconButton size="sm" label="Previous month" icon={<Icon name="chevron-left" size={18} />} disabled={prevDisabled} onClick={() => onMonthChange(addMonths(month, -1))} />
        <MonthYearMenu month={month} onChange={onMonthChange} min={min} max={max} locale={locale} labelId={labelId} />
        <IconButton size="sm" label="Next month" icon={<Icon name="chevron-right" size={18} />} disabled={nextDisabled} onClick={() => onMonthChange(addMonths(month, 1))} />
      </div>
      <div className="visually-hidden" aria-live="polite">
        {formatMonth(month, locale)}
      </div>
      {/* Hover and focus bookkeeping only; every interaction lives on the day buttons. */}
      <div ref={gridRef} role="grid" tabIndex={-1} aria-labelledby={labelId} aria-multiselectable={props.mode === 'range' || undefined} className={styles.grid} onMouseLeave={() => setHover(null)} onFocus={() => setFocusWithin(true)} onBlur={onGridBlur}>
        <div role="row" className={styles.weekdays}>
          {weekdays.map((d) => (
            <div key={d} role="columnheader" className={styles.weekday}>
              {d}
            </div>
          ))}
        </div>
        {grid.map((row, r) => (
          <div key={r} role="row" className={styles.row}>
            {row.map((day, c) => {
              const iso = day.iso;
              const committed = Boolean(range.start && range.end && isBetween(iso, range.start, range.end));
              return (
                <DayCell
                  key={iso}
                  day={day}
                  column={c}
                  locale={locale}
                  selected={props.mode === 'single' ? iso === props.value : committed || iso === range.start}
                  isStart={iso === range.start}
                  isEnd={iso === range.end}
                  inBand={inBand(band, iso)}
                  bandStart={band?.lo === iso}
                  bandEnd={band?.hi === iso}
                  preview={band?.preview ?? false}
                  disabled={isDisabled(iso)}
                  today={iso === today}
                  tabbable={iso === activeCursor}
                  initialFocus={initialFocus}
                  markers={markers?.[iso]}
                  showChips={showChips}
                  onSelect={select}
                  onHover={setHover}
                  onKeyDown={onDayKeyDown}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
