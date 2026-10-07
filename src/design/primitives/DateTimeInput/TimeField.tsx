import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './DateTimeInput.module.css';

export type TimeFieldProps = {
  /** `HH:mm` (24 h) or empty. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  describedBy?: string;
  className?: string;
};

const STRICT = /^([01]\d|2[0-3]):[0-5]\d$/;

/** `9:5` → `09:05`, `930` → `09:30`, `9` → `09:00`, `2359` → `23:59`; `null` when it is not a time. */
export function normaliseTime(text: string): string | null {
  const t = text.trim();
  let h: number;
  let mi: number;
  if (/^\d{1,4}$/.test(t)) {
    // Bare digits: H, HH, HMM or HHMM.
    const split = t.length <= 2 ? t.length : t.length - 2;
    h = Number(t.slice(0, split));
    mi = t.length <= 2 ? 0 : Number(t.slice(split));
  } else {
    const m = /^(\d{1,2}):(\d{1,2})$/.exec(t);
    if (!m) return null;
    h = Number(m[1]);
    mi = Number(m[2]);
  }
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

function step(time: string, part: 'h' | 'm', delta: number): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  if (part === 'h') return `${String((h + delta + 24) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const total = (h * 60 + m + delta + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * 24-hour `HH:mm` text field. Typing commits as soon as the value is a full
 * time; blur normalises partial input. ArrowUp/Down step the hour or the
 * minute under the caret (Shift: 15 minutes).
 */
export function TimeField({ value, onChange, id, disabled, required, invalid, ariaLabel = 'Time', describedBy, className }: TimeFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value);
  const caret = useRef<number | null>(null);

  useEffect(() => {
    if (document.activeElement !== ref.current) setText(value);
  }, [value]);

  useEffect(() => {
    if (caret.current === null || !ref.current) return;
    ref.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const commit = (next: string) => {
    if (next !== value) onChange(next);
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setText(t);
    if (t === '') commit('');
    else if (STRICT.test(t)) commit(t);
  };

  const onBlur = () => {
    const n = normaliseTime(text);
    if (n) {
      setText(n);
      commit(n);
    } else {
      setText(value);
      if (text !== '' && value !== '') commit(value);
      else if (text === '' && value !== '') commit('');
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const base = normaliseTime(text) ?? value ?? '00:00';
    const pos = e.currentTarget.selectionStart ?? 0;
    const part: 'h' | 'm' = pos <= 2 ? 'h' : 'm';
    const dir = e.key === 'ArrowUp' ? 1 : -1;
    const next = step(base || '00:00', part, part === 'm' && e.shiftKey ? dir * 15 : dir);
    setText(next);
    commit(next);
    caret.current = part === 'h' ? 2 : 5;
  };

  return (
    <div className={cn(styles.timeControl, invalid && styles.invalidControl, disabled && styles.disabledControl, className)}>
      <Icon name="clock" size={16} className={styles.timeIcon} />
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="HH:mm"
        maxLength={5}
        className={styles.timeInput}
        value={text}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onChange={onInput}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
