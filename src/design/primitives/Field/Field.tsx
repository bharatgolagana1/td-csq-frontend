import { type ReactNode } from 'react';

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

/** Label + control + hint/error. Pass `aria-describedby` from `describedBy()` to the control. */
export function Field({ id, label, hint, error, required, asGroup, className, children }: FieldProps) {
  const { hintId, errorId } = fieldIds(id);
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
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  const { hintId, errorId } = fieldIds(id);
  if (error) return errorId;
  if (hint) return hintId;
  return undefined;
}
