import { useId, useState, type FC, type FormEvent } from 'react';
import type { ChangeReason, SampledContact } from '../api/approvals.types';
import { REASON_LABEL, REASONS_FOR } from '../lib/changes';
import { FLAG_META, sortFlags } from '../lib/integrity';
import { Modal } from './Modal';

interface Props {
  contact: SampledContact;
  /** sample size once this removal is applied, checked against the cycle minimum */
  remainingAfter: number;
  minimum: number;
  onCancel: () => void;
  onConfirm: (reason: ChangeReason, note: string) => void;
}

/** The signal that most likely explains the removal, offered as the starting reason. */
function suggestedReason(contact: SampledContact): ChangeReason {
  if (contact.flags.includes('OWN_DOMAIN_EMAIL')) return 'OWN_STAFF';
  if (contact.flags.includes('DUPLICATE_EMAIL') || contact.flags.includes('DUPLICATE_PHONE')) {
    return 'DUPLICATE';
  }
  return 'NOT_A_CUSTOMER';
}

export const RemoveDialog: FC<Props> = ({ contact, remainingAfter, minimum, onCancel, onConfirm }) => {
  const reasonId = useId();
  const noteId = useId();
  const [reason, setReason] = useState<ChangeReason>(suggestedReason(contact));
  const [note, setNote] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const noteRequired = reason === 'OTHER';
  const noteMissing = noteRequired && note.trim().length < 5;
  const belowMinimum = remainingAfter < minimum;
  const flags = sortFlags(contact.flags);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (noteMissing) {
      setShowErrors(true);
      return;
    }
    onConfirm(reason, note.trim());
  };

  return (
    <Modal
      title={`Remove ${contact.name}`}
      description={`${contact.company} · ${contact.email}`}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="csq-ap-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" form="csq-ap-remove-form" className="csq-ap-btn csq-ap-btn--danger">
            Remove from sample
          </button>
        </>
      }
    >
      <form className="csq-ap-form" id="csq-ap-remove-form" onSubmit={submit} noValidate>
        {flags.length > 0 ? (
          <div className="csq-ap-why">
            {flags.map((code) => (
              <div className="csq-ap-why-row" key={code}>
                <span className="csq-ap-why-dot" style={{ background: FLAG_META[code].colour }} />
                <span>
                  <b>{FLAG_META[code].label}.</b> {FLAG_META[code].explain}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="csq-ap-hint">
            Nothing was flagged on this contact, so say plainly why the sample is better without them.
          </p>
        )}

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={reasonId}>
            Reason code
          </label>
          <select
            id={reasonId}
            className="csq-ap-select"
            value={reason}
            onChange={(e) => setReason(e.target.value as ChangeReason)}
          >
            {REASONS_FOR.REMOVE.map((r) => (
              <option key={r} value={r}>
                {REASON_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={noteId}>
            Note {noteRequired ? '(required)' : '(optional)'}
          </label>
          <textarea
            id={noteId}
            className="csq-ap-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you checked, and what you found."
            aria-invalid={showErrors && noteMissing}
            aria-describedby={`${noteId}-hint`}
          />
          <span className={showErrors && noteMissing ? 'csq-ap-error-text' : 'csq-ap-hint'} id={`${noteId}-hint`}>
            {showErrors && noteMissing
              ? 'A reason of Other has to be explained.'
              : 'This reaches the operator word for word.'}
          </span>
        </div>

        {belowMinimum ? (
          <div className="csq-ap-banner csq-ap-banner--warn" style={{ margin: 0 }}>
            <b>This takes the sample below the minimum</b>
            {remainingAfter} contacts against a minimum of {minimum}. You can still remove them, and
            the batch cannot be approved until it is topped back up or rejected.
          </div>
        ) : null}
      </form>
    </Modal>
  );
};
