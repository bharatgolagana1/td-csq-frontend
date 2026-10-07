import { type ChangeEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

import { PHONE_QUERY, useMediaQuery } from '@/design/hooks/useMediaQuery';
import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';
import { formatDisplay, type IsoDate, monthOf, parseDisplay, todayIso, type YearMonth } from '@/lib/date';

import { Calendar } from '../Calendar/Calendar';
import { type CalendarMarkers, makeIsDisabled } from '../Calendar/calendar.logic';
import { describedBy, Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import styles from './DatePicker.module.css';
import { type CloseReason, DatePopover } from './DatePopover';

export type DatePickerProps = {
  value: IsoDate | null;
  onChange: (value: IsoDate | null) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Error styling without a message (a parent group shows it). */
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
  name?: string;
  className?: string;
  locale?: string;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  /** Extra `aria-describedby` ids from a parent group. */
  describedBy?: string;
};

/**
 * Single date. The text field accepts a typed date (ISO, `8 Oct 2025`,
 * `08/10/2025`) and commits on every valid value; the calendar button opens the
 * popover (bottom sheet on phones), whose Apply commits the draft and Cancel
 * discards it. The displayed value is `formatDisplay()` in en-IN.
 */
export function DatePicker({
  value,
  onChange,
  label,
  hint,
  error,
  required,
  disabled,
  invalid,
  placeholder = 'Pick a date',
  min,
  max,
  disabledDates,
  markers,
  tz,
  today,
  clearable = true,
  size = 'md',
  id: idProp,
  name,
  className,
  locale,
  ariaLabel,
  describedBy: extraDescribedBy,
}: DatePickerProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const popoverId = `${id}-popover`;
  const sheet = useMediaQuery(PHONE_QUERY);
  const controlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<IsoDate | null>(value);
  const [month, setMonth] = useState<YearMonth>(() => monthOf(value ?? todayIso(tz)));
  const [text, setText] = useState(() => formatDisplay(value, locale));
  const todayDate = today ?? todayIso(tz);
  const isDisabled = useMemo(() => makeIsDisabled(min, max, disabledDates), [min, max, disabledDates]);

  useEffect(() => {
    // Reflect external changes; never overwrite what the person is typing.
    if (document.activeElement !== inputRef.current) setText(formatDisplay(value, locale));
  }, [value, locale]);

  const openPicker = (opener: HTMLElement | null) => {
    if (disabled) return;
    openerRef.current = opener;
    setDraft(value);
    setMonth(monthOf(value ?? todayDate));
    setOpen(true);
  };
  const close = (reason: CloseReason) => {
    setOpen(false);
    if (reason !== 'outside') openerRef.current?.focus();
  };
  const apply = () => {
    if (draft !== value) onChange(draft);
    close('apply');
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setText(t);
    if (t.trim() === '') {
      if (value !== null) onChange(null);
      return;
    }
    const parsed = parseDisplay(t, locale);
    if (parsed && !isDisabled(parsed) && parsed !== value) onChange(parsed);
  };
  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openPicker(e.currentTarget);
    }
  };

  const described = [describedBy(id, hint, error), extraDescribedBy].filter(Boolean).join(' ') || undefined;
  const showClear = clearable && value !== null && !disabled;

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div ref={controlRef} className={cn(styles.control, styles[size], (error || invalid) && styles.invalid, disabled && styles.disabled)}>
        <Icon name="calendar" size={16} className={styles.leadIcon} />
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          className={styles.input}
          value={text}
          placeholder={placeholder}
          readOnly={sheet}
          required={required}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={error || invalid ? true : undefined}
          aria-describedby={described}
          aria-controls={open ? popoverId : undefined}
          onChange={onInput}
          onBlur={() => setText(formatDisplay(value, locale))}
          onKeyDown={onInputKeyDown}
          onClick={sheet ? (e) => openPicker(e.currentTarget) : undefined}
        />
        {showClear ? <IconButton size="sm" label="Clear date" icon={<Icon name="x" size={16} />} className={styles.iconButton} onClick={() => onChange(null)} /> : null}
        <IconButton
          size="sm"
          label="Open calendar"
          icon={<Icon name="chevron-down" size={16} />}
          className={styles.iconButton}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onClick={(e) => (open ? close('cancel') : openPicker(e.currentTarget))}
        />
      </div>
      <DatePopover open={open} id={popoverId} label="Choose a date" anchorRef={controlRef} sheet={sheet} onCancel={close} onApply={apply} caption={tz ? `Dates in ${tz}` : undefined}>
        <Calendar
          mode="single"
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
          label="Choose a date"
          locale={locale}
        />
      </DatePopover>
    </Field>
  );
}
