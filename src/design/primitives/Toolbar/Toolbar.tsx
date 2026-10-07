import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './Toolbar.module.css';

export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  /** Right-aligned slot. */
  end?: ReactNode;
  children?: ReactNode;
};

/** Filters row above a table: search, selects, counters on the left; actions on the right. */
export function Toolbar({ end, className, children, ...rest }: ToolbarProps) {
  return (
    <div className={cn(styles.root, className)} {...rest}>
      <div className={styles.start}>{children}</div>
      {end ? <div className={styles.end}>{end}</div> : null}
    </div>
  );
}

export function ToolbarCount({ children }: { children: ReactNode }) {
  return <span className={styles.count}>{children}</span>;
}
