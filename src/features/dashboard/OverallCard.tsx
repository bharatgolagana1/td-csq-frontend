import { type OperatorReport } from '@/api/reports.types';
import { GroupedBar } from '@/design/charts';
import { Card } from '@/design/primitives';
import { formatRating } from '@/lib/format';

import styles from './dashboard.module.css';
import { overallSeries } from './derive';

/** Self vs customer grouped bars: overall, this cycle, previous cycle. The page header and the hero carry the provisional flag. */
export function OverallCard({ report }: { report: OperatorReport }) {
  const { categories, series, note } = overallSeries(report);
  return (
    <Card className={styles.overall} title="Overall ratings" subtitle="Customer feedback against the self-assessment">
      <GroupedBar
        categories={categories}
        series={series}
        height={236}
        note={note}
        summary={`Customer rating ${formatRating(report.overall.customer.mean)} against self ${formatRating(report.overall.self.mean)}`}
      />
    </Card>
  );
}
