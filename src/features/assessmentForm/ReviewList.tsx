import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './parts.module.css';
import { answerKey, DIRECTION_LABELS } from './rules';
import { type RemarkReviewItem, type ReviewItem } from './types';

export type ReviewListProps = {
  items: ReviewItem[];
  /** Sections whose remark is still empty, listed after that section's questions. */
  remarks?: RemarkReviewItem[];
  onJump: (item: ReviewItem) => void;
  onJumpRemark?: (item: RemarkReviewItem) => void;
  className?: string;
};

/** Missing items with jump links ("· Import" / "· Export" on an import/export form, "· Remarks needed" for a section's remark); "Everything is answered" when there are none. */
export function ReviewList({ items, remarks = [], onJump, onJumpRemark, className }: ReviewListProps) {
  const count = items.length + remarks.length;
  // Form order: each section's questions, then its remark.
  const entries = [
    ...items.map((item) => ({ stepIndex: item.stepIndex, remark: false as const, item })),
    ...remarks.map((item) => ({ stepIndex: item.stepIndex, remark: true as const, item })),
  ].sort((a, b) => a.stepIndex - b.stepIndex || Number(a.remark) - Number(b.remark));
  if (count === 0) {
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
        {count === 1 ? '1 item needs attention' : `${count} items need attention`}
      </p>
      <ul className={styles.reviewList}>
        {entries.map((entry) =>
          entry.remark ? (
            <li key={`remark-${entry.item.stepId}`} className={styles.reviewItem}>
              <button type="button" className={styles.reviewJump} onClick={() => onJumpRemark?.(entry.item)}>
                <span className={styles.reviewCode} aria-hidden="true">
                  <Icon name="edit" size={16} />
                </span>
                <span className={styles.reviewText}>
                  {entry.item.stepLabel}
                  <span className={styles.reviewMeta}>Remarks for this section</span>
                </span>
                <span className={styles.reviewReason}>Remarks needed</span>
              </button>
            </li>
          ) : (
            <li key={answerKey(entry.item.questionId, entry.item.direction)} className={styles.reviewItem}>
              <button type="button" className={styles.reviewJump} onClick={() => onJump(entry.item)}>
                <span className={styles.reviewCode}>Q{entry.item.index}</span>
                <span className={styles.reviewText}>
                  {entry.item.text}
                  <span className={styles.reviewMeta}>
                    {entry.item.stepLabel}
                    {entry.item.direction ? ` · ${DIRECTION_LABELS[entry.item.direction]}` : null}
                  </span>
                </span>
                <span className={styles.reviewReason}>{entry.item.reason === 'missing' ? 'Not answered' : 'Comment needed'}</span>
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
