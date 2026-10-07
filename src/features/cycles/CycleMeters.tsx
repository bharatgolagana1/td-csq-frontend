import { type CycleSummary } from '@/api/cycles.types';
import { formatInt } from '@/lib/format';

import { pct } from './cycleLabels';
import styles from './cycles.module.css';

export type CycleMetersProps = {
  cycle: Pick<CycleSummary, 'participants' | 'progress' | 'minSampleSize' | 'status'>;
};

/**
 * Locked operators (of participating), invitations sent (against the expected
 * sample of operators × minimum size) and assessments completed (of invited).
 * One hue, thin tracks, the number beside each bar is the label.
 */
export function CycleMeters({ cycle }: CycleMetersProps) {
  const { participants, progress, minSampleSize } = cycle;
  const expectedInvites = participants.operators * minSampleSize;
  const rows = [
    { id: 'locked', label: 'Locked', value: progress.locked, of: participants.operators, pct: pct(progress.locked, participants.operators) },
    { id: 'invited', label: 'Invited', value: progress.invited, of: expectedInvites, pct: pct(progress.invited, expectedInvites) },
    { id: 'completed', label: 'Completed', value: progress.completed, of: progress.invited, pct: pct(progress.completed, progress.invited) },
  ];
  if (cycle.status === 'DRAFT') {
    return <span className={styles.muted}>—</span>;
  }
  return (
    <div className={styles.meters} role="group" aria-label="Progress">
      {rows.map((r) => (
        <MeterRow key={r.id} {...r} />
      ))}
    </div>
  );
}

function MeterRow({ label, value, of, pct: fill }: { label: string; value: number; of: number; pct: number }) {
  const text = of > 0 ? `${formatInt(value)} / ${formatInt(of)}` : formatInt(value);
  return (
    <>
      <span className={styles.meterLabel}>{label}</span>
      <span className={styles.meterTrack} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill)}>
        <span className={styles.meterFill} style={{ width: `${fill}%` }} />
      </span>
      <span className={styles.meterValue}>{text}</span>
    </>
  );
}
