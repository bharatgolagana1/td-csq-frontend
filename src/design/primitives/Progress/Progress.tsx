import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './Progress.module.css';

export type ProgressProps = {
  /** 0..100 */
  value: number;
  label?: ReactNode;
  /** Right-hand caption, e.g. "14 of 23". Defaults to the percentage. */
  caption?: ReactNode;
  tone?: 'accent' | 'success' | 'warn' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
};

export function Progress({ value, label, caption, tone = 'accent', size = 'md', className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const text = caption ?? `${Math.round(pct)} %`;
  return (
    <div className={cn(styles.root, className)}>
      {label || text ? (
        <div className={styles.head}>
          {label ? <span className={styles.label}>{label}</span> : <span />}
          <span className={styles.caption}>{text}</span>
        </div>
      ) : null}
      <div
        className={cn(styles.track, styles[size])}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <div className={cn(styles.bar, styles[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
