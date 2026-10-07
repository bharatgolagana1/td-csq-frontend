import { type ReactNode } from 'react';

import { Tag } from '@/design/primitives/Tag/Tag';
import { Tooltip } from '@/design/primitives/Tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { formatInt, formatRating } from '@/lib/format';

import { ChartFrame, LegendDot } from './ChartFrame';
import { DeltaChip } from './DeltaChip';
import styles from './PairedBars.module.css';
import { useChartTokens } from './tokens';

export type PairedBarRow = {
  id: string;
  label: string;
  /** Smaller line under the label (the parent category of a subcategory). */
  sublabel?: string;
  current: number | null;
  previous: number | null;
  /** `current − previous`; null when either side is unknown. */
  delta: number | null;
  /** Self-assessment, shown as a marker on the current bar. */
  self?: number | null;
  /** Responses behind `current` (tooltip). */
  n?: number;
  /** The minimum-responses rule hid the figure. */
  suppressed?: boolean;
};

export type PairedBarsProps = {
  rows: PairedBarRow[];
  min?: number;
  max?: number;
  /** Series names for the legend and tooltip. */
  labels?: { current?: string; previous?: string; self?: string };
  loading?: boolean;
  provisional?: boolean;
  summary?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  className?: string;
};

const ROW_H = 46;

/**
 * One row per item: the current figure over the previous one as two thin
 * horizontal bars on a light track, the self figure as a marker on the current
 * bar, and the value + delta chip right-aligned. Hover reveals the exact figures;
 * every value is also in the table twin the caller offers.
 */
export function PairedBars({ rows, min = 0, max = 5, labels, loading, provisional, summary, emptyTitle = 'No categories', emptyDescription, className }: PairedBarsProps) {
  const t = useChartTokens();
  const names = { current: 'Current', previous: 'Previous', self: 'Self', ...labels };
  const span = Math.max(0.0001, max - min);
  const pct = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? null : Math.max(0, Math.min(100, ((v - min) / span) * 100)));
  const empty = !loading && rows.length === 0;
  const hasPrevious = rows.some((r) => r.previous !== null);
  const hasSelf = rows.some((r) => r.self !== null && r.self !== undefined);

  const legend = (
    <>
      <LegendDot color={t.customer} label={names.current} />
      {hasPrevious ? <LegendDot color={t.previous} label={names.previous} /> : null}
      {hasSelf ? (
        <span className={styles.legendItem}>
          <span className={styles.legendMarker} aria-hidden="true" />
          {names.self}
        </span>
      ) : null}
    </>
  );

  return (
    <ChartFrame height={Math.max(ROW_H * 2, rows.length * ROW_H)} autoHeight semantic loading={loading} empty={empty} emptyTitle={emptyTitle} emptyDescription={emptyDescription} provisional={provisional} summary={summary} legend={legend} className={className}>
      <ol className={styles.rows}>
        {rows.map((r) => {
          const cur = pct(r.current);
          const prev = pct(r.previous);
          const self = pct(r.self);
          const selfText = `${names.self} ${formatRating(r.self)}`;
          return (
            <li key={r.id} className={styles.row}>
              <span className={styles.label}>
                <span className={styles.labelMain}>{r.label}</span>
                {r.sublabel ? <span className={styles.labelSub}>{r.sublabel}</span> : null}
              </span>
              <div className={styles.bars}>
                <div className={styles.track}>
                  {cur !== null ? <div className={styles.current} style={{ width: `${cur}%` }} /> : null}
                  {self !== null ? (
                    <span className={styles.markerAt} style={{ left: `${self}%` }}>
                      <Tooltip content={selfText}>
                        <button type="button" className={styles.marker} aria-label={selfText} />
                      </Tooltip>
                    </span>
                  ) : null}
                </div>
                <div className={cn(styles.track, styles.trackPrev)}>{prev !== null ? <div className={styles.previous} style={{ width: `${prev}%` }} /> : null}</div>
                <span className={styles.tip} aria-hidden="true">
                  {names.current} <span className="num">{formatRating(r.current)}</span>
                  {r.n !== undefined ? (
                    <>
                      {' '}
                      · n <span className="num">{formatInt(r.n)}</span>
                    </>
                  ) : null}
                  <br />
                  {names.previous} <span className="num">{formatRating(r.previous)}</span>
                  {r.self !== undefined ? (
                    <>
                      <br />
                      {names.self} <span className="num">{formatRating(r.self)}</span>
                    </>
                  ) : null}
                </span>
              </div>
              <span className={styles.figures}>
                {r.suppressed ? (
                  <Tag tone="outline">Suppressed</Tag>
                ) : (
                  <>
                    <span className={styles.value}>{formatRating(r.current)}</span>
                    <DeltaChip value={r.delta} size="sm" title={`vs ${names.previous.toLowerCase()}`} />
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </ChartFrame>
  );
}
