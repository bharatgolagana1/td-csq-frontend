import { cn } from '@/lib/cn';

import styles from './QuestionCard.module.css';
import { RATING_OPTIONS, type RatingValue } from './rules';

export type RatingScaleProps = {
  /** Radio group name; unique per question. */
  name: string;
  value: RatingValue | null;
  onChange: (value: RatingValue) => void;
  disabled?: boolean;
  /** id of the element naming the group (the question text). */
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  className?: string;
};

/**
 * The six-option segmented rating (Excellent … Poor, NA) as a native radio
 * group: Tab reaches it, arrows move the choice, every cell is ≥ 44 px. The
 * ACFI ramp colour appears only on the selected cell (ARCHITECTURE §3).
 */
export function RatingScale({ name, value, onChange, disabled, labelledBy, describedBy, invalid, className }: RatingScaleProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required="true"
      className={cn(styles.scale, invalid && styles.scaleInvalid, disabled && styles.scaleDisabled, className)}
    >
      {RATING_OPTIONS.map((option) => {
        const key = String(option.value);
        return (
          <label key={key} className={styles.cell} data-rating={key}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={key}
              checked={value === option.value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.face}>
              <span className={styles.faceNum} aria-hidden="true">
                {key}
              </span>
              {option.value === 'NA' ? 'Not applicable' : option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
