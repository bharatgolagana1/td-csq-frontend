import { type ReactNode } from 'react';

import { EmptyState } from '@/design/primitives/EmptyState/EmptyState';
import { Skeleton } from '@/design/primitives/Skeleton/Skeleton';
import { cn } from '@/lib/cn';

import styles from './ChartFrame.module.css';

export type ChartFrameProps = {
  height: number;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  /** Accessible summary of the chart for screen readers. */
  summary?: string;
  /** Optional HTML legend rendered under the plot. */
  legend?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Loading skeleton + empty state + a11y summary for every chart (§3). */
export function ChartFrame({ height, loading, empty, emptyTitle = 'No data yet', emptyDescription, summary, legend, className, children }: ChartFrameProps) {
  return (
    <div className={cn(styles.root, className)} style={{ minHeight: height }}>
      {loading ? (
        <div className={styles.skeleton} style={{ height }} aria-busy="true">
          <Skeleton height="100%" radius={8} />
        </div>
      ) : empty ? (
        <div style={{ height }} className={styles.empty}>
          <EmptyState icon="chart" title={emptyTitle} description={emptyDescription} size="sm" />
        </div>
      ) : (
        <>
          <div role="img" aria-label={summary} className={styles.plot} style={{ height }}>
            {children}
          </div>
          {legend ? <div className={styles.legend}>{legend}</div> : null}
        </>
      )}
    </div>
  );
}

export function LegendDot({ color, label }: { color: string; label: ReactNode }) {
  return (
    <span className={styles.legendItem}>
      <span className={styles.legendDot} style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
