import { type SelectionState } from '@/api/sampling.types';
import { Icon } from '@/design/icons';
import { Button, Progress } from '@/design/primitives';
import { formatDateTime, formatInt } from '@/lib/format';

import styles from './sampling.module.css';
import { lockReasonText, progressCaption } from './samplingLabels';

export type LockFooterProps = {
  state: SelectionState;
  tz: string;
  /** `sampling.lock` */
  canLock: boolean;
  /** `sampling.unlock` (PLATFORM only) */
  canUnlock: boolean;
  onLock: () => void;
  onUnlock: () => void;
  lockPending: boolean;
};

/** Sticky bottom bar: the counter again, the reason locking is refused, and Lock / Unlock. */
export function LockFooter({ state, tz, canLock, canUnlock, onLock, onUnlock, lockPending }: LockFooterProps) {
  const { participant } = state;
  const locked = participant.sampling.status === 'LOCKED';
  const reason = locked ? null : lockReasonText(state);

  return (
    <div className={styles.footer} role="region" aria-label="Lock the sample">
      <span className={styles.footerCounter}>
        <span className={styles.footerValue}>
          {formatInt(state.selectedCount)} / {formatInt(state.required)}
        </span>
        <span className={styles.counterLabel}>selected</span>
      </span>
      <Progress className={styles.footerProgress} value={state.progressPct} size="sm" caption={progressCaption(state)} tone={locked || state.lockable ? 'success' : 'accent'} />

      {locked ? (
        <span className={styles.lockedNote}>
          <span>
            <strong>Sample locked</strong>
            {participant.sampling.lockedByUser ? ` by ${participant.sampling.lockedByUser.name}` : ''}
          </span>
          <span className={styles.lockedWhen}>{formatDateTime(participant.sampling.lockedAt, tz)}</span>
        </span>
      ) : reason ? (
        <span className={styles.footerReason} id="lock-reason">
          {reason}
        </span>
      ) : null}

      <span className={styles.footerActions}>
        {locked ? (
          canUnlock ? (
            <Button variant="secondary" icon={<Icon name="unlock" size={18} />} onClick={onUnlock}>
              Unlock
            </Button>
          ) : (
            <span className={styles.footerReason}>To change the sample, ask ACFI to unlock it.</span>
          )
        ) : canLock ? (
          <Button variant="primary" icon={<Icon name="lock" size={18} />} onClick={onLock} disabled={!state.lockable} loading={lockPending} aria-describedby={reason ? 'lock-reason' : undefined}>
            Lock sample
          </Button>
        ) : null}
      </span>
    </div>
  );
}
