import { type KeyboardEvent, type RefObject, useCallback, useEffect, useId, useRef, useState } from 'react';

import { useOutsideClick } from '@/design/hooks/useOutsideClick';
import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';
import { formatMonth, type IsoDate, monthNames, ym, type YearMonth, ymParts } from '@/lib/date';

import styles from './Calendar.module.css';

export type MonthYearMenuProps = {
  month: YearMonth;
  onChange: (month: YearMonth) => void;
  min?: IsoDate;
  max?: IsoDate;
  locale?: string;
  /** Id of the visible month label (the grid is labelled by it). */
  labelId: string;
};

const YEARS_AROUND = 10;

/**
 * "October 2025 ▾": a menu with the twelve months and a scrollable year list
 * (±10 years). Arrow keys move within a column, Left/Right switch column,
 * Enter/Space pick, Escape closes. A year keeps the menu open so the month can
 * follow; a month closes it.
 */
export function MonthYearMenu({ month, onChange, min, max, locale, labelId }: MonthYearMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restore: boolean) => {
    setOpen(false);
    if (restore) triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.monthButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={labelId}>{formatMonth(month, locale)}</span>
        <Icon name="chevron-down" size={16} className={styles.monthChevron} />
      </button>
      {open ? <MenuPanel id={id} month={month} min={min} max={max} locale={locale} triggerRef={triggerRef} onChange={onChange} close={close} /> : null}
    </>
  );
}

type PanelProps = Omit<MonthYearMenuProps, 'labelId'> & {
  id: string;
  triggerRef: RefObject<HTMLButtonElement>;
  close: (restore: boolean) => void;
};

function MenuPanel({ id, month, min, max, locale, triggerRef, onChange, close }: PanelProps) {
  const { year, month: m } = ymParts(month);
  const panelRef = useRef<HTMLDivElement>(null);
  // The year list is fixed for the life of the panel so picking a year does not shift it.
  const [baseYear] = useState(year);
  const years = Array.from({ length: YEARS_AROUND * 2 + 1 }, (_, i) => baseYear - YEARS_AROUND + i);
  const [active, setActive] = useState<{ col: 0 | 1; idx: number }>({ col: 0, idx: m - 1 });
  const months = monthNames(locale, 'long');

  useOutsideClick([panelRef, triggerRef], () => close(false), true);

  useEffect(() => {
    const el = panelRef.current?.querySelectorAll<HTMLElement>(`[data-col="${active.col}"]`)[active.idx];
    el?.focus();
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    // Centre the chosen year before focus lands on the month column.
    panelRef.current?.querySelector<HTMLElement>('[data-col="1"][aria-checked="true"]')?.scrollIntoView({ block: 'center' });
  }, []);

  const monthAllowed = (index: number) => {
    const first = `${ym(year, index + 1)}-01`;
    const last = `${ym(year, index + 1)}-31`;
    return !((max && first > max) || (min && last < min));
  };
  const yearAllowed = (y: number) => !((max && `${y}-01-01` > max) || (min && `${y}-12-31` < min));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const count = active.col === 0 ? 12 : years.length;
    switch (e.key) {
      case 'ArrowDown':
        setActive({ col: active.col, idx: (active.idx + 1) % count });
        break;
      case 'ArrowUp':
        setActive({ col: active.col, idx: (active.idx - 1 + count) % count });
        break;
      case 'ArrowRight':
      case 'ArrowLeft': {
        const col: 0 | 1 = active.col === 0 ? 1 : 0;
        setActive({ col, idx: col === 0 ? m - 1 : Math.max(0, years.indexOf(year)) });
        break;
      }
      case 'Home':
        setActive({ col: active.col, idx: 0 });
        break;
      case 'End':
        setActive({ col: active.col, idx: count - 1 });
        break;
      case 'Escape':
        e.stopPropagation();
        close(true);
        break;
      case 'Tab':
        close(false);
        return;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div ref={panelRef} id={id} role="menu" tabIndex={-1} aria-label="Choose month and year" className={styles.menu} onKeyDown={onKeyDown}>
      <div role="group" aria-label="Month" className={styles.menuColumn}>
        {months.map((name, i) => {
          const allowed = monthAllowed(i);
          return (
            <button
              key={name}
              type="button"
              role="menuitemradio"
              aria-checked={i === m - 1}
              aria-disabled={allowed ? undefined : true}
              data-col={0}
              tabIndex={active.col === 0 && active.idx === i ? 0 : -1}
              className={cn(styles.menuItem, !allowed && styles.menuItemDisabled)}
              onMouseEnter={() => setActive({ col: 0, idx: i })}
              onClick={() => {
                if (!allowed) return;
                onChange(ym(year, i + 1));
                close(true);
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
      <div role="group" aria-label="Year" className={cn(styles.menuColumn, styles.menuYears)}>
        {years.map((y, i) => {
          const allowed = yearAllowed(y);
          return (
            <button
              key={y}
              type="button"
              role="menuitemradio"
              aria-checked={y === year}
              aria-disabled={allowed ? undefined : true}
              data-col={1}
              tabIndex={active.col === 1 && active.idx === i ? 0 : -1}
              className={cn(styles.menuItem, styles.menuYear, !allowed && styles.menuItemDisabled)}
              onMouseEnter={() => setActive({ col: 1, idx: i })}
              onClick={() => {
                if (!allowed) return;
                onChange(ym(y, m));
                setActive({ col: 1, idx: i });
              }}
            >
              {y}
            </button>
          );
        })}
      </div>
    </div>
  );
}
