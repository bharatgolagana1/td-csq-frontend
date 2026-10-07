import { type ReactNode, useEffect, useId, useState } from 'react';

import { cn } from '@/lib/cn';
import { DEFAULT_TZ, describeTimeZone } from '@/lib/format';

import { Field, fieldIds } from '../Field/Field';
import styles from './DateTimeInput.module.css';

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

/** Native date + time inputs composed into one zoned wall-clock field. */
export function DateTimeInput({ label, value, onChange, tz = DEFAULT_TZ, hint, error, required, disabled, min, max, id: idProp, className }: DateTimeInputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [parts, setParts] = useState(() => splitWall(value));

  useEffect(() => {
    setParts(splitWall(value));
  }, [value]);

  const update = (next: { date: string; time: string }) => {
    setParts(next);
    const joined = joinWall(next.date, next.time);
    if (joined !== value) onChange(joined);
  };

  const { hintId, errorId } = fieldIds(id);
  const describedBy = error ? errorId : `${id}-tz${hint ? ` ${hintId}` : ''}`;
  const minParts = splitWall(min);
  const maxParts = splitWall(max);

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} asGroup className={className}>
      <div className={cn(styles.row, error && styles.invalid, disabled && styles.disabled)}>
        <input
          id={`${id}-date`}
          type="date"
          aria-label="Date"
          className={cn(styles.input, styles.date)}
          value={parts.date}
          min={minParts.date || undefined}
          max={maxParts.date || undefined}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => update({ ...parts, date: e.target.value })}
        />
        <input
          id={`${id}-time`}
          type="time"
          aria-label="Time"
          className={cn(styles.input, styles.time)}
          value={parts.time}
          step={60}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => update({ ...parts, time: e.target.value })}
        />
      </div>
      <span id={`${id}-tz`} className={styles.tz}>
        {tz} · {describeTimeZone(tz)}
      </span>
    </Field>
  );
}
