import { type KeyboardEvent, memo } from 'react';

import { cn } from '@/lib/cn';
import { formatDisplay, type GridDay, type IsoDate } from '@/lib/date';

import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Calendar.module.css';
import { type CalendarMarker } from './calendar.logic';

export type DayCellProps = {
  day: GridDay;
  column: number;
  locale?: string;
  selected: boolean;
  /** Committed selection (filled circle). */
  isStart: boolean;
  isEnd: boolean;
  /** Part of the band; `bandStart`/`bandEnd` are the band's own ends (committed or previewed). */
  inBand: boolean;
  bandStart: boolean;
  bandEnd: boolean;
  preview: boolean;
  disabled: boolean;
  today: boolean;
  tabbable: boolean;
  initialFocus: boolean;
  markers?: CalendarMarker[];
  showChips: boolean;
  onSelect: (iso: IsoDate) => void;
  onHover: (iso: IsoDate | null) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>, iso: IsoDate) => void;
};

export const DayCell = memo(function DayCell({
  day,
  column,
  locale,
  selected,
  isStart,
  isEnd,
  inBand,
  bandStart,
  bandEnd,
  preview,
  disabled,
  today,
  tabbable,
  initialFocus,
  markers,
  showChips,
  onSelect,
  onHover,
  onKeyDown,
}: DayCellProps) {
  const [first, ...rest] = markers ?? [];
  const label = `${formatDisplay(day.iso, locale)}${today ? ', today' : ''}${first ? `, ${markers?.length === 1 ? first.label : `${markers?.length} events`}` : ''}`;
  return (
    <div
      role="gridcell"
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        styles.cell,
        day.outside && styles.outside,
        inBand && styles.band,
        inBand && preview && styles.preview,
        bandStart && styles.bandStart,
        bandEnd && styles.bandEnd,
        column === 0 && styles.rowStart,
        column === 6 && styles.rowEnd,
        (isStart || isEnd) && styles.selected,
        disabled && styles.disabled,
        today && styles.today,
      )}
    >
      <button
        type="button"
        className={styles.day}
        data-iso={day.iso}
        data-autofocus={initialFocus && tabbable ? '' : undefined}
        tabIndex={tabbable ? 0 : -1}
        aria-label={label}
        onClick={() => onSelect(day.iso)}
        onMouseEnter={() => onHover(day.iso)}
        onKeyDown={(e) => onKeyDown(e, day.iso)}
      >
        {day.day}
      </button>
      {showChips ? (
        <div className={styles.chips} aria-hidden="true">
          {first ? (
            <Tooltip content={first.label} className={styles.chipWrap}>
              <span className={cn(styles.chip, styles[`tone-${first.tone ?? 'neutral'}`])}>{first.label}</span>
            </Tooltip>
          ) : null}
          {rest.length > 0 ? (
            <Tooltip content={rest.map((m) => m.label).join(' · ')} className={styles.chipWrapMore}>
              <span className={cn(styles.chip, styles.more)}>+{rest.length}</span>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
