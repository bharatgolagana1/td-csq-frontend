import { type ReactNode, useId } from 'react';

import { cn } from '@/lib/cn';

import styles from './Switch.module.css';

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
  size?: 'sm' | 'md';
};

export function Switch({ checked, onChange, label, description, disabled, id: idProp, className, size = 'md' }: SwitchProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={description ? `${id}-desc` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(styles.track, styles[size], checked && styles.on)}
    >
      <span className={styles.thumb} aria-hidden="true" />
    </button>
  );
  if (!label) return <span className={className}>{control}</span>;
  return (
    <div className={cn(styles.root, disabled && styles.disabled, className)}>
      {control}
      <label htmlFor={id} className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? (
          <span id={`${id}-desc`} className={styles.description}>
            {description}
          </span>
        ) : null}
      </label>
    </div>
  );
}
