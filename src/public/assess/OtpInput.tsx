import { type ClipboardEvent, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';

import styles from './assess.module.css';

export type OtpInputProps = {
  /** Digits typed so far (≤ `length`). */
  value: string;
  onChange: (value: string) => void;
  /** Fires once the last box is filled. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  /** Focus the first box on mount and whenever the code is cleared while enabled (after a wrong attempt or a resend). */
  focusWhenEmpty?: boolean;
  describedBy?: string;
};

const digitsOf = (s: string) => s.replace(/\D+/g, '');

/** Six boxes that behave like one field: paste anywhere, auto-advance, backspace walks back, arrows move. */
export function OtpInput({ value, onChange, onComplete, length = 6, disabled, invalid, focusWhenEmpty, describedBy }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = digitsOf(value).slice(0, length);

  const focusAt = (index: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  };

  const commit = (next: string, caret: number) => {
    const clean = digitsOf(next).slice(0, length);
    onChange(clean);
    focusAt(caret);
    if (clean.length === length && clean !== digits) onComplete?.(clean);
  };

  const onInput = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const prev = digits[index] ?? '';
    let typed = digitsOf(e.target.value);
    // The boxes carry no maxLength (iOS autofill writes the whole code into the
    // first one), so strip the digit that was already there when it survived.
    if (prev && typed.length > 1) typed = typed.startsWith(prev) ? typed.slice(1) : typed.endsWith(prev) ? typed.slice(0, -1) : typed;
    if (!typed) {
      commit(digits.slice(0, index) + digits.slice(index + 1), index);
      return;
    }
    const insert = typed.slice(0, length - index);
    const next = digits.slice(0, index) + insert + digits.slice(index + insert.length);
    commit(next, index + insert.length);
  };

  const onKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) commit(digits.slice(0, index) + digits.slice(index + 1), index);
      else if (index > 0) commit(digits.slice(0, index - 1) + digits.slice(index), index - 1);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      commit(digits.slice(0, index) + digits.slice(index + 1), index);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(index + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusAt(length - 1);
    }
  };

  const onPaste = (index: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = digitsOf(e.clipboardData.getData('text'));
    if (!pasted) return;
    e.preventDefault();
    // A whole code replaces everything; a fragment lands where the caret is.
    if (pasted.length >= length) commit(pasted.slice(0, length), length - 1);
    else {
      const insert = pasted.slice(0, length - index);
      commit(digits.slice(0, index) + insert + digits.slice(index + insert.length), index + insert.length);
    }
  };

  // An empty, enabled field takes focus: on mount, and again after a wrong
  // attempt or a resend clears it (the boxes were disabled meanwhile, which drops focus).
  const empty = digits.length === 0;
  useEffect(() => {
    if (focusWhenEmpty && empty && !disabled) refs.current[0]?.focus();
  }, [focusWhenEmpty, empty, disabled]);

  return (
    <div className={cn(styles.otpGroup, invalid && styles.otpInvalid)} role="group" aria-label={`${length}-digit verification code`}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cn(styles.otpBox, digits[i] && styles.otpFilled)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={digits[i] ?? ''}
          disabled={disabled}
          onChange={onInput(i)}
          onKeyDown={onKeyDown(i)}
          onPaste={onPaste(i)}
          onFocus={(e) => e.currentTarget.select()}
        />
      ))}
    </div>
  );
}
