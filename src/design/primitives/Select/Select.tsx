import { forwardRef, type ReactNode, type SelectHTMLAttributes, useId } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { describedBy, Field } from '../Field/Field';
import styles from './Select.module.css';
import { SelectControl } from './SelectControl';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
  wrapperClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id: idProp, label, hint, error, options, placeholder, size = 'md', className, wrapperClassName, required, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={cn(styles.field, wrapperClassName)}>
      <div className={cn(styles.control, styles[size], error && styles.invalid, rest.disabled && styles.disabled)}>
        <SelectControl
          ref={ref}
          id={id}
          className={className}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          required={required}
          options={placeholder === undefined ? options : [{ value: '', label: placeholder, disabled: required }, ...options]}
          {...rest}
        />
        <Icon name="chevron-down" size={16} className={styles.chevron} />
      </div>
    </Field>
  );
});
