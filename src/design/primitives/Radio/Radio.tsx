import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';

import { cn } from '@/lib/cn';

import styles from './Radio.module.css';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  description?: ReactNode;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { id: idProp, label, description, className, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <label htmlFor={id} className={cn(styles.root, rest.disabled && styles.disabled, className)}>
      <span className={styles.dotWrap}>
        <input ref={ref} id={id} type="radio" className={styles.input} aria-describedby={description ? `${id}-desc` : undefined} {...rest} />
        <span className={styles.dot} aria-hidden="true" />
      </span>
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

export type RadioGroupProps = {
  label: ReactNode;
  children: ReactNode;
  inline?: boolean;
  className?: string;
};

export function RadioGroup({ label, children, inline, className }: RadioGroupProps) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id} className={cn(styles.group, inline && styles.inline, className)}>
      <span id={id} className={styles.groupLabel}>
        {label}
      </span>
      <div className={styles.items}>{children}</div>
    </div>
  );
}
