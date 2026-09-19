import type { FC } from 'react';
import type { ChangeKind, ContactChange } from '../api/approvals.types';
import { CHANGE_KIND_LABEL, REASON_LABEL } from '../lib/changes';
import { COMPANY_TYPE_LABEL } from '../lib/labels';
import { formatDateTime } from '../lib/risk';

interface Props {
  submittedCount: number;
  finalCount: number;
  pending: ContactChange[];
  recorded: ContactChange[];
  onUndo: (changeId: string) => void;
}

const ORDER: ChangeKind[] = ['REMOVE', 'ADD', 'EDIT'];

const Row: FC<{ change: ContactChange; pending: boolean; onUndo: (id: string) => void }> = ({
  change,
  pending,
  onUndo,
}) => (
  <div className="csq-ap-diffrow">
    <div>
      <div className="csq-ap-cname">
        {change.contact.name}
        {pending ? <span className="csq-ap-pendingtag">Not yet recorded</span> : null}
      </div>
      <div className="csq-ap-cline">
        {change.contact.company} · {COMPANY_TYPE_LABEL[change.contact.companyType]} ·{' '}
        {change.contact.email}
      </div>

      {change.kind === 'EDIT' && change.fields
        ? change.fields.map((f) => (
            <div className="csq-ap-fieldchange" key={f.field}>
              {f.label}: <span className="from">{f.from || 'empty'}</span>{' '}
              <span aria-hidden="true">&gt;</span> <span className="to">{f.to || 'empty'}</span>
            </div>
          ))
        : null}

      <div className="csq-ap-reason">
        <span className="tag">{REASON_LABEL[change.reason]}.</span>{' '}
        {change.note || 'No further note recorded.'}
      </div>
      <div className="csq-ap-meta">
        {change.by} · {formatDateTime(change.at)}
      </div>
    </div>

    <div className="csq-ap-cact">
      {pending ? (
        <button
          type="button"
          className="csq-ap-btn csq-ap-btn--sm"
          onClick={() => onUndo(change.id)}
          aria-label={`Undo the change to ${change.contact.name}`}
        >
          Undo
        </button>
      ) : null}
    </div>
  </div>
);

export const ChangeDiff: FC<Props> = ({ submittedCount, finalCount, pending, recorded, onUndo }) => {
  const all = [...recorded.map((c) => ({ c, pending: false })), ...pending.map((c) => ({ c, pending: true }))];

  if (all.length === 0) {
    return (
      <div className="csq-ap-empty">
        <b>No changes to the operator’s sample</b>
        Everything below the line is exactly as it was submitted. Corrections and removals you make
        appear here as a diff before you approve anything.
      </div>
    );
  }

  return (
    <div>
      <div className="csq-ap-banner csq-ap-banner--warn">
        <b>
          {submittedCount} contacts submitted, {finalCount} after review
        </b>
        The operator receives this diff with the decision, including every reason code and note.
      </div>

      {ORDER.map((kind) => {
        const group = all.filter((x) => x.c.kind === kind);
        if (group.length === 0) return null;
        return (
          <div className="csq-ap-diffgroup" key={kind}>
            <div className="csq-ap-diffhead">
              {CHANGE_KIND_LABEL[kind]} <span className="csq-ap-num">({group.length})</span>
            </div>
            {group.map((x) => (
              <Row key={x.c.id} change={x.c} pending={x.pending} onUndo={onUndo} />
            ))}
          </div>
        );
      })}
    </div>
  );
};
