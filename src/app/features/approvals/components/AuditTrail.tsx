import type { FC } from 'react';
import type { AuditEntry } from '../api/approvals.types';
import { REASON_LABEL } from '../lib/changes';
import { formatDateTime, relativeTime } from '../lib/risk';

const ROLE_COLOUR: Record<AuditEntry['role'], string> = {
  OPERATOR: 'var(--csq-ink-2)',
  SUPER_ADMIN: 'var(--csq-accent)',
  SYSTEM: 'var(--csq-muted)',
};

/** Newest first: a reviewer opening a batch wants the last thing that happened. */
export const AuditTrail: FC<{ entries: AuditEntry[] }> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="csq-ap-empty">
        <b>Nothing recorded yet</b>
        Every submission, change and decision on this batch will be listed here.
      </div>
    );
  }

  const ordered = [...entries].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="csq-ap-audit">
      {ordered.map((e) => (
        <div className="csq-ap-auditrow" key={e.id}>
          <div className="csq-ap-auditwhen">
            {formatDateTime(e.at)}
            <div>{relativeTime(e.at)}</div>
          </div>
          <div>
            <div className="csq-ap-auditwho" style={{ color: ROLE_COLOUR[e.role] }}>
              {e.actor}
              {e.pending ? <span className="csq-ap-pendingtag">Not yet recorded</span> : null}
            </div>
            <div className="csq-ap-auditwhat">{e.action}</div>
            {e.reason ? (
              <div className="csq-ap-auditdetail">
                <b>Reason:</b> {REASON_LABEL[e.reason]}
              </div>
            ) : null}
            {e.detail ? <div className="csq-ap-auditdetail">{e.detail}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
};
