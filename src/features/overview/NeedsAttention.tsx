import { Link } from 'react-router-dom';

import { type Registration } from '@/api/onboarding.types';
import { Card, Skeleton } from '@/design/primitives';
import { useShell } from '@/shell/ShellContext';
import { cn } from '@/lib/cn';
import { formatCountdown, formatInt, formatRelative } from '@/lib/format';

import styles from './overview.module.css';
import { type ShareProblem, type UnlockedOperator } from './useOverviewData';

export type NeedsAttentionProps = {
  unlocked: UnlockedOperator[];
  unlockedLoading: boolean;
  shares: ShareProblem[];
  sharesEnabled: boolean;
  sharesLoading: boolean;
  pending: Registration[];
  pendingTotal: number;
  pendingEnabled: boolean;
  pendingLoading: boolean;
};

function Calm({ children }: { children: string }) {
  return <p className={styles.calm}>{children}</p>;
}

/** Three short lists: unlocked operators, airports with shares ≠ 100, registrations awaiting review. */
export function NeedsAttention({ unlocked, unlockedLoading, shares, sharesEnabled, sharesLoading, pending, pendingTotal, pendingEnabled, pendingLoading }: NeedsAttentionProps) {
  const { href } = useShell();
  return (
    <div className={styles.attention}>
      <Card as="section" title="Operators not locked" subtitle="In open sampling windows, soonest closing first" actions={<Link to={href('/cycles')} className={styles.sectionLink}>Cycles</Link>}>
        {unlockedLoading ? (
          <Skeleton lines={3} />
        ) : unlocked.length === 0 ? (
          <Calm>Every operator in an open sampling window has locked.</Calm>
        ) : (
          <ul className={styles.list} aria-label="Operators not locked">
            {unlocked.slice(0, 8).map((u) => (
              <li key={`${u.cycle.id}-${u.participant.id}`} className={styles.item}>
                <span className={styles.itemMain}>
                  <b>
                    {u.participant.operator.name} · {u.participant.airport.iata}
                  </b>
                  <span className={styles.itemSub}>
                    {u.cycle.code} · {formatInt(u.participant.sampling.selectedCount)} / {formatInt(u.participant.requiredSampleSize)} selected
                  </span>
                </span>
                <Link to={href(`/cycles/${u.cycle.id}`)} className={cn(styles.itemValue, u.soon && styles.itemWarn)}>
                  closes in {formatCountdown(u.closesAt)}
                </Link>
              </li>
            ))}
            {unlocked.length > 8 ? <li className={cn(styles.item, styles.itemSub)}>and {formatInt(unlocked.length - 8)} more</li> : null}
          </ul>
        )}
      </Card>

      <Card as="section" title="Market shares ≠ 100 %" subtitle="Publishing refuses these airports" actions={sharesEnabled ? <Link to={href('/market-share')} className={styles.sectionLink}>Market share</Link> : undefined}>
        {!sharesEnabled ? (
          <Calm>Needs the operators.view task.</Calm>
        ) : sharesLoading ? (
          <Skeleton lines={3} />
        ) : shares.length === 0 ? (
          <Calm>Every airport with active operators totals 100 %.</Calm>
        ) : (
          <ul className={styles.list} aria-label="Airports with shares not totalling 100">
            {shares.map((s) => (
              <li key={s.airport.id} className={styles.item}>
                <span className={styles.itemMain}>
                  <b>
                    {s.airport.iata} · {s.airport.name}
                  </b>
                  <span className={styles.itemSub}>
                    {formatInt(s.operators)} active {s.operators === 1 ? 'operator' : 'operators'}
                  </span>
                </span>
                <span className={cn(styles.itemValue, styles.itemWarn)}>{s.total} %</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card as="section" title="Registrations pending" subtitle="Submitted and waiting for review" actions={pendingEnabled ? <Link to={href('/onboarding')} className={styles.sectionLink}>Onboarding</Link> : undefined}>
        {!pendingEnabled ? (
          <Calm>Needs the onboarding.review task.</Calm>
        ) : pendingLoading ? (
          <Skeleton lines={3} />
        ) : pending.length === 0 ? (
          <Calm>No registrations waiting.</Calm>
        ) : (
          <ul className={styles.list} aria-label="Registrations pending">
            {pending.map((r) => (
              <li key={r.id} className={styles.item}>
                <span className={styles.itemMain}>
                  <b>{r.organisation.name}</b>
                  <span className={styles.itemSub}>
                    {r.orgType === 'ACO' ? 'Operator' : 'Airport'}
                    {r.airport ? ` · ${r.airport.iata}` : ''} · {r.admin.email}
                  </span>
                </span>
                <span className={styles.itemValue}>{formatRelative(r.createdAt)}</span>
              </li>
            ))}
            {pendingTotal > pending.length ? <li className={cn(styles.item, styles.itemSub)}>and {formatInt(pendingTotal - pending.length)} more</li> : null}
          </ul>
        )}
      </Card>
    </div>
  );
}
