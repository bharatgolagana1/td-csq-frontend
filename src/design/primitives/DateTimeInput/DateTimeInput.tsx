import { type ReactNode, useEffect, useId, useState } from 'react';

import { cn } from '@/lib/cn';
import { DEFAULT_TZ, describeTimeZone } from '@/lib/format';

import { DatePicker } from '../DatePicker/DatePicker';
import { Field, fieldIds } from '../Field/Field';
import styles from './DateTimeInput.module.css';
import { TimeField } from './TimeField';

/** Wall-clock value as the API stores it: 'YYYY-MM-DDTHH:mm'. */
export type Wall = string;

export type DateTimeInputProps = {
  label: ReactNode;
  value: Wall | null;
  onChange: (wall: Wall | null) => void;
  /** IANA zone the wall-clock is in; shown as a caption. */
  tz?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  min?: Wall;
  max?: Wall;
  id?: string;
  className?: string;
};

export function splitWall(wall: Wall | null | undefined): { date: string; time: string } {
  if (!wall) return { date: '', time: '' };
  const [date = '', time = ''] = wall.split('T');
  return { date, time: time.slice(0, 5) };
}

export function joinWall(date: string, time: string): Wall | null {
  if (!date || !time) return null;
  return `${date}T${time}`;
}

/**
 * Zoned wall-clock field: a DatePicker (labelled "Date") and a 24 h TimeField
 * (labelled "Time") under one group label, with the zone as a caption. Emits
 * only when both parts are present, `null` when either is cleared.
 */
export function DateTimeInput({ label, value, onChange, tz = DEFAULT_TZ, hint, error, required, disabled, min, max, id: idProp, className }: DateTimeInputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  // Local parts so a half-filled field (date without time) survives until both exist.
  const [parts, setParts] = useState(() => splitWall(value));
  useEffect(() => {
    setParts((p) => (value === null ? (joinWall(p.date, p.time) === null ? p : { date: '', time: '' }) : splitWall(value)));
  }, [value]);
  const { hintId, errorId } = fieldIds(id);
  const describedBy = error ? errorId : `${id}-tz${hint ? ` ${hintId}` : ''}`;
  const minParts = splitWall(min);
  const maxParts = splitWall(max);

  const update = (next: { date: string; time: string }) => {
    setParts(next);
    const joined = joinWall(next.date, next.time);
    if (joined !== value) onChange(joined);
  };

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} asGroup className={className}>
      <div className={cn(styles.row, disabled && styles.disabled)}>
        <DatePicker
          id={`${id}-date`}
          ariaLabel="Date"
          className={styles.date}
          value={parts.date || null}
          onChange={(d) => update({ ...parts, date: d ?? '' })}
          min={minParts.date || undefined}
          max={maxParts.date || undefined}
          required={required}
          disabled={disabled}
          invalid={Boolean(error)}
          describedBy={describedBy}
          tz={tz}
          placeholder="Date"
        />
        <TimeField id={`${id}-time`} className={styles.time} value={parts.time} onChange={(t) => update({ ...parts, time: t })} required={required} disabled={disabled} invalid={Boolean(error)} describedBy={describedBy} />
      </div>
      <span id={`${id}-tz`} className={styles.tz}>
        {tz} · {describeTimeZone(tz)}
      </span>
    </Field>
  );
}
