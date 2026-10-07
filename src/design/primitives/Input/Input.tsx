import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';

import { cn } from '@/lib/cn';

import { describedBy, Field } from '../Field/Field';
import styles from './Input.module.css';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  mono?: boolean;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id: idProp, label, hint, error, prefix, suffix, size = 'md', mono, className, wrapperClassName, required, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className={cn(styles.control, styles[size], error && styles.invalid, rest.disabled && styles.disabled)}>
        {prefix ? <span className={styles.affix}>{prefix}</span> : null}
        <input
          ref={ref}
          id={id}
          className={cn(styles.input, mono && styles.mono, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          required={required}
          {...rest}
        />
        {suffix ? <span className={styles.affix}>{suffix}</span> : null}
      </div>
    </Field>
  );
});
