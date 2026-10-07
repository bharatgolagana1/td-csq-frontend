import { type OperatorReport } from '@/api/reports.types';
import { DeltaChip } from '@/design/charts';
import { Card, RatingPill, Stat, Tag } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { formatInt, formatRating } from '@/lib/format';

import styles from './dashboard.module.css';
import { heroCounts, heroDelta } from './derive';

function responses(n: number): string {
  return `${formatInt(n)} ${n === 1 ? 'response' : 'responses'}`;
}

/** The dark hero: selected operator, the one rating, rank of n, counts, and the FF / CB split as two tiles (§7). */
export function HeroCard({ report, minResponses }: { report: OperatorReport; minResponses?: number }) {
  const { overall, byStakeholder, operator, provisional, comparison } = report;
  const suppressed = overall.suppressed === 'INSUFFICIENT_RESPONSES';
  const value = overall.customer.mean;
  const airport = operator.airport;
  return (
    <Card className={cn(styles.hero, styles.inverse)} aria-label="Selected operator">
      <div className={styles.heroInner}>
        <div className={styles.heroHead}>
          <div>
            <p className={styles.eyebrow}>Selected operator</p>
            <h3 className={styles.heroName}>{operator.name}</h3>
            <p className={styles.heroAirport}>{airport ? `${airport.name} · ${airport.iata}` : operator.code}</p>
          </div>
          {provisional ? <Tag tone="outline">Provisional</Tag> : null}
        </div>

        {suppressed ? (
          <div className={styles.heroSuppressed}>
            <span className={cn(styles.heroValue, styles.heroValueNone)} aria-label="No score yet">
              —
            </span>
            <span className={styles.heroLabel}>Overall rating</span>
            <p className={styles.heroRule}>
              Not enough customer responses to publish a score: <span className="num">{formatInt(overall.customer.n)}</span> received
              {minResponses !== undefined ? (
                <>
                  , minimum <span className="num">{formatInt(minResponses)}</span>
                </>
              ) : null}
              . The rating appears once the minimum is reached.
            </p>
          </div>
        ) : (
          <div className={styles.heroBody}>
            <div className={styles.heroRating}>
              <span className={styles.heroValue}>{formatRating(value)}</span>
              <span className={styles.heroLabel}>Overall rating</span>
              <div className={styles.heroPills}>
                {value !== null ? <RatingPill rating={value} /> : null}
                <DeltaChip value={heroDelta(report)} title={comparison.previous ? `vs ${comparison.previous.cycleName}` : 'vs previous cycle'} />
              </div>
            </div>
            <div className={styles.heroRank}>
              <span className={cn(styles.rankPill, overall.rank === null && styles.rankPillMuted)}>
                {overall.rank === null ? (
                  'Not ranked'
                ) : (
                  <>
                    Rank <span className="num">{overall.rank}</span> of <span className="num">{overall.rankOf}</span>
                  </>
                )}
              </span>
              <span className={styles.heroCounts}>{heroCounts(report)}</span>
            </div>
          </div>
        )}

        <div className={styles.heroTiles}>
          <Stat className={styles.heroTile} label="Freight forwarders" value={formatRating(byStakeholder.FF.mean)} hint={responses(byStakeholder.FF.n)} />
          <Stat className={styles.heroTile} label="Customs brokers" value={formatRating(byStakeholder.CB.mean)} hint={responses(byStakeholder.CB.n)} />
        </div>
      </div>
    </Card>
  );
}
