import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './parts.module.css';

export type StepHeaderProps = {
  /** Zero-based index of the current step. */
  index: number;
  count: number;
  title: string;
  description?: ReactNode;
  className?: string;
};

/** "2 of 4 · Security / Safety" above a step's questions. */
export function StepHeader({ index, count, title, description, className }: StepHeaderProps) {
  return (
    <div className={cn(styles.stepHeader, className)}>
      <p className={styles.stepEyebrow}>
        {index + 1} of {count} · {title}
      </p>
      <h2 className={styles.stepTitle}>{title}</h2>
      {description ? <p className={styles.stepDescription}>{description}</p> : null}
    </div>
  );
}
