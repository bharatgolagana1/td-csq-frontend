import { useState, type FC } from 'react';
import type { LockGate as Gate } from '../api/sampling.logic';
import { plural } from '../api/sampling.logic';
import Dialog from './Dialog';

interface Props {
  gate: Gate;
  selectedCount: number;
  directorySize: number;
  minimum: number;
  canLock: boolean;
  deniedReason: string | null;
  requiresApproval: boolean;
  flaggedCount: number;
  busy: boolean;
  error: string | null;
  onLock: () => void;
}

function verdict(gate: Gate, minimum: number, directorySize: number) {
  switch (gate.kind) {
    case 'EMPTY':
      return {
        tone: 'smp-note--bad',
        text: 'There is nobody to sample yet. Add a contact or import your list, then come back here.',
      };
    case 'SHORT':
      return {
        tone: 'smp-note--warn',
        text: `Select ${gate.needed} more ${plural(gate.needed, 'contact', 'contacts')} to reach the minimum of ${minimum}.`,
      };
    case 'SELECT_ALL_REQUIRED':
      return {
        tone: 'smp-note--warn',
        text: `Your directory holds ${directorySize} contacts, which is ${gate.shortfall} short of the minimum of ${minimum}. You can still lock, but every contact has to be in the sample. ${gate.remaining} ${plural(gate.remaining, 'is', 'are')} still unselected.`,
      };
    case 'READY_SHORT_DIRECTORY':
      return {
        tone: 'smp-note--warn',
        text: `Every contact in your directory is in the sample. That is ${gate.shortfall} short of the minimum of ${minimum}, and the shortfall will be recorded against this sample rather than hidden.`,
      };
    default:
      return {
        tone: 'smp-note--ok',
        text: 'The sample meets the minimum. Locking freezes who is asked, and it cannot be undone from here.',
      };
  }
}

export const LockGate: FC<Props> = ({
  gate,
  selectedCount,
  directorySize,
  minimum,
  canLock,
  deniedReason,
  requiresApproval,
  flaggedCount,
  busy,
  error,
  onLock,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [attested, setAttested] = useState(false);

  const note = verdict(gate, minimum, directorySize);
  const percent = minimum === 0 ? 0 : Math.min(100, Math.round((selectedCount / minimum) * 100));
  const shortfall = gate.kind === 'READY_SHORT_DIRECTORY' ? gate.shortfall : 0;

  const close = () => {
    setConfirming(false);
    setAttested(false);
  };

  return (
    <section className="smp-card" aria-labelledby="smp-gate-h">
      <header>
        <h2 id="smp-gate-h">Lock the sample</h2>
        <p className="sub">Who this cycle asks, frozen at the moment you lock</p>
      </header>

      <div className="smp-gate">
        <div className="headline">
          {selectedCount}
          <span className="of"> of {minimum} minimum</span>
        </div>

        <div
          className={gate.canLock ? 'smp-meter is-ready' : 'smp-meter'}
          role="progressbar"
          aria-valuenow={selectedCount}
          aria-valuemin={0}
          aria-valuemax={minimum}
          aria-label={`${selectedCount} of a minimum ${minimum} contacts selected`}
        >
          <span style={{ width: `${percent}%` }} />
        </div>

        <p className={`smp-note ${note.tone}`} role="status">
          {note.text}
        </p>

        {canLock ? (
          <button
            type="button"
            className="smp-btn smp-btn--primary smp-btn--block smp-btn--lg"
            disabled={!gate.canLock || busy}
            onClick={() => setConfirming(true)}
          >
            {busy ? 'Locking...' : 'Lock this sample'}
          </button>
        ) : (
          <p className="smp-note" role="note">
            {deniedReason ?? 'Your account cannot lock a sample.'}
          </p>
        )}

        {error ? (
          <p className="smp-note smp-note--bad" role="alert" style={{ marginTop: 12, marginBottom: 0 }}>
            {error}
          </p>
        ) : null}

        <p className="fine">
          {requiresApproval
            ? 'This account is set to Super Admin approval. Assessment links go out once the locked sample is approved.'
            : 'Assessment links go out to the locked sample when the assessment window opens.'}
        </p>
      </div>

      <Dialog
        open={confirming}
        title="Lock this sample?"
        subtitle="Locking freezes who is asked for this cycle. It cannot be undone from this screen."
        onClose={close}
        footer={
          <>
            <button type="button" className="smp-btn" onClick={close}>
              Go back
            </button>
            <button
              type="button"
              className="smp-btn smp-btn--primary"
              disabled={!attested || busy}
              onClick={() => {
                close();
                onLock();
              }}
            >
              Lock {selectedCount} {plural(selectedCount, 'contact', 'contacts')}
            </button>
          </>
        }
      >
        <div className="smp-summary">
          <div className="smp-stat smp-stat--ok">
            <div className="n">{selectedCount}</div>
            <div className="k">In the sample</div>
          </div>
          <div className="smp-stat">
            <div className="n">{directorySize - selectedCount}</div>
            <div className="k">Left out</div>
          </div>
          <div className={shortfall > 0 ? 'smp-stat smp-stat--bad' : 'smp-stat'}>
            <div className="n">{shortfall}</div>
            <div className="k">Short of minimum</div>
          </div>
        </div>

        {shortfall > 0 ? (
          <p className="smp-note smp-note--warn">
            This sample is {shortfall} short of the minimum of {minimum}. The shortfall is stored with the
            lock and travels with the result, so the score is read in the light of how many customers were
            available to ask.
          </p>
        ) : null}

        {flaggedCount > 0 ? (
          <p className="smp-note">
            {flaggedCount} {plural(flaggedCount, 'contact is', 'contacts are')} flagged for review. Flags never
            block a lock, and they are recorded with it.
          </p>
        ) : null}

        <label className="smp-confirm">
          <input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} />
          I confirm these contacts are genuine customers of this terminal and that each was chosen
          independently of how they are likely to rate us.
        </label>
      </Dialog>
    </section>
  );
};

export default LockGate;
