import { useId, type FC } from 'react';
import type { ApprovalMode } from '../api/approvals.types';
import { isFiltered, type QueueFilters, type StatusFilter } from '../lib/queue';

interface Props {
  filters: QueueFilters;
  cycles: Array<{ id: string; label: string }>;
  showing: number;
  total: number;
  onChange: (next: QueueFilters) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'OPEN', label: 'Open items' },
  { value: 'AWAITING_REVIEW', label: 'Awaiting review' },
  { value: 'AUTO_APPROVED', label: 'Auto approved' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'Every batch' },
];

export const QueueToolbar: FC<Props> = ({ filters, cycles, showing, total, onChange, onReset }) => {
  const searchId = useId();
  const statusId = useId();
  const cycleId = useId();
  const modeId = useId();

  const set = <K extends keyof QueueFilters>(key: K, value: QueueFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div>
      <div className="csq-ap-toolbar">
        <div className="csq-ap-field csq-ap-grow">
          <label className="csq-ap-label" htmlFor={searchId}>
            Search
          </label>
          <input
            id={searchId}
            className="csq-ap-input"
            type="search"
            value={filters.search}
            placeholder="Operator, terminal or airport"
            onChange={(e) => set('search', e.target.value)}
          />
        </div>

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={statusId}>
            Status
          </label>
          <select
            id={statusId}
            className="csq-ap-select"
            value={filters.status}
            onChange={(e) => set('status', e.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={cycleId}>
            Cycle
          </label>
          <select
            id={cycleId}
            className="csq-ap-select"
            value={filters.cycleId}
            onChange={(e) => set('cycleId', e.target.value)}
          >
            <option value="ALL">All cycles</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={modeId}>
            Approval mode
          </label>
          <select
            id={modeId}
            className="csq-ap-select"
            value={filters.mode}
            onChange={(e) => set('mode', e.target.value as ApprovalMode | 'ALL')}
          >
            <option value="ALL">Any mode</option>
            <option value="REQUIRES_REVIEW">Requires review</option>
            <option value="AUTOMATIC">Automatic approval</option>
          </select>
        </div>

        <label className="csq-ap-check">
          <input
            type="checkbox"
            checked={filters.onlyFlagged}
            onChange={(e) => set('onlyFlagged', e.target.checked)}
          />
          Flagged only
        </label>

        <label className="csq-ap-check">
          <input
            type="checkbox"
            checked={filters.onlyShort}
            onChange={(e) => set('onlyShort', e.target.checked)}
          />
          Below minimum
        </label>
      </div>

      <div
        className="csq-ap-meta"
        style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
        aria-live="polite"
      >
        <span>
          Showing {showing} of {total} batches
        </span>
        {isFiltered(filters) ? (
          <button type="button" className="csq-ap-btn csq-ap-btn--ghost csq-ap-btn--sm" onClick={onReset}>
            Back to open items
          </button>
        ) : null}
      </div>
    </div>
  );
};
