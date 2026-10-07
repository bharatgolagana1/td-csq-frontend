import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './parts.module.css';
import { type ReviewItem } from './types';

export type ReviewListProps = {
  items: ReviewItem[];
  onJump: (item: ReviewItem) => void;
  className?: string;
};

/** Missing items with jump links; "Everything is answered" when there are none. */
export function ReviewList({ items, onJump, className }: ReviewListProps) {
  if (items.length === 0) {
    return (
      <div className={cn(styles.review, className)}>
        <p className={styles.reviewHead}>
          <Icon name="check" size={18} className={styles.reviewHeadIconDone} />
          Everything is answered
        </p>
        <p className={styles.reviewEmpty}>Check your answers from the sections on the left, then submit. Submitted answers are locked.</p>
      </div>
    );
  }
  return (
    <div className={cn(styles.review, className)}>
      <p className={styles.reviewHead}>
        <Icon name="warning" size={18} className={styles.reviewHeadIcon} />
        {items.length === 1 ? '1 item needs attention' : `${items.length} items need attention`}
      </p>
      <ul className={styles.reviewList}>
        {items.map((item) => (
          <li key={item.questionId} className={styles.reviewItem}>
            <button type="button" className={styles.reviewJump} onClick={() => onJump(item)}>
              <span className={styles.reviewCode}>Q{item.index}</span>
              <span className={styles.reviewText}>
                {item.text}
                <span className={styles.reviewMeta}>{item.stepLabel}</span>
              </span>
              <span className={styles.reviewReason}>{item.reason === 'missing' ? 'Not answered' : 'Comment needed'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
