import { Progress } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { formatInt } from '@/lib/format';

import styles from './parts.module.css';

export type ProgressBarProps = {
  answered: number;
  total: number;
  label?: string;
  className?: string;
};

/** "14 of 23 answered" over the accent progress track. */
export function ProgressBar({ answered, total, label = 'Progress', className }: ProgressBarProps) {
  const pct = total === 0 ? 0 : (answered / total) * 100;
  return (
    <Progress
      value={pct}
      label={label}
      size="sm"
      tone={answered === total && total > 0 ? 'success' : 'accent'}
      caption={<span className={styles.progressCaption}>{`${formatInt(answered)} of ${formatInt(total)} answered`}</span>}
      className={cn(styles.progress, className)}
    />
  );
}
