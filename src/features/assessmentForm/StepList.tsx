import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './parts.module.css';

export type StepListItem = {
  id: string;
  label: string;
  answered: number;
  total: number;
  /** Every question answered and valid. */
  complete: boolean;
  /** The review step: no count, a different marker. */
  review?: boolean;
};

export type StepListProps = {
  items: StepListItem[];
  current: number;
  onSelect: (index: number) => void;
  className?: string;
};

/** Per-category completion; every step is navigable (REQ §17: navigate between sections). */
export function StepList({ items, current, onSelect, className }: StepListProps) {
  return (
    <ol className={cn(styles.stepList, className)} aria-label="Sections">
      {items.map((item, i) => {
        const done = item.complete && !item.review;
        return (
          <li key={item.id} className={styles.stepItem}>
            <button type="button" className={styles.stepButton} aria-current={i === current ? 'step' : undefined} onClick={() => onSelect(i)}>
              <span className={cn(styles.stepMarker, done && styles.stepMarkerDone)} aria-hidden="true">
                {done ? <Icon name="check" size={16} /> : item.review ? <Icon name="list-check" size={16} /> : i + 1}
              </span>
              <span className={styles.stepLabel}>{item.label}</span>
              {item.review ? null : (
                <span className={cn(styles.stepCount, done && styles.stepCountDone)}>
                  {item.answered}/{item.total}
                  <span className="visually-hidden">{done ? ' answered, complete' : ' answered'}</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
