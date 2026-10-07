import { type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import styles from './Badge.module.css';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  count: number;
  max?: number;
  tone?: 'neutral' | 'accent' | 'danger';
  /** Hide when the count is zero (default true). */
  hideZero?: boolean;
};

/** Numeric counter (sidebar counts, tab counts). Numbers in mono. */
export function Badge({ count, max = 99, tone = 'neutral', hideZero = true, className, ...rest }: BadgeProps) {
  if (hideZero && count === 0) return null;
  const text = count > max ? `${max}+` : String(count);
  return (
    <span className={cn(styles.root, styles[tone], className)} {...rest}>
      {text}
    </span>
  );
}
