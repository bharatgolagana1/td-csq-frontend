import { type ReactNode } from 'react';

import { RatingPill } from '@/design/primitives/Pill/Pill';
import { Skeleton } from '@/design/primitives/Skeleton/Skeleton';
import { Tag } from '@/design/primitives/Tag/Tag';
import { cn } from '@/lib/cn';
import { formatInt, formatRating } from '@/lib/format';

import { DeltaChip } from './DeltaChip';
import styles from './ScoreHero.module.css';

export type ScoreHeroProps = {
  label: ReactNode;
  /** The rating, 1 dp; null when there is no score. */
  value: number | null | undefined;
  rank?: number | null;
  rankOf?: number;
  /** Signed change vs the previous cycle. */
  delta?: number | null;
  deltaLabel?: string;
  /** One or more lines under the figure, e.g. "128 customer · 1 self". */
  caption?: ReactNode;
  /** The minimum-responses rule hid the score. */
  suppressed?: { n: number; minResponses?: number };
  provisional?: boolean;
  loading?: boolean;
  /** Extra tiles on the right (stakeholder split, counts…). */
  aside?: ReactNode;
  className?: string;
};

/** The one number a dashboard leads with (§7): rating to 1 dp in mono, band, rank of n, context lines. */
export function ScoreHero({ label, value, rank, rankOf, delta, deltaLabel, caption, suppressed, provisional, loading, aside, className }: ScoreHeroProps) {
  const hasValue = value !== null && value !== undefined && !Number.isNaN(value);
  return (
    <section className={cn(styles.root, className)} aria-busy={loading || undefined}>
      <div className={styles.main}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{label}</span>
          {provisional ? <Tag tone="outline">Provisional</Tag> : null}
        </div>
        {loading ? (
          <div className={styles.skeleton}>
            <Skeleton height={56} width={120} radius={8} />
            <Skeleton height={14} width={180} />
          </div>
        ) : suppressed ? (
          <div className={styles.suppressed}>
            <span className={styles.value} aria-label="No score yet">
              —
            </span>
            <p className={styles.rule}>
              Not enough customer responses to publish a score: <span className="num">{formatInt(suppressed.n)}</span> received
              {suppressed.minResponses !== undefined ? (
                <>
                  , minimum <span className="num">{formatInt(suppressed.minResponses)}</span>
                </>
              ) : null}
              . The rating appears once the minimum is reached.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.valueRow}>
              <span className={styles.value}>{formatRating(value)}</span>
              <span className={styles.outOf}>/ 5</span>
              {hasValue ? <RatingPill rating={value} /> : null}
              {delta !== undefined ? <DeltaChip value={delta} title={deltaLabel ?? 'vs previous cycle'} /> : null}
            </div>
            <div className={styles.lines}>
              {rank !== undefined ? (
                <span className={styles.rank}>
                  {rank === null ? (
                    'Not ranked'
                  ) : (
                    <>
                      Rank <span className="num">{rank}</span>
                      {rankOf ? (
                        <>
                          {' '}
                          of <span className="num">{rankOf}</span>
                        </>
                      ) : null}
                    </>
                  )}
                </span>
              ) : null}
              {caption ? <span className={styles.caption}>{caption}</span> : null}
            </div>
          </>
        )}
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </section>
  );
}
