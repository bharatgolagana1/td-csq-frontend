import { useId, useState, type FC } from 'react';
import type { ApprovalMode } from '../api/approvals.types';
import { APPROVAL_MODE_HELP, APPROVAL_MODE_LABEL } from '../lib/labels';
import { Modal } from './Modal';

interface Props {
  operatorName: string;
  mode: ApprovalMode;
  saving: boolean;
  onChange: (mode: ApprovalMode) => void;
}

const MODES: ApprovalMode[] = ['REQUIRES_REVIEW', 'AUTOMATIC'];

export const ApprovalModeCard: FC<Props> = ({ operatorName, mode, saving, onChange }) => {
  const groupName = useId();
  const [confirming, setConfirming] = useState(false);

  // turning review off is the one setting on this screen that removes a control,
  // so it asks once rather than flipping under a stray click
  const pick = (next: ApprovalMode) => {
    if (next === mode) return;
    if (next === 'AUTOMATIC') setConfirming(true);
    else onChange(next);
  };

  return (
    <div className="csq-ap-card">
      <h2>Approval mode for {operatorName}</h2>
      <p className="sub">
        Set per operator and applied to batches submitted from now on. It does not change any batch
        already in this queue.
      </p>

      <fieldset className="csq-ap-mode" disabled={saving}>
        <legend>Who checks this operator’s sample</legend>
        {MODES.map((m) => (
          <label className={m === mode ? 'csq-ap-modeopt is-on' : 'csq-ap-modeopt'} key={m}>
            <input
              type="radio"
              name={groupName}
              value={m}
              checked={m === mode}
              onChange={() => pick(m)}
            />
            <span>
              <span className="t">{APPROVAL_MODE_LABEL[m]}</span>
              <span className="d">{APPROVAL_MODE_HELP[m]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {saving ? (
        <p className="csq-ap-hint" style={{ marginTop: 10 }} aria-live="polite">
          Saving the approval mode.
        </p>
      ) : null}

      {confirming ? (
        <Modal
          title="Turn off review for this operator"
          description={`${operatorName} would then choose its own assessors with nobody at ACFI seeing the list.`}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button type="button" className="csq-ap-btn" onClick={() => setConfirming(false)}>
                Keep review on
              </button>
              <button
                type="button"
                className="csq-ap-btn csq-ap-btn--danger"
                onClick={() => {
                  setConfirming(false);
                  onChange('AUTOMATIC');
                }}
              >
                Switch to automatic
              </button>
            </>
          }
        >
          <p className="csq-ap-preview">
            The operator being graded picks its own graders. Review is the control on that. With
            automatic approval, own-domain addresses, duplicates and late additions still get flagged,
            and no one is asked to look at them before assessment opens.
          </p>
          <p className="csq-ap-hint" style={{ marginTop: 12 }}>
            The change is recorded in the audit trail against your name.
          </p>
        </Modal>
      ) : null}
    </div>
  );
};
