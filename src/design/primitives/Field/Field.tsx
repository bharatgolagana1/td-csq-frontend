import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

import styles from './Field.module.css';

export type FieldProps = {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Use a non-label element for groups (date + time, radio sets). */
  asGroup?: boolean;
  className?: string;
  children: ReactNode;
};

export function fieldIds(id: string) {
  return { hintId: `${id}-hint`, errorId: `${id}-error` };
}

/**
 * Once an error has been shown, the line it took stays reserved (at its height)
 * after it clears, until the field unmounts. An error usually clears on blur,
 * and blur comes from the mousedown of the next click: had the line collapsed,
 * everything below would jump up under the pointer and the click land on
 * something else (or nothing).
 */
function useReservedErrorLine(error: ReactNode) {
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [reserved, setReserved] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (error) setReserved(errorRef.current?.offsetHeight ?? 0);
  }, [error]);
  return { errorRef, reserved };
}

/** Label + control + hint/error. Pass `aria-describedby` from `describedBy()` to the control. */
export function Field({ id, label, hint, error, required, asGroup, className, children }: FieldProps) {
  const { hintId, errorId } = fieldIds(id);
  const { errorRef, reserved } = useReservedErrorLine(error);
  const labelNode = label ? (
    <>
      {label}
      {required ? <span className={styles.required} aria-hidden="true"> *</span> : null}
    </>
  ) : null;
  return (
    <div className={cn(styles.root, error && styles.invalid, className)} role={asGroup ? 'group' : undefined} aria-labelledby={asGroup && label ? `${id}-label` : undefined}>
      {label ? (
        asGroup ? (
          <span id={`${id}-label`} className={styles.label}>
            {labelNode}
          </span>
        ) : (
          <label htmlFor={id} className={styles.label}>
            {labelNode}
          </label>
        )
      ) : null}
      {children}
      {error ? (
        <p ref={errorRef} id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint} style={reserved ? { minHeight: reserved } : undefined}>
          {hint}
        </p>
      ) : reserved !== null ? (
        <span className={styles.reserved} style={reserved ? { height: reserved } : undefined} aria-hidden="true" data-reserved-error-line="" />
      ) : null}
    </div>
  );
}

/** A group's own error line (a checkbox set, …), reserving its height after it clears like a Field's. */
export function ErrorLine({ id, error, className }: { id?: string; error?: ReactNode; className?: string }) {
  const { errorRef, reserved } = useReservedErrorLine(error);
  if (error) {
    return (
      <p ref={errorRef} id={id} className={cn(styles.error, className)} role="alert">
        {error}
      </p>
    );
  }
  return reserved !== null ? <span className={styles.reserved} style={reserved ? { height: reserved } : undefined} aria-hidden="true" data-reserved-error-line="" /> : null;
}

export function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  const { hintId, errorId } = fieldIds(id);
  if (error) return errorId;
  if (hint) return hintId;
  return undefined;
}
