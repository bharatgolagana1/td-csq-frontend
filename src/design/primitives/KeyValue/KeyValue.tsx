import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './KeyValue.module.css';

export type KeyValueItem = { key: ReactNode; value: ReactNode; mono?: boolean };

export type KeyValueProps = {
  items: KeyValueItem[];
  columns?: 1 | 2 | 3;
  /** Horizontal label/value rows instead of stacked pairs. */
  layout?: 'stacked' | 'rows';
  className?: string;
};

export function KeyValue({ items, columns = 2, layout = 'stacked', className }: KeyValueProps) {
  return (
    <dl className={cn(styles.root, styles[layout], styles[`cols-${columns}`], className)}>
      {items.map((item, i) => (
        <div key={i} className={styles.pair}>
          <dt className={styles.key}>{item.key}</dt>
          <dd className={cn(styles.value, item.mono && styles.mono)}>{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
