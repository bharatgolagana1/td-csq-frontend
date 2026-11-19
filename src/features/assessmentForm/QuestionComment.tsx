import { Textarea } from '@/design/primitives';

import styles from './QuestionCard.module.css';

/** One compact, optional comment field per question. */
export function QuestionComment({ value, onChange, readOnly = false }: { value: string; onChange: (value: string) => void; readOnly?: boolean }) {
  return (
    <Textarea
      label="Comment"
      aria-label="Comment (optional)"
      placeholder="Add a comment (optional)"
      value={value}
      rows={1}
      maxLength={2000}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
      wrapperClassName={styles.comment}
      className={styles.commentInput}
    />
  );
}
