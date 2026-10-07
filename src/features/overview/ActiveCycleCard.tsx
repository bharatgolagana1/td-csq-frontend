import { Link } from 'react-router-dom';

import { type CycleSummary } from '@/api/cycles.types';
import { Card, Pill, statusVariant } from '@/design/primitives';
import { useShell } from '@/shell/ShellContext';
import { formatCountdown, formatDateTime, formatInt, humanise } from '@/lib/format';

import styles from './overview.module.css';

const DEADLINE_LABELS: Record<string, string> = {
  PUBLISHED: 'Sampling opens',
  SAMPLING_OPEN: 'Sampling closes',
  SAMPLING_CLOSED: 'Assessment opens',
  ASSESSMENT_OPEN: 'Assessment closes',
};

function deadlineOf(c: CycleSummary): string | null {
  switch (c.status) {
    case 'PUBLISHED':
      return c.sampling.start.utc;
    case 'SAMPLING_OPEN':
      return c.sampling.end.utc;
    case 'SAMPLING_CLOSED':
      return c.assessment.start.utc;
    case 'ASSESSMENT_OPEN':
      return c.assessment.end.utc;
    default:
      return null;
  }
}

export type FunnelStage = { id: string; label: string; value: number; /** Width 0..100 within its own group. */ width: number };

/**
 * Two funnels, each scaled to its own head so operators (units) are never
 * measured against invitations (counts): operators → locked, invited → completed.
 */
export function funnelStages(c: CycleSummary): FunnelStage[][] {
  const w = (value: number, of: number) => (of > 0 ? Math.max(0, Math.min(100, (value / of) * 100)) : 0);
  return [
    [
      { id: 'operators', label: 'Operators', value: c.participants.operators, width: c.participants.operators > 0 ? 100 : 0 },
      { id: 'locked', label: 'Locked', value: c.progress.locked, width: w(c.progress.locked, c.participants.operators) },
    ],
    [
      { id: 'invited', label: 'Invited', value: c.progress.invited, width: c.progress.invited > 0 ? 100 : 0 },
      { id: 'completed', label: 'Completed', value: c.progress.completed, width: w(c.progress.completed, c.progress.invited) },
    ],
  ];
}

/** One active cycle: status, next deadline countdown and the sampling → assessment funnel. */
export function ActiveCycleCard({ cycle }: { cycle: CycleSummary }) {
  const { href } = useShell();
  const deadline = deadlineOf(cycle);
  const groups = funnelStages(cycle);
  const stages = groups.flat();
  return (
    <Link to={href(`/cycles/${cycle.id}`)} className={styles.cardLink} aria-label={`${cycle.name}, ${humanise(cycle.status)}`}>
      <Card as="article">
        <div className={styles.cardTop}>
          <span className={styles.cardName}>
            <b>{cycle.name}</b>
            <span className={styles.cardCode}>
              {cycle.code} · {humanise(cycle.type)}
            </span>
          </span>
          <Pill variant={statusVariant(cycle.status)} dot>
            {humanise(cycle.status)}
          </Pill>
        </div>
        <div className={styles.deadline}>
          {deadline ? (
            <>
              <span>{DEADLINE_LABELS[cycle.status]}</span>
              <span className={styles.countdown} title={formatDateTime(deadline, cycle.tz)}>
                {formatCountdown(deadline)}
              </span>
            </>
          ) : (
            <span>Awaiting scoring</span>
          )}
        </div>
        <div className={styles.funnel} role="img" aria-label={stages.map((s) => `${s.label} ${formatInt(s.value)}`).join(', ')}>
          {groups.map((group, gi) => (
            <div key={gi} className={styles.funnelGroup}>
              {group.map((s) => (
                <FunnelRow key={s.id} label={s.label} value={s.value} width={s.width} />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}

function FunnelRow({ label, value, width }: { label: string; value: number; width: number }) {
  return (
    <>
      <span className={styles.funnelLabel}>{label}</span>
      <span className={styles.funnelTrack}>
        <span className={styles.funnelBar} style={{ width: `${Math.max(0, Math.min(100, width))}%` }} />
      </span>
      <span className={styles.funnelValue}>{formatInt(value)}</span>
    </>
  );
}
