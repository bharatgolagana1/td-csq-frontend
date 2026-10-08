import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './DeltaChip.module.css';

export type DeltaChipProps = {
  /** Signed change vs the previous cycle; null when unknown. */
  value: number | null | undefined;
  /** When a decrease is good, flip the colour. */
  invert?: boolean;
  /** Decimal places (ratings: 1). */
  digits?: number;
  /** Below this absolute value the change reads as flat. */
  flatBelow?: number;
  size?: 'sm' | 'md';
  /** Screen-reader context, e.g. "vs previous cycle". */
  title?: string;
  className?: string;
};

/** "▲ +0.3" / "▼ −0.2" / "— 0.0" delta chip in mono; colour = direction × whether up is good. */
export function DeltaChip({ value, invert, digits = 1, flatBelow = 0.05, size = 'md', title = 'vs previous cycle', className }: DeltaChipProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className={cn(styles.root, styles.none, styles[size], className)} aria-label={`No change figure ${title}`}>
        —
      </span>
    );
  }
  const dir: 'up' | 'down' | 'flat' = Math.abs(value) < flatBelow ? 'flat' : value > 0 ? 'up' : 'down';
  const good = dir === 'flat' ? null : (dir === 'up') !== Boolean(invert);
  // A flat change carries no sign, so −0.04 reads "0.0" rather than "−0.0".
  const text = `${dir === 'up' ? '+' : dir === 'down' ? '−' : ''}${Math.abs(value).toFixed(digits)}`;
  return (
    <span className={cn(styles.root, styles[size], good === true && styles.good, good === false && styles.bad, className)} title={title} aria-label={`${text} ${title}`}>
      <Icon name={dir === 'up' ? 'arrow-up' : dir === 'down' ? 'arrow-down' : 'minus'} size={16} />
      {text}
    </span>
  );
}
