import { type ReactNode } from 'react';

import { EmptyState } from '@/design/primitives/EmptyState/EmptyState';
import { Skeleton } from '@/design/primitives/Skeleton/Skeleton';
import { Tag } from '@/design/primitives/Tag/Tag';
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
  /** Figures come from a provisional (not yet SCORED) run: a tag over the plot. */
  provisional?: boolean;
  /** One quiet line under the legend ("No previous cycle of this type yet"). */
  note?: ReactNode;
  /** The plot may grow past `height` (a chart with an HTML table beside it); `height` is then a minimum. */
  autoHeight?: boolean;
  /** The plot is built from HTML that carries its own semantics (values in text): expose it as a group, not an image. */
  semantic?: boolean;
  className?: string;
  children: ReactNode;
};

/** Loading skeleton + empty state + a11y summary for every chart (§3). */
export function ChartFrame({ height, loading, empty, emptyTitle = 'No data yet', emptyDescription, summary, legend, provisional, note, autoHeight, semantic, className, children }: ChartFrameProps) {
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
          {provisional ? (
            <Tag tone="outline" className={styles.provisional}>
              Provisional
            </Tag>
          ) : null}
          <div role={semantic ? 'group' : 'img'} aria-label={summary} className={styles.plot} style={autoHeight ? { minHeight: height } : { height }}>
            {children}
          </div>
          {legend ? <div className={styles.legend}>{legend}</div> : null}
          {note ? <p className={styles.note}>{note}</p> : null}
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
