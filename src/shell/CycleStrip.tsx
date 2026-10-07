import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useCurrentCycles } from '@/api/sampling';
import { type CurrentCycle } from '@/api/sampling.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Pill, statusVariant } from '@/design/primitives/Pill/Pill';
import { cn } from '@/lib/cn';
import { formatCountdown, formatDateTime, humanise } from '@/lib/format';

import styles from './CycleStrip.module.css';
import { useShell } from './ShellContext';

export type CycleStripProps = {
  cycleName: string;
  cycleCode?: string;
  /** Cycle status code, e.g. SAMPLING_OPEN. */
  phase: string;
  /** ISO instant of the next deadline; null when none. */
  deadlineAt: string | null;
  /** "Sampling closes" / "Assessment closes". */
  deadlineLabel?: string;
  tz?: string;
  /** Sampling counter; omit when not in sampling. */
  selected?: number;
  required?: number;
  /** Where the primary action goes (default /sampling). */
  to?: string;
  actionLabel?: string;
};

const SAMPLING_PHASE = new Set(['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED']);

export type StripAccess = { canSample: boolean; canSelfAssess: boolean };

/** The entry to show when an operator is in several cycles: the nearest deadline, else the first (oldest sampling start). */
export function pickCurrent(entries: readonly CurrentCycle[]): CurrentCycle | null {
  if (entries.length === 0) return null;
  const dated = entries.filter((e) => e.nextDeadline !== null).sort((a, b) => (a.nextDeadline?.at ?? '').localeCompare(b.nextDeadline?.at ?? ''));
  return dated[0] ?? entries[0] ?? null;
}

/** Pure mapping of a `GET /cycles/current` entry to the strip (ARCHITECTURE §4). */
export function stripPropsFrom(entry: CurrentCycle | null | undefined, access: StripAccess = { canSample: true, canSelfAssess: true }): CycleStripProps | null {
  if (!entry) return null;
  const { cycle, participant, nextDeadline } = entry;
  const inSampling = SAMPLING_PHASE.has(cycle.status);
  const locked = participant.sampling.status === 'LOCKED';
  const base: CycleStripProps = {
    cycleName: cycle.name,
    cycleCode: cycle.code,
    phase: cycle.status,
    tz: cycle.tz,
    deadlineAt: nextDeadline?.at ?? null,
    deadlineLabel: nextDeadline ? humanise(nextDeadline.kind) : 'No deadline',
  };
  if (inSampling) {
    const to = access.canSample ? '/sampling' : '/dashboard';
    return { ...base, selected: participant.sampling.selectedCount, required: participant.requiredSampleSize, to, actionLabel: access.canSample ? (locked ? 'View sample' : 'Go to sampling') : 'Dashboard' };
  }
  if (cycle.status === 'ASSESSMENT_OPEN' && access.canSelfAssess) return { ...base, to: '/self-assessment', actionLabel: 'Self-assessment' };
  return { ...base, to: '/dashboard', actionLabel: 'Dashboard' };
}

/** Operator shells only: the strip data from `GET /cycles/current` (null hides the strip). */
export function useCycleStripProps(): CycleStripProps | null {
  const { scope, hasTask } = useSession();
  const acoId = scope.kind === 'ACO' ? scope.acoId : '';
  const query = useCurrentCycles(acoId, acoId !== '' && hasTask('cycles.view'));
  const canSample = hasTask('sampling.view');
  const canSelfAssess = hasTask('assessments.self');
  return useMemo(() => stripPropsFrom(pickCurrent(query.data ?? []), { canSample, canSelfAssess }), [query.data, canSample, canSelfAssess]);
}

function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Operator strip under the topbar: cycle, phase, deadline countdown, selected/required (§4). */
export function CycleStrip({ cycleName, cycleCode, phase, deadlineAt, deadlineLabel = 'Closes', tz, selected, required, to = '/sampling', actionLabel = 'Go to sampling' }: CycleStripProps) {
  const now = useNow();
  const { href } = useShell();
  const hasCounter = typeof selected === 'number' && typeof required === 'number';
  const pct = hasCounter && required > 0 ? Math.min(100, (selected / required) * 100) : 0;
  const met = hasCounter && selected >= required;

  return (
    <div className={styles.root} role="region" aria-label="Current cycle">
      <div className={styles.cycle}>
        <Icon name="cycles" size={18} className={styles.icon} />
        <span className={styles.name}>{cycleName}</span>
        {cycleCode ? <span className={styles.code}>{cycleCode}</span> : null}
        <Pill variant={statusVariant(phase)} size="sm">
          {humanise(phase)}
        </Pill>
      </div>
      <div className={styles.deadline}>
        {deadlineAt ? (
          <>
            <span className={styles.deadlineLabel}>{deadlineLabel}</span>
            <span className={styles.countdown} title={formatDateTime(deadlineAt, tz)}>
              {formatCountdown(deadlineAt, now)}
            </span>
          </>
        ) : (
          <span className={styles.deadlineLabel}>No deadline</span>
        )}
      </div>
      {hasCounter ? (
        <div className={styles.counter} aria-label={`${selected} of ${required} selected`}>
          <span className={cn(styles.count, met && styles.met)}>
            {selected} / {required}
          </span>
          <span className={styles.counterLabel}>selected</span>
          <span className={styles.bar} aria-hidden="true">
            <span className={cn(styles.fill, met && styles.fillMet)} style={{ width: `${pct}%` }} />
          </span>
        </div>
      ) : null}
      <Link to={href(to)} className={styles.action}>
        {actionLabel}
        <Icon name="chevron-right" size={16} />
      </Link>
    </div>
  );
}
