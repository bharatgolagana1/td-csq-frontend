import type { FC } from 'react';
import type { ApprovalStatus, SampleLock, SamplingCycle } from '../api/sampling.types';
import { formatDateTime, plural } from '../api/sampling.logic';

interface Props {
  lock: SampleLock;
  cycle: SamplingCycle;
  directorySize: number;
}

const STATUS: Record<ApprovalStatus, { label: string; className: string; copy: string }> = {
  NOT_REQUIRED: {
    label: 'No approval needed',
    className: 'smp-status',
    copy: 'This account locks its own sample. Assessment links go to these contacts when the assessment window opens.',
  },
  PENDING: {
    label: 'Awaiting Super Admin',
    className: 'smp-status smp-status--pending',
    copy: 'ACFI reviews the locked sample before any link goes out. You do not need to do anything while it sits here.',
  },
  APPROVED: {
    label: 'Approved',
    className: 'smp-status smp-status--approved',
    copy: 'The sample was approved. Assessment links go to these contacts when the assessment window opens.',
  },
  CHANGES_REQUESTED: {
    label: 'Changes requested',
    className: 'smp-status smp-status--changes',
    copy: 'ACFI has asked for a change before this sample is used. The note below says what, and the sample is unlocked for editing once you acknowledge it.',
  },
};

export const LockedBanner: FC<Props> = ({ lock, cycle, directorySize }) => {
  const status = STATUS[lock.approval.status];
  const size = lock.memberIds.length;

  return (
    <section className="smp-card smp-locked" aria-labelledby="smp-locked-h">
      <header>
        <h2 id="smp-locked-h">Sample locked</h2>
        <p className="sub">This cycle is frozen. Nothing on this screen can be changed.</p>
      </header>

      <div className="smp-pad">
        <div className="row">
          <span className="k">Locked</span>
          <span className="v">{formatDateTime(lock.lockedAt)}</span>
        </div>
        <div className="row">
          <span className="k">Locked by</span>
          <span className="v">{lock.lockedBy}</span>
        </div>
        <div className="row">
          <span className="k">In the sample</span>
          <span className="v">
            {size} of {directorySize}
          </span>
        </div>
        <div className="row">
          <span className="k">Against the minimum</span>
          <span className="v">
            {lock.shortfall > 0
              ? `${lock.shortfall} short of ${cycle.minimumSampleSize}`
              : `Met (${cycle.minimumSampleSize})`}
          </span>
        </div>
        <div className="row">
          <span className="k">Approval</span>
          <span className="v">
            <span className={status.className}>{status.label}</span>
          </span>
        </div>

        {lock.approval.reviewer && lock.approval.decidedAt ? (
          <div className="row">
            <span className="k">Decided</span>
            <span className="v">
              {lock.approval.reviewer} on {formatDateTime(lock.approval.decidedAt)}
            </span>
          </div>
        ) : null}

        <p className="smp-note" style={{ marginTop: 14, marginBottom: 0 }}>
          {status.copy}
        </p>

        {lock.approval.note ? (
          <p className="smp-note smp-note--warn" style={{ marginTop: 10, marginBottom: 0 }}>
            {lock.approval.note}
          </p>
        ) : null}

        {lock.shortfall > 0 ? (
          <p className="smp-note smp-note--warn" style={{ marginTop: 10, marginBottom: 0 }}>
            This sample is {lock.shortfall} {plural(lock.shortfall, 'contact', 'contacts')} short of the
            minimum. That is recorded against the result rather than hidden, so the score is read alongside
            how many customers there were to ask.
          </p>
        ) : null}

        <p className="fine" style={{ marginTop: 14 }}>
          A locked sample can only be reopened by ACFI. Write to the programme office with the cycle and your
          terminal if something is wrong with it.
        </p>
      </div>
    </section>
  );
};

export default LockedBanner;
