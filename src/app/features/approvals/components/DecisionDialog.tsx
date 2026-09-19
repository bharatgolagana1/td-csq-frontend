import { useId, useState, type FC, type FormEvent } from 'react';
import type { RejectCode, SampledContact } from '../api/approvals.types';
import type { ChangeSummary } from '../lib/changes';
import { FLAG_META, sortFlags } from '../lib/integrity';
import { REJECT_LABEL } from '../lib/labels';
import { Modal } from './Modal';

interface Props {
  mode: 'APPROVE' | 'REJECT';
  operatorName: string;
  submittedCount: number;
  finalCount: number;
  minimum: number;
  changes: ChangeSummary;
  /** still carrying a high severity signal at the moment of decision */
  unresolved: SampledContact[];
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onApprove: () => void;
  onReject: (code: RejectCode, message: string, citedIds: string[]) => void;
}

const REJECT_CODES: RejectCode[] = [
  'BELOW_MINIMUM',
  'OWN_STAFF_PRESENT',
  'DUPLICATE_CONTACTS',
  'UNVERIFIABLE_CONTACTS',
  'SAMPLE_NOT_REPRESENTATIVE',
  'OTHER',
];

const MIN_MESSAGE = 30;

function suggestCode(finalCount: number, minimum: number, unresolved: SampledContact[]): RejectCode {
  if (finalCount < minimum) return 'BELOW_MINIMUM';
  if (unresolved.some((c) => c.flags.includes('OWN_DOMAIN_EMAIL'))) return 'OWN_STAFF_PRESENT';
  if (unresolved.length > 0) return 'DUPLICATE_CONTACTS';
  return 'SAMPLE_NOT_REPRESENTATIVE';
}

export const DecisionDialog: FC<Props> = ({
  mode,
  operatorName,
  submittedCount,
  finalCount,
  minimum,
  changes,
  unresolved,
  submitting,
  error,
  onCancel,
  onApprove,
  onReject,
}) => {
  const codeId = useId();
  const messageId = useId();
  const [code, setCode] = useState<RejectCode>(() => suggestCode(finalCount, minimum, unresolved));
  const [message, setMessage] = useState('');
  const [cited, setCited] = useState<string[]>(() => unresolved.map((c) => c.id));
  const [showErrors, setShowErrors] = useState(false);

  const messageShort = message.trim().length < MIN_MESSAGE;

  const submitReject = (e: FormEvent) => {
    e.preventDefault();
    if (messageShort) {
      setShowErrors(true);
      return;
    }
    onReject(code, message.trim(), cited);
  };

  if (mode === 'APPROVE') {
    return (
      <Modal
        title="Approve this sample"
        description={`The ${finalCount} contacts below become the customer assessors for ${operatorName} this cycle.`}
        onClose={onCancel}
        footer={
          <>
            <button type="button" className="csq-ap-btn" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className="csq-ap-btn csq-ap-btn--primary"
              onClick={onApprove}
              disabled={submitting}
            >
              {submitting ? 'Recording' : 'Approve sample'}
            </button>
          </>
        }
      >
        <div className="csq-ap-preview">
          <div className="h">What gets recorded</div>
          <ul className="csq-ap-list">
            <li>
              {submittedCount} contacts submitted, {finalCount} approved.
            </li>
            <li>
              {changes.total === 0
                ? 'No changes to what the operator submitted.'
                : `${changes.removed} removed, ${changes.added} added, ${changes.edited} corrected, each with its reason code.`}
            </li>
            <li>Every assessor is invited by WhatsApp and email once the cycle opens.</li>
          </ul>
        </div>

        {unresolved.length > 0 ? (
          <div className="csq-ap-banner csq-ap-banner--warn" style={{ margin: '16px 0 0' }}>
            <b>
              {unresolved.length} contact{unresolved.length === 1 ? '' : 's'} still carry a strong
              signal
            </b>
            <ul className="csq-ap-list">
              {unresolved.map((c) => (
                <li key={c.id}>
                  {c.name} at {c.company}
                  {c.flags.length > 0
                    ? `: ${sortFlags(c.flags).map((f) => FLAG_META[f].label.toLowerCase()).join(', ')}`
                    : ''}
                </li>
              ))}
            </ul>
            Approving keeps them in the sample. That is a decision you are recording under your own
            name, so leave a note on each one if you checked it and it is fine.
          </div>
        ) : null}

        {error ? (
          <p className="csq-ap-error-text" style={{ marginTop: 14 }} role="alert">
            {error}
          </p>
        ) : null}
      </Modal>
    );
  }

  return (
    <Modal
      title="Reject this sample"
      description={`${operatorName} reads the reason and the message below, and can resubmit while the sampling window is open.`}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="csq-ap-btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            form="csq-ap-reject-form"
            className="csq-ap-btn csq-ap-btn--danger"
            disabled={submitting}
          >
            {submitting ? 'Recording' : 'Reject and notify'}
          </button>
        </>
      }
    >
      <form className="csq-ap-form" id="csq-ap-reject-form" onSubmit={submitReject} noValidate>
        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={codeId}>
            Reason
          </label>
          <select
            id={codeId}
            className="csq-ap-select"
            value={code}
            onChange={(e) => setCode(e.target.value as RejectCode)}
          >
            {REJECT_CODES.map((c) => (
              <option key={c} value={c}>
                {REJECT_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={messageId}>
            Message to the operator
          </label>
          <textarea
            id={messageId}
            className="csq-ap-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say what has to change for this sample to be approved."
            aria-invalid={showErrors && messageShort}
            aria-describedby={`${messageId}-hint`}
          />
          <span
            className={showErrors && messageShort ? 'csq-ap-error-text' : 'csq-ap-hint'}
            id={`${messageId}-hint`}
          >
            {showErrors && messageShort
              ? `Write at least ${MIN_MESSAGE} characters: a rejection the operator cannot act on wastes the cycle.`
              : `${message.trim().length} characters. Be specific enough that the operator can fix it in one pass.`}
          </span>
        </div>

        {unresolved.length > 0 ? (
          <div className="csq-ap-field">
            <span className="csq-ap-label">Contacts to name in the message</span>
            {unresolved.map((c) => (
              <label className="csq-ap-check" key={c.id}>
                <input
                  type="checkbox"
                  checked={cited.includes(c.id)}
                  onChange={(e) =>
                    setCited((ids) =>
                      e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.name} · {c.company}
              </label>
            ))}
          </div>
        ) : null}

        <div className="csq-ap-preview">
          <div className="h">What {operatorName} receives</div>
          <b>{REJECT_LABEL[code]}</b>
          <p style={{ margin: '6px 0 0' }}>{message.trim() || 'Your message appears here.'}</p>
          {cited.length > 0 ? (
            <ul className="csq-ap-list">
              {unresolved
                .filter((c) => cited.includes(c.id))
                .map((c) => (
                  <li key={c.id}>
                    {c.name}, {c.company}
                    {c.flags.length > 0
                      ? ` · ${sortFlags(c.flags).map((f) => FLAG_META[f].label.toLowerCase()).join(', ')}`
                      : ''}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>

        {error ? (
          <p className="csq-ap-error-text" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
};
