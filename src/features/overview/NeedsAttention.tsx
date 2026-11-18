import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { errorMessage, errorRequestId } from '@/api/client';
import { useSendReminders } from '@/api/cycles';
import { type Registration } from '@/api/onboarding.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Card, ConfirmDialog, IconButton, Skeleton, useToast } from '@/design/primitives';
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
  const { hasTask, scope } = useSession();
  const canRemind = scope.kind === 'PLATFORM' && hasTask('cycles.operate') && hasTask('notifications.send');
  const reminders = useSendReminders();
  const toast = useToast();
  const [target, setTarget] = useState<UnlockedOperator | null>(null);
  const [sent, setSent] = useState<Set<string>>(() => new Set());
  const sending = useRef(false);
  const reminderKey = (u: UnlockedOperator) => `${u.cycle.id}:${u.participant.operator.id}`;
  const sendReminder = () => {
    if (!target || !canRemind || sending.current || sent.has(reminderKey(target))) return;
    sending.current = true;
    const key = reminderKey(target);
    reminders.mutate({ id: target.cycle.id, kind: 'SAMPLING', acoId: target.participant.operator.id }, {
      onSuccess: (run) => {
        if (run.sent > 0) {
          setSent((previous) => new Set(previous).add(key));
          toast.success(`Reminder sent to ${target.participant.operator.name}`);
        } else {
          toast.info('No reminder sent. The operator may already have locked its sample.');
        }
        setTarget(null);
      },
      onError: (error) => {
        toast.error(errorMessage(error), { requestId: errorRequestId(error) });
        setTarget(null);
      },
      onSettled: () => { sending.current = false; },
    });
  };
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
                {canRemind ? (
                  <IconButton
                    label={sent.has(reminderKey(u)) ? `Reminder sent to ${u.participant.operator.name}` : `Send reminder to ${u.participant.operator.name}`}
                    icon={<Icon name={sent.has(reminderKey(u)) ? 'check' : 'bell'} size={16} />}
                    size="sm"
                    disabled={reminders.isPending || sent.has(reminderKey(u))}
                    aria-busy={reminders.isPending && target !== null && reminderKey(target) === reminderKey(u)}
                    onClick={() => setTarget(u)}
                  />
                ) : null}
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

      <Card as="section" title="Onboarding pending" subtitle="Submitted and waiting for review" actions={pendingEnabled ? <Link to={href('/onboarding?tab=requests')} className={styles.sectionLink}>Onboarding</Link> : undefined}>
        {!pendingEnabled ? (
          <Calm>Needs the onboarding.review task.</Calm>
        ) : pendingLoading ? (
          <Skeleton lines={3} />
        ) : pending.length === 0 ? (
          <Calm>No registrations waiting.</Calm>
        ) : (
          <ul className={styles.list} aria-label="Onboarding pending">
            {pending.map((r) => (
              <li key={r.id} className={styles.item}>
                <Link to={href(`/registrations/${r.id}`)} className={cn(styles.itemMain, styles.requestLink)}>
                  <b>{r.organisation.name}</b>
                  <span className={styles.itemSub}>
                    {r.orgType === 'ACO' ? 'Operator' : 'Airport'}
                    {r.airport ? ` · ${r.airport.iata}` : ''} · {r.admin.email}
                  </span>
                </Link>
                <span className={styles.itemValue}>{formatRelative(r.createdAt)}</span>
              </li>
            ))}
            {pendingTotal > pending.length ? <li className={cn(styles.item, styles.itemSub)}>and {formatInt(pendingTotal - pending.length)} more</li> : null}
          </ul>
        )}
      </Card>
      <ConfirmDialog open={target !== null} onClose={() => setTarget(null)} onConfirm={sendReminder} title="Send sampling reminder?" description={target ? `Send a reminder to ${target.participant.operator.name} for ${target.cycle.code}.` : undefined} confirmLabel="Send reminder" loading={reminders.isPending} />
    </div>
  );
}
