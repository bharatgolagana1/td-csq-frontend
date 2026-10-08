import { type OperatorReport } from '@/api/reports.types';
import { Card, EmptyState } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/format';

import styles from './dashboard.module.css';
import { nationalSplit, pendingFootnote, unlistedAirports } from './derive';

/** All-India: airports by weighted rating, rank and rating in mono, the operator's own airport highlighted (§7). */
export function NationalCard({ report }: { report: OperatorReport }) {
  const { ranked, pending } = nationalSplit(report.nationalTable);
  const footnote = pendingFootnote(pending, unlistedAirports(report));
  return (
    <Card
      className={styles.national}
      title="All-India ratings & rankings"
      subtitle="Airports by market-share weighted rating"
      padding="none"
      footer={
        <div className={styles.nationalFoot}>
          {footnote ? <p>{footnote}</p> : null}
          <p>Airport ratings and ranks only — other operators’ figures are never shared.</p>
        </div>
      }
    >
      {ranked.length === 0 ? (
        <div className={styles.nationalEmpty}>
          <EmptyState icon="chart" size="sm" title={report.provisional ? 'Ranked once the cycle is scored' : 'No ranking yet'} />
        </div>
      ) : (
        <table className={styles.rankTable}>
          <caption className="visually-hidden">Ranking</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.rankCol}>
                Rank
              </th>
              <th scope="col">Airport · cargo terminal</th>
              <th scope="col" className={styles.ratingCol}>
                Rating
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r) => {
              const mine = r.isOwn;
              return (
                <tr key={r.airportIata} className={cn(mine && styles.highlight)} aria-current={mine ? 'true' : undefined}>
                  <td className={styles.rankCell}>{r.rank ?? '—'}</td>
                  <td>
                    <span className={styles.airport}>
                      <span className={styles.airportName}>{r.airportName}</span>
                      <span className={styles.airportIata}>{r.airportIata}</span>
                      {mine ? <span className={styles.you}>You</span> : null}
                    </span>
                  </td>
                  <td className={styles.ratingCell}>{formatRating(r.rating)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
