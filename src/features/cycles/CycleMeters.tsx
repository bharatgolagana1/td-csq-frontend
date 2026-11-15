import { type CycleSummary } from '@/api/cycles.types';
import { readyToSendHint } from '@/api/invitations.types';
import { formatInt } from '@/lib/format';

import { pct } from './cycleLabels';
import styles from './cycles.module.css';

export type CycleMetersProps = {
  cycle: Pick<CycleSummary, 'participants' | 'progress' | 'status'>;
};

/**
 * Locked operators (of participating), invitations e-mailed (of the invitations
 * the locked samples prepared: sent plus ready to send) and assessments
 * completed (of invited). Each denominator holds its numerator, so no meter
 * passes 100 % (operators × minimum sample did: operators lock more than the
 * minimum, and a BOTH cycle invites a customer once per survey). One hue, thin
 * tracks, the number beside each bar is the label. Until the assessment opens,
 * a note says how many invitations are ready to send.
 */
export function CycleMeters({ cycle }: CycleMetersProps) {
  const { participants, progress } = cycle;
  const prepared = progress.invited + (progress.readyToSend ?? 0);
  const rows = [
    { id: 'locked', label: 'Locked', value: progress.locked, of: participants.operators, pct: pct(progress.locked, participants.operators) },
    { id: 'invited', label: 'Invited', value: progress.invited, of: prepared, pct: pct(progress.invited, prepared) },
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
      {progress.readyToSend ? (
        <span className={styles.meterNote} title={readyToSendHint(progress.readyToSend) ?? undefined}>
          {formatInt(progress.readyToSend)} ready to send
        </span>
      ) : null}
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
