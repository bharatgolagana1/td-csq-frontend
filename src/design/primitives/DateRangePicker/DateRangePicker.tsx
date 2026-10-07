import { type ReactNode, useId, useRef, useState } from 'react';

import { PHONE_QUERY, useMediaQuery } from '@/design/hooks/useMediaQuery';
import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';
import { type DateRange, formatRangeDisplay, type IsoDate, monthOf, todayIso, type YearMonth } from '@/lib/date';

import { Calendar } from '../Calendar/Calendar';
import { type CalendarMarkers, rangesEqual } from '../Calendar/calendar.logic';
import { type CloseReason, DatePopover } from '../DatePicker/DatePopover';
import styles from '../DatePicker/DatePicker.module.css';
import { describedBy, Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';

export type DateRangePreset = { label: string; range: DateRange };

export type DateRangePickerProps = {
  value: DateRange;
  onChange: (value: DateRange) => void;
  /** Quick ranges ("Next 10 days"): a column beside the calendar, chips on phones. */
  presets?: DateRangePreset[];
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  min?: IsoDate;
  max?: IsoDate;
  disabledDates?: (iso: IsoDate) => boolean;
  markers?: CalendarMarkers;
  /** Caption only ("Dates in Asia/Kolkata"); also picks today's wall date. */
  tz?: string;
  today?: IsoDate;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  className?: string;
  locale?: string;
  ariaLabel?: string;
  describedBy?: string;
};

export const EMPTY_RANGE: DateRange = { start: null, end: null };

/**
 * Start–end range. The trigger reads "8 Oct 2025 – 14 Oct 2025"; the popover
 * holds a draft (first pick = start, second = end), Apply commits it, Cancel
 * discards it. Apply waits until the end is picked.
 */
export function DateRangePicker({
  value,
  onChange,
  presets,
  label,
  hint,
  error,
  required,
  disabled,
  invalid,
  placeholder = 'Start – end',
  min,
  max,
  disabledDates,
  markers,
  tz,
  today,
  clearable = true,
  size = 'md',
  id: idProp,
  className,
  locale,
  ariaLabel,
  describedBy: extraDescribedBy,
}: DateRangePickerProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const popoverId = `${id}-popover`;
  const sheet = useMediaQuery(PHONE_QUERY);
  const controlRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const todayDate = today ?? todayIso(tz);
  const [month, setMonth] = useState<YearMonth>(() => monthOf(value.start ?? todayDate));

  const openPicker = () => {
    if (disabled) return;
    setDraft(value);
    setMonth(monthOf(value.start ?? todayDate));
    setOpen(true);
  };
  const close = (reason: CloseReason) => {
    setOpen(false);
    if (reason !== 'outside') triggerRef.current?.focus();
  };
  const apply = () => {
    if (!rangesEqual(draft, value)) onChange(draft);
    close('apply');
  };
  const pickPreset = (range: DateRange) => {
    setDraft(range);
    if (range.start) setMonth(monthOf(range.start));
  };

  const display = formatRangeDisplay(value, locale);
  const described = [describedBy(id, hint, error), extraDescribedBy].filter(Boolean).join(' ') || undefined;
  const showClear = clearable && Boolean(value.start || value.end) && !disabled;
  const presetButtons = (asChips: boolean) =>
    presets?.length ? (
      <div role="group" aria-label="Quick ranges" className={asChips ? styles.chips : styles.aside}>
        {presets.map((p) => (
          <button key={p.label} type="button" className={asChips ? styles.chip : styles.preset} aria-pressed={rangesEqual(draft, p.range)} onClick={() => pickPreset(p.range)}>
            {p.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div ref={controlRef} className={cn(styles.control, styles[size], (error || invalid) && styles.invalid, disabled && styles.disabled)}>
        <Icon name="calendar" size={16} className={styles.leadIcon} />
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className={styles.trigger}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={described}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onClick={() => (open ? close('cancel') : openPicker())}
        >
          <span className={cn(styles.triggerText, !display && styles.placeholder)}>{display || placeholder}</span>
        </button>
        {showClear ? <IconButton size="sm" label="Clear dates" icon={<Icon name="x" size={16} />} className={styles.iconButton} onClick={() => onChange(EMPTY_RANGE)} /> : null}
        <Icon name="chevron-down" size={16} className={styles.leadIcon} aria-hidden="true" />
      </div>
      <DatePopover
        open={open}
        id={popoverId}
        label="Choose dates"
        anchorRef={controlRef}
        sheet={sheet}
        onCancel={close}
        onApply={apply}
        applyDisabled={Boolean(draft.start && !draft.end)}
        caption={tz ? `Dates in ${tz}` : undefined}
        aside={presetButtons(false)}
        chips={presetButtons(true)}
      >
        <Calendar
          mode="range"
          value={draft}
          onChange={setDraft}
          month={month}
          onMonthChange={setMonth}
          min={min}
          max={max}
          disabled={disabledDates}
          markers={markers}
          today={todayDate}
          framed={false}
          initialFocus
          size={sheet ? 'lg' : 'md'}
          label="Choose dates"
          locale={locale}
        />
      </DatePopover>
    </Field>
  );
}
