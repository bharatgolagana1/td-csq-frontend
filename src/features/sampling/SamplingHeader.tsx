import { type CurrentCycle, type SelectionState } from '@/api/sampling.types';
import { Icon } from '@/design/icons';
import { Banner, Button, Pill, Progress, Skeleton, statusVariant } from '@/design/primitives';
import { describeTimeZone, formatDateTime, formatInt, formatRelative, humanise } from '@/lib/format';

import styles from './sampling.module.css';
import { minimumBanner, progressCaption, SURVEY_TYPE_LABELS, surveyTypeVariant, windowPhase } from './samplingLabels';

export type SamplingHeaderProps = {
  state: SelectionState;
  current: CurrentCycle | null;
  tz: string;
  /** "Select all eligible" is offered only under the shortfall rule, to users who may manage. */
  canManage: boolean;
  onSelectAll: () => void;
  selectAllPending: boolean;
};

/** Cycle · phase · deadline on the left, the big "37 / 50 selected" counter on the right, the minimum banner below. */
export function SamplingHeader({ state, current, tz, canManage, onSelectAll, selectAllPending }: SamplingHeaderProps) {
  const { cycle, participant } = state;
  const locked = participant.sampling.status === 'LOCKED';
  const phase = windowPhase(state, current);
  const samplingEnd = current?.cycle.sampling.end.utc ?? cycle.samplingEnd;
  const samplingStart = current?.cycle.sampling.start.utc ?? cycle.samplingStart;
  const zone = describeTimeZone(tz);
  const showSelectAll = canManage && state.editable && state.shortfallRule === 'SELECT_ALL' && !state.lockable;

  let deadline: { strong: string; abs: string | null };
  if (locked) {
    deadline = { strong: `Locked ${formatRelative(participant.sampling.lockedAt)}`, abs: participant.sampling.lockedAt ? `${formatDateTime(participant.sampling.lockedAt, tz)} ${zone}` : null };
  } else if (phase === 'before') {
    deadline = { strong: `Sampling opens ${formatRelative(samplingStart)}`, abs: samplingStart ? `${formatDateTime(samplingStart, tz)} ${zone}` : null };
  } else if (phase === 'after') {
    deadline = { strong: `Sampling closed ${formatRelative(samplingEnd)}`, abs: samplingEnd ? `${formatDateTime(samplingEnd, tz)} ${zone}` : null };
  } else {
    deadline = { strong: `Sampling closes ${formatRelative(samplingEnd)}`, abs: samplingEnd ? `${formatDateTime(samplingEnd, tz)} ${zone}` : null };
  }

  return (
    <>
      <section className={styles.header} aria-label="Cycle and progress">
        <div className={styles.cycleBlock}>
          <h2 className={styles.cycleName}>{cycle.name}</h2>
          <div className={styles.cycleMeta}>
            <span className={styles.cycleCode}>{cycle.code}</span>
            <Pill variant={statusVariant(cycle.status)}>{humanise(cycle.status)}</Pill>
            {participant.surveyTypes.map((s) => (
              <Pill key={s} variant={surveyTypeVariant(s)} dot={false} size="sm">
                {SURVEY_TYPE_LABELS[s]}
              </Pill>
            ))}
            {locked ? (
              <Pill variant="success" size="sm">
                Sample locked
              </Pill>
            ) : null}
          </div>
          <p className={styles.deadline}>
            <span className={styles.deadlineStrong}>{deadline.strong}</span>
            {deadline.abs ? <span className={styles.deadlineAbs}>{deadline.abs}</span> : null}
          </p>
        </div>
        <div className={styles.counterBlock}>
          <div className={styles.counter} aria-label={`${formatInt(state.selectedCount)} of ${formatInt(state.required)} selected`}>
            <span className={styles.counterValue}>
              {formatInt(state.selectedCount)} / {formatInt(state.required)}
            </span>
            <span className={styles.counterLabel}>selected</span>
          </div>
          <Progress value={state.progressPct} caption={progressCaption(state)} tone={locked || state.lockable ? 'success' : 'accent'} size="sm" />
        </div>
      </section>

      {!locked ? (
        <Banner
          tone={state.shortfallRule === 'SELECT_ALL' ? 'warn' : 'info'}
          title={minimumBanner(state.required)}
          action={
            showSelectAll ? (
              <Button size="sm" variant="primary" icon={<Icon name="list-check" size={16} />} onClick={onSelectAll} loading={selectAllPending}>
                Select all eligible ({formatInt(state.eligibleCount)})
              </Button>
            ) : undefined
          }
        >
          {state.shortfallRule === 'SELECT_ALL'
            ? `Only ${formatInt(state.eligibleCount)} customers are eligible for this cycle, fewer than the ${formatInt(state.required)} required. Select all of them and lock.`
            : `${formatInt(state.eligibleCount)} customers are eligible for this cycle.`}
        </Banner>
      ) : null}
    </>
  );
}

/** The header's loading shape. */
export function SamplingHeaderSkeleton() {
  return (
    <section className={styles.header} aria-hidden="true">
      <div className={styles.cycleBlock}>
        <Skeleton width={260} height={26} />
        <Skeleton width={200} height={18} />
        <Skeleton width={320} height={16} />
      </div>
      <div className={styles.counterBlock}>
        <Skeleton width={160} height={40} />
        <Skeleton height={8} />
      </div>
    </section>
  );
}
