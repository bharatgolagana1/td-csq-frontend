import type { FC } from 'react';
import type { ApprovalStatus, FlagTally } from '../api/approvals.types';
import { FLAG_META } from '../lib/integrity';
import { STATUS_META } from '../lib/labels';
import { flagEntries, formatSla, RISK_BAND_META, type RiskBand } from '../lib/risk';

export const StatusPill: FC<{ status: ApprovalStatus }> = ({ status }) => {
  const meta = STATUS_META[status];
  return (
    <span className="csq-ap-pill" style={{ color: meta.colour, background: meta.bg }}>
      {meta.label}
    </span>
  );
};

export const RiskPill: FC<{ band: RiskBand; reasons: string[] }> = ({ band, reasons }) => {
  const meta = RISK_BAND_META[band];
  return (
    <span
      className="csq-ap-pill"
      style={{ color: meta.colour, background: 'var(--csq-surface-2)' }}
      // the pill is a summary; the reasons are spelled out next to it in the row
      aria-label={reasons.length > 0 ? `${meta.label} risk: ${reasons.join(', ')}` : `${meta.label} risk`}
    >
      <i className="csq-ap-dot" style={{ background: meta.colour }} />
      {meta.label}
    </span>
  );
};

export const SlaText: FC<{ dueAt: string; status: ApprovalStatus }> = ({ dueAt, status }) => {
  if (status === 'APPROVED' || status === 'REJECTED' || status === 'AUTO_APPROVED') {
    return <span style={{ color: 'var(--csq-muted)' }}>Closed</span>;
  }
  const sla = formatSla(dueAt);
  return (
    <span className="csq-ap-num" style={{ color: sla.colour, fontWeight: sla.overdue ? 700 : 400 }}>
      {sla.text}
    </span>
  );
};

/** Compact tally for the queue, where there is no room to explain each signal. */
export const FlagTallyChips: FC<{ tally: FlagTally }> = ({ tally }) => {
  const entries = flagEntries(tally);
  if (entries.length === 0) {
    return <span style={{ color: 'var(--csq-muted)' }}>None</span>;
  }
  return (
    <span className="csq-ap-tally">
      {entries.map(({ code, count }) => (
        <span
          key={code}
          className="csq-ap-flag csq-ap-flag--static"
          style={{ color: FLAG_META[code].colour }}
          title={FLAG_META[code].explain}
        >
          {FLAG_META[code].label}
          <b className="csq-ap-num">{count}</b>
        </span>
      ))}
    </span>
  );
};
