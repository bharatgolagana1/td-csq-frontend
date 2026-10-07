import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
