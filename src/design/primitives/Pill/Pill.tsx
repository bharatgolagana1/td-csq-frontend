import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './Pill.module.css';

export type PillVariant =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warn'
  | 'danger'
  | 'excellent'
  | 'very-good'
  | 'good'
  | 'fair'
  | 'poor'
  | 'na';

export type PillProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: PillVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
};

const VARIANT_CLASS: Record<PillVariant, string | undefined> = {
  neutral: styles.neutral,
  info: styles.info,
  success: styles.success,
  warn: styles.warn,
  danger: styles.danger,
  excellent: styles.r5,
  'very-good': styles.r4,
  good: styles.r3,
  fair: styles.r2,
  poor: styles.r1,
  na: styles.na,
};

/** Status with text; the rating variants use the ACFI ramp tokens. */
export function Pill({ variant = 'neutral', dot = true, size = 'md', className, children, ...rest }: PillProps) {
  return (
    <span className={cn(styles.root, VARIANT_CLASS[variant], styles[size], className)} {...rest}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      <span className={styles.text}>{children}</span>
    </span>
  );
}

export const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  5: 'Excellent',
  4: 'Very good',
  3: 'Good',
  2: 'Fair',
  1: 'Poor',
};

/** Rating (1..5 or NA) → pill variant; numbers are rounded to the nearest band. */
export function ratingVariant(rating: number | null | undefined): PillVariant {
  if (rating === null || rating === undefined || Number.isNaN(rating)) return 'na';
  const band = Math.min(5, Math.max(1, Math.round(rating)));
  return (['poor', 'fair', 'good', 'very-good', 'excellent'] as const)[band - 1] ?? 'na';
}

export function ratingLabel(rating: number | null | undefined): string {
  if (rating === null || rating === undefined || Number.isNaN(rating)) return 'NA';
  const band = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
  return RATING_LABELS[band];
}

export function RatingPill({ rating, size }: { rating: number | null | undefined; size?: 'sm' | 'md' }) {
  return (
    <Pill variant={ratingVariant(rating)} size={size}>
      {ratingLabel(rating)}
    </Pill>
  );
}

/** Common wire statuses → pill variants. Unknown codes are neutral. */
export function statusVariant(status: string | null | undefined): PillVariant {
  switch (status) {
    case 'ACTIVE':
    case 'PUBLISHED':
    case 'LOCKED':
    case 'SUBMITTED':
    case 'APPROVED':
    case 'SENT':
    case 'DONE':
    case 'SCORED':
      return 'success';
    case 'INVITED':
    case 'PENDING':
    case 'DRAFT':
    case 'IN_PROGRESS':
    case 'OPENED':
    case 'VERIFIED':
    case 'QUEUED':
    case 'SAMPLING_OPEN':
    case 'ASSESSMENT_OPEN':
      return 'info';
    case 'UNLOCKED':
    case 'SAMPLING_CLOSED':
    case 'ASSESSMENT_CLOSED':
    case 'NOT_STARTED':
      return 'warn';
    case 'SUSPENDED':
    case 'INACTIVE':
    case 'REJECTED':
    case 'REVOKED':
    case 'EXPIRED':
    case 'FAILED':
    case 'RETIRED':
      return 'danger';
    default:
      return 'neutral';
  }
}
