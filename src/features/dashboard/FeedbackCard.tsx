import { type OperatorReport } from '@/api/reports.types';
import { StackedBand } from '@/design/charts';
import { Card } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import styles from './dashboard.module.css';
import { answersTotal, feedbackSegments } from './derive';

/** Feedback distribution: one stacked band, five bands + NA, count and % in the legend grid (§7). */
export function FeedbackCard({ report }: { report: OperatorReport }) {
  const total = answersTotal(report.feedbackDistribution);
  const n = report.overall.customer.n;
  return (
    <Card
      className={styles.feedback}
      title="Feedback"
      subtitle={`${formatInt(total)} answers across the questionnaire`}
      actions={
        <span className={styles.headCount}>
          <span className="num">{formatInt(n)}</span> {n === 1 ? 'response' : 'responses'}
        </span>
      }
    >
      <StackedBand
        segments={feedbackSegments(report.feedbackDistribution)}
        emptyTitle={report.overall.suppressed ? 'No answers to show' : 'No answers yet'}
        summary={`Distribution of ${formatInt(total)} answers across the rating bands`}
      />
    </Card>
  );
}
