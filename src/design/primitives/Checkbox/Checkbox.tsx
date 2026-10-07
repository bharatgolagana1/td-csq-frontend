import { forwardRef, type InputHTMLAttributes, type ReactNode, useEffect, useId, useImperativeHandle, useRef } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './Checkbox.module.css';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  /** Compact box without the label gutter (table selection cells). */
  bare?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id: idProp, label, description, indeterminate = false, bare, className, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLInputElement);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const box = (
    <span className={styles.boxWrap}>
      <input ref={inner} id={id} type="checkbox" className={styles.input} aria-describedby={description ? `${id}-desc` : undefined} {...rest} />
      <span className={styles.box} aria-hidden="true">
        <Icon name={indeterminate ? 'minus' : 'check'} size={16} className={styles.mark} />
      </span>
    </span>
  );

  if (bare || !label) {
    return <span className={cn(styles.root, styles.bare, className)}>{box}</span>;
  }

  return (
    <label htmlFor={id} className={cn(styles.root, rest.disabled && styles.disabled, className)}>
      {box}
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? (
          <span id={`${id}-desc`} className={styles.description}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
});
