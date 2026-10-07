import { useMemo } from 'react';

import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

import styles from './cycles.module.css';
import { type CycleWindows, timelineLayout, wallToDate } from './derive';

export type WindowTimelineProps = {
  windows: CycleWindows;
  tz: string;
  /** For tests and stories. */
  now?: Date;
  className?: string;
};

/**
 * Two-window timeline: sampling in the accent, assessment in the muted series
 * grey, both labelled directly (identity is never colour alone), a dashed
 * "today" marker when today falls inside the span.
 */
export function WindowTimeline({ windows, tz, now, className }: WindowTimelineProps) {
  const layout = useMemo(() => timelineLayout(windows, tz, now ?? new Date()), [windows, tz, now]);
  if (!layout) {
    return (
      <p className={cn(styles.tlEmpty, className)} role="status">
        Set all four dates to see the timeline.
      </p>
    );
  }
  const s0 = wallToDate(windows.sampling.start, tz);
  const a1 = wallToDate(windows.assessment.end, tz);
  const summary = `Sampling ${layout.days.sampling} days, assessment ${layout.days.assessment} days, from ${formatDate(s0, tz)} to ${formatDate(a1, tz)}.`;
  return (
    <figure className={cn(styles.tl, className)} aria-label={summary}>
      <div className={styles.tlTrack} aria-hidden="true">
        <span className={cn(styles.tlBar, styles.tlSampling)} style={{ left: `${layout.sampling.left}%`, width: `${layout.sampling.width}%` }}>
          <span className={styles.tlBarLabel}>Sampling · {layout.days.sampling} d</span>
        </span>
        <span className={cn(styles.tlBar, styles.tlAssessment)} style={{ left: `${layout.assessment.left}%`, width: `${layout.assessment.width}%` }}>
          <span className={styles.tlBarLabel}>Assessment · {layout.days.assessment} d</span>
        </span>
        {layout.today !== null ? (
          <span className={styles.tlToday} style={{ left: `${layout.today}%` }}>
            <span className={styles.tlTodayLabel}>Today</span>
          </span>
        ) : null}
      </div>
      <figcaption className={styles.tlLabels}>
        <span className={styles.tlLabel}>{formatDate(s0, tz)}</span>
        <span className={styles.tlLabel}>{formatDate(a1, tz)}</span>
      </figcaption>
      <div className={styles.tlLegend}>
        <span className={styles.tlLegendItem}>
          <span className={cn(styles.tlDot, styles.tlDotSampling)} aria-hidden="true" />
          Sampling · {layout.days.sampling} days
        </span>
        <span className={styles.tlLegendItem}>
          <span className={cn(styles.tlDot, styles.tlDotAssessment)} aria-hidden="true" />
          Assessment · {layout.days.assessment} days
        </span>
      </div>
    </figure>
  );
}
