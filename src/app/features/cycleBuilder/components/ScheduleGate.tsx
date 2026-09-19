import type { FC } from 'react';
import Orbis from '../../../shared/orbis/Orbis';
import type { CycleState } from '../api/cycleBuilder.types';
import type { EditPolicy } from '../lib/cycleRules';

export type GateBusy = 'none' | 'saving' | 'scheduling';

export interface ScheduleGateProps {
  state: CycleState;
  policy: EditPolicy;
  errorCount: number;
  sendCount: number;
  firstSendLabel: string | null;
  confirmed: boolean;
  busy: GateBusy;
  statusNote: string | null;
  submitError: string | null;
  onConfirm: (next: boolean) => void;
  onSaveDraft: () => void;
  onSchedule: () => void;
}

const PERMANENT = [
  'The programme and the form scope, so every answer in the cycle comes from one instrument.',
  'The minimum sampling size and the sampling window, which together decide whose ratings count.',
  'The moment assessment opens, because the invitations are addressed to it.',
  'The cycle timezone, which is what each of those moments is read in.',
];

const STILL_OPEN = [
  'The assessment close, but later only. You can buy response time, never take it away.',
  'Reminders that have not yet gone out.',
];

export const ScheduleGate: FC<ScheduleGateProps> = ({
  state,
  policy,
  errorCount,
  sendCount,
  firstSendLabel,
  confirmed,
  busy,
  statusNote,
  submitError,
  onConfirm,
  onSaveDraft,
  onSchedule,
}) => {
  const blocked = errorCount > 0;
  const canSubmit = policy.canSchedule && !blocked && confirmed && busy === 'none';

  return (
    <section className="cb-card cb-gate" aria-labelledby="cb-gate-h">
      <h2 id="cb-gate-h">{policy.canSchedule ? 'Before you schedule' : 'What is fixed'}</h2>
      <p className="sub">
        {policy.canSchedule
          ? 'Scheduling queues the first message and freezes the shape of the cycle.'
          : 'This cycle has been scheduled, so the list below is settled.'}
      </p>

      <div className="cb-two cb-gate-lists">
        <div>
          <h3 className="cb-gate-h">
            {policy.canSchedule ? 'Becomes permanent' : 'Is permanent'}
          </h3>
          <ul className="cb-gate-list">
            {PERMANENT.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="cb-gate-h">Stays changeable</h3>
          <ul className="cb-gate-list is-open">
            {STILL_OPEN.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      {policy.canSchedule ? (
        <>
          <label className="cb-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={blocked}
              onChange={(e) => onConfirm(e.target.checked)}
            />
            <span>
              I understand that scheduling this cycle queues {sendCount} message
              {sendCount === 1 ? '' : 's'}
              {firstSendLabel ? `, the first on ${firstSendLabel}` : ''}, and fixes everything listed
              on the left.
            </span>
          </label>

          <div className="cb-actions">
            <button
              type="button"
              className="cb-btn cb-btn--ghost"
              onClick={onSaveDraft}
              disabled={busy !== 'none'}
            >
              {busy === 'saving' ? 'Saving' : 'Save draft'}
            </button>
            <button
              type="button"
              className="cb-btn cb-btn--primary"
              onClick={onSchedule}
              disabled={!canSubmit}
            >
              Schedule cycle
            </button>
            {busy === 'scheduling' ? <Orbis size={8} label="Scheduling" /> : null}
          </div>

          <p className="cb-actions-why" aria-live="polite">
            {blocked
              ? `${errorCount === 1 ? '1 check' : `${errorCount} checks`} must pass before this cycle can be scheduled.`
              : confirmed
                ? 'Ready to schedule.'
                : 'Tick the confirmation above to enable scheduling.'}
          </p>
        </>
      ) : (
        <div className="cb-actions">
          {state === 'CLOSED' ? (
            <p className="cb-note">Closed cycles are read only.</p>
          ) : (
            <button
              type="button"
              className="cb-btn cb-btn--primary"
              onClick={onSaveDraft}
              disabled={blocked || busy !== 'none'}
            >
              {busy === 'saving' ? 'Saving' : 'Save changes'}
            </button>
          )}
          {busy === 'saving' ? <Orbis size={8} label="Saving" /> : null}
        </div>
      )}

      <p className="cb-status" aria-live="polite">
        {submitError ? <span className="cb-status-bad">{submitError}</span> : statusNote}
      </p>
    </section>
  );
};
