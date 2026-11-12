import { useState } from 'react';

import { Textarea } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { formatInt } from '@/lib/format';

import styles from './QuestionCard.module.css';
import { hasRemark, REMARK_MAX_LENGTH, remarkDomId } from './rules';

export type SectionRemarkFieldProps = {
  /** The section's category id. */
  categoryId: string;
  /** The section's name ("Remarks for Cargo handling"). */
  section: string;
  value: string;
  onChange: (remark: string) => void;
  /** Show the missing-remark error before the field was left (after Next, or a jump from review). */
  showValidation?: boolean;
  readOnly?: boolean;
  className?: string;
};

/**
 * The section's remark, required before submitting (one per category, also on
 * an import/export form). Validation is inline like a question's comment: the
 * error appears once the field was left empty or the step was validated.
 */
export function SectionRemarkField({ categoryId, section, value, onChange, showValidation = false, readOnly = false, className }: SectionRemarkFieldProps) {
  const [touched, setTouched] = useState(false);
  const error = !readOnly && (showValidation || touched) && !hasRemark(value) ? 'Add remarks for this section' : undefined;
  return (
    <div className={cn(styles.card, className)}>
      <Textarea
        id={remarkDomId(categoryId)}
        label={`Remarks for ${section}`}
        hint={`${formatInt(value.length)} / ${formatInt(REMARK_MAX_LENGTH)} characters`}
        error={error}
        required
        value={value}
        rows={4}
        maxLength={REMARK_MAX_LENGTH}
        placeholder="What stands out in this section as a whole: what works well, what should change"
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
      />
    </div>
  );
}
