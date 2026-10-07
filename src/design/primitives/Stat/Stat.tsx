import { type ReactNode } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { Skeleton } from '../Skeleton/Skeleton';
import styles from './Stat.module.css';

export type StatDelta = {
  /** Signed change; formatted with one decimal unless `label` is given. */
  value: number;
  label?: string;
  /** Visual direction; derived from the sign when omitted. */
  direction?: 'up' | 'down' | 'flat';
  /** When a decrease is good (e.g. pending count), flip the colour. */
  invert?: boolean;
};

export type StatProps = {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  delta?: StatDelta;
  loading?: boolean;
  size?: 'md' | 'lg';
  className?: string;
};

function deltaDirection(d: StatDelta): 'up' | 'down' | 'flat' {
  if (d.direction) return d.direction;
  if (d.value > 0) return 'up';
  if (d.value < 0) return 'down';
  return 'flat';
}

/** Number in mono with a label and an optional delta chip. */
export function Stat({ label, value, unit, hint, delta, loading, size = 'md', className }: StatProps) {
  const dir = delta ? deltaDirection(delta) : null;
  const good = delta && dir !== 'flat' ? (dir === 'up') !== Boolean(delta.invert) : null;
  return (
    <div className={cn(styles.root, styles[size], className)}>
      <span className={styles.label}>{label}</span>
      {loading ? (
        <Skeleton height={size === 'lg' ? 36 : 28} width={96} />
      ) : (
        <span className={styles.row}>
          <span className={styles.value}>
            {value}
            {unit ? <span className={styles.unit}>{unit}</span> : null}
          </span>
          {delta && dir ? (
            <span className={cn(styles.delta, good === true && styles.good, good === false && styles.bad)}>
              <Icon name={dir === 'up' ? 'arrow-up' : dir === 'down' ? 'arrow-down' : 'minus'} size={16} />
              {delta.label ?? `${delta.value > 0 ? '+' : ''}${delta.value.toFixed(1)}`}
            </span>
          ) : null}
        </span>
      )}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
