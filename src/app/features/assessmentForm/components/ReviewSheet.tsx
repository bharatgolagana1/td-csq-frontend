import { useEffect, useRef, useState, type FC } from 'react';
import type { Head, MissingItem, Progress } from '../api/assessmentForm.types';
import { DIRECTION_LABEL } from '../assessmentForm.logic';
import Orbis from '../../../shared/orbis/Orbis';

export interface ReviewSheetProps {
  open: boolean;
  heads: Head[];
  missing: MissingItem[];
  progress: Progress;
  lowCount: number;
  lowWithoutReason: number;
  online: boolean;
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onJump: (item: MissingItem) => void;
  onSubmit: () => void;
}

/**
 * A native dialog rather than a hand built sheet: focus containment, Escape and
 * background inertness come from the platform, and on this screen they have to
 * be right rather than approximately right.
 */
export const ReviewSheet: FC<ReviewSheetProps> = ({
  open,
  heads,
  missing,
  progress,
  lowCount,
  lowWithoutReason,
  online,
  submitting,
  submitError,
  onClose,
  onJump,
  onSubmit,
}) => {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setUnderstood(false);
      el.showModal();
    }
    if (!open && el.open) el.close();
  }, [open]);

  const complete = missing.length === 0 && progress.total > 0;

  return (
    <dialog
      className="af-sheet"
      ref={ref}
      aria-labelledby="af-sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!submitting) onClose();
      }}
      onClose={onClose}
    >
      <div className="af-sheet-inner">
        <div className="af-sheet-head">
          <h2 id="af-sheet-title">{complete ? 'Submit your assessment' : 'Still to answer'}</h2>
          <button type="button" className="af-icon-btn" onClick={onClose} disabled={submitting}>
            Close
          </button>
        </div>

        <div className="af-sheet-body">
          {complete ? (
            <>
              <ul className="af-summary">
                <li>
                  <span>Answered</span>
                  <strong>
                    {progress.answered} of {progress.total}
                  </strong>
                </li>
                <li>
                  <span>Rated Fair or Poor</span>
                  <strong>{lowCount}</strong>
                </li>
              </ul>

              {lowWithoutReason > 0 ? (
                <p className="af-nudge">
                  {lowWithoutReason} low {lowWithoutReason === 1 ? 'rating has' : 'ratings have'} no
                  reason attached. You can submit without one, but a reason is what the terminal can
                  actually act on.
                </p>
              ) : null}

              <div className="af-warn">
                <h3>This cannot be undone</h3>
                <p>
                  Once submitted, your ratings are locked and cannot be edited or withdrawn. Your
                  answers are shared with ACFI and reported to the terminal operator as part of an
                  aggregate. They are confidential and are not published at any stage.
                </p>
              </div>

              <label className="af-check">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                />
                <span>I understand my assessment cannot be changed after it is submitted.</span>
              </label>

              {!online ? (
                <p className="af-nudge is-warn">
                  You are offline. Your answers are safe on this phone. Reconnect to submit.
                </p>
              ) : null}

              {submitError ? <p className="af-nudge is-warn">{submitError}</p> : null}
            </>
          ) : (
            <>
              <p className="af-sheet-lede">
                Every question is rated once for each direction. {missing.length}{' '}
                {missing.length === 1 ? 'rating is' : 'ratings are'} still blank. Tap one to go
                straight to it.
              </p>

              {heads.map((h) => {
                const rows = missing.filter((m) => m.head === h.code);
                if (rows.length === 0) return null;
                return (
                  <section className="af-missing-group" key={h.code}>
                    <h3>
                      {h.label} <span>{rows.length}</span>
                    </h3>
                    <ul className="af-missing-list">
                      {rows.map((m) => (
                        <li key={`${m.parameterId}|${m.direction}`}>
                          <button type="button" className="af-missing" onClick={() => onJump(m)}>
                            <span className="af-missing-q">Q{m.parameterNumber}</span>
                            <span className="af-missing-label">{m.shortLabel}</span>
                            <span className="af-missing-dir">{DIRECTION_LABEL[m.direction]}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </>
          )}
        </div>

        <div className="af-sheet-foot">
          {submitting ? (
            <Orbis size={9} label="Submitting your assessment" />
          ) : (
            <>
              {complete ? null : (
                <p className="af-foot-note" id="af-submit-why">
                  Answer the {missing.length} remaining{' '}
                  {missing.length === 1 ? 'rating' : 'ratings'} to submit.
                </p>
              )}
              <div className="af-foot-actions">
                {complete ? null : (
                  <button type="button" className="af-btn af-btn--ghost" onClick={onClose}>
                    Keep answering
                  </button>
                )}
                <button
                  type="button"
                  className="af-btn af-btn--primary af-btn--wide"
                  disabled={!complete || !understood || !online}
                  aria-describedby={complete ? undefined : 'af-submit-why'}
                  onClick={onSubmit}
                >
                  Submit assessment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default ReviewSheet;
