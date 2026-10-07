import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { formatInt } from '@/lib/format';

import { ChartFrame } from './ChartFrame';
import styles from './StackedBand.module.css';
import { ratingColor, useChartTokens } from './tokens';

export type BandSegment = {
  /** 5 = Excellent … 1 = Poor, null = NA. Picks the ramp colour; NA is a hatched tail. */
  rating: 1 | 2 | 3 | 4 | 5 | null;
  label: string;
  count: number;
  /** Share of the total, 0–100; computed from the counts when omitted. */
  pct?: number;
};

export type StackedBandProps = {
  segments: BandSegment[];
  /** Band thickness. */
  height?: number;
  /** `grid`: dot · label · "count · pct" cells under the band. `none`: the band alone (the caller labels it). */
  legend?: 'grid' | 'none';
  loading?: boolean;
  provisional?: boolean;
  summary?: string;
  emptyTitle?: ReactNode;
  className?: string;
};

function share(seg: BandSegment, total: number): number {
  if (seg.pct !== undefined) return seg.pct;
  return total > 0 ? (seg.count / total) * 100 : 0;
}

/**
 * Part-to-whole as one horizontal band: rounded ends, a 2px surface gap between
 * segments, NA as a hatched tail. The legend grid carries every count and share,
 * so nothing is gated behind the hover tooltip.
 */
export function StackedBand({ segments, height = 28, legend: legendKind = 'grid', loading, provisional, summary, emptyTitle, className }: StackedBandProps) {
  const t = useChartTokens();
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const empty = !loading && total === 0;
  const shown = segments.filter((s) => s.count > 0);

  const legend =
    legendKind === 'grid' ? (
      <ul className={styles.legend}>
        {segments.map((s) => (
          <li key={s.label} className={styles.item}>
            <span className={cn(styles.dot, s.rating === null && styles.dotNa)} style={{ background: ratingColor(t, s.rating) }} aria-hidden="true" />
            <span className={styles.itemLabel}>{s.label}</span>
            <span className={styles.itemValue}>
              <span className="num">{formatInt(s.count)}</span>
              <span className={styles.sep}> · </span>
              <span className="num">{share(s, total).toFixed(0)} %</span>
            </span>
          </li>
        ))}
      </ul>
    ) : undefined;

  return (
    <ChartFrame height={height} autoHeight loading={loading} empty={empty} emptyTitle={emptyTitle} provisional={provisional} summary={summary} legend={legend} className={className}>
      <div className={styles.band} style={{ height }}>
        {shown.map((s) => {
          const pct = share(s, total);
          return (
            <div key={s.label} className={cn(styles.seg, s.rating === null && styles.na)} style={{ flexGrow: pct, background: ratingColor(t, s.rating) }}>
              <span className={styles.tip} aria-hidden="true">
                {s.label} <span className="num">{formatInt(s.count)}</span> · <span className="num">{pct.toFixed(0)} %</span>
              </span>
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
}
