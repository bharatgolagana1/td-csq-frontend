import type { FC } from 'react';
import type { QueueRow } from '../api/approvals.types';
import { APPROVAL_MODE_LABEL } from '../lib/labels';
import type { SortKey, SortState } from '../lib/queue';
import { formatDate, relativeTime, type RiskAssessment } from '../lib/risk';
import { FlagTallyChips, RiskPill, SlaText, StatusPill } from './Pills';

interface Props {
  rows: QueueRow[];
  risks: Map<string, RiskAssessment>;
  sort: SortState;
  onSort: (key: SortKey) => void;
  onOpen: (batchId: string) => void;
}

interface Column {
  key: SortKey;
  label: string;
  numeric?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'RISK', label: 'Risk' },
  { key: 'OPERATOR', label: 'Operator and terminal' },
  { key: 'SUBMITTED', label: 'Submitted', numeric: true },
  { key: 'CONTACTS', label: 'Contacts', numeric: true },
  { key: 'FLAGS', label: 'Integrity signals' },
  { key: 'SLA', label: 'Review deadline', numeric: true },
  { key: 'STATUS', label: 'Status' },
];

export const QueueTable: FC<Props> = ({ rows, risks, sort, onSort, onOpen }) => (
  <div className="csq-ap-tablewrap">
    <table className="csq-ap-table">
      <caption className="csq-ap-label" style={{ textAlign: 'left', paddingBottom: 10 }}>
        Locked customer samples awaiting a Super Admin decision
      </caption>
      <thead>
        <tr>
          {COLUMNS.map((col) => {
            const active = sort.key === col.key;
            return (
              <th
                key={col.key}
                scope="col"
                aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" className="csq-ap-sort" onClick={() => onSort(col.key)}>
                  {col.label}
                  <span className="arw" aria-hidden="true">
                    {active ? (sort.dir === 'asc' ? '▲' : '▼') : '◇'}
                  </span>
                </button>
              </th>
            );
          })}
          <th scope="col">
            <span className="csq-ap-label">Open</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const risk = risks.get(r.batchId);
          const short = r.minimumContacts - r.contactCount;
          const decided = r.status === 'APPROVED' || r.status === 'REJECTED';
          return (
            <tr key={r.batchId} className={decided ? 'is-decided' : undefined}>
              <td>
                <RiskPill band={risk?.band ?? 'ROUTINE'} reasons={risk?.reasons ?? []} />
                {risk && risk.reasons.length > 0 ? (
                  <div className="csq-ap-meta">{risk.reasons.slice(0, 2).join(' · ')}</div>
                ) : null}
              </td>

              <td>
                <button type="button" className="csq-ap-open" onClick={() => onOpen(r.batchId)}>
                  {r.operatorName}
                </button>
                <div className="csq-ap-meta">
                  {r.terminalName} · {r.airportName} <span className="csq-ap-iata">{r.airportIata}</span> ·{' '}
                  {r.cycleLabel}
                </div>
                {r.approvalMode === 'AUTOMATIC' ? (
                  <div className="csq-ap-meta" style={{ color: 'var(--csq-r2)', fontWeight: 700 }}>
                    {APPROVAL_MODE_LABEL.AUTOMATIC}
                  </div>
                ) : null}
              </td>

              <td className="csq-ap-num">
                {formatDate(r.submittedAt)}
                <div className="csq-ap-meta">
                  {relativeTime(r.submittedAt)} · {r.submittedBy}
                </div>
              </td>

              <td className="csq-ap-num">
                <span style={{ fontWeight: 700, fontSize: 15 }}>{r.contactCount}</span>
                <div className="csq-ap-meta">minimum {r.minimumContacts}</div>
                {short > 0 ? (
                  <div className="csq-ap-meta csq-ap-short">{short} short</div>
                ) : null}
              </td>

              <td>
                <FlagTallyChips tally={r.flags} />
              </td>

              <td>
                <SlaText dueAt={r.slaDueAt} status={r.status} />
                <div className="csq-ap-meta">{formatDate(r.slaDueAt)}</div>
              </td>

              <td>
                <StatusPill status={r.status} />
                {r.decidedAt ? (
                  <div className="csq-ap-meta">
                    {relativeTime(r.decidedAt)} · {r.decidedBy}
                  </div>
                ) : null}
              </td>

              <td>
                <button
                  type="button"
                  className="csq-ap-btn csq-ap-btn--sm"
                  onClick={() => onOpen(r.batchId)}
                  aria-label={`Review the sample from ${r.operatorName} at ${r.airportName}`}
                >
                  Review
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
