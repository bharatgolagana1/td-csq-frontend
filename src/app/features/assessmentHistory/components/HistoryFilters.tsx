import type { FC } from 'react';
import type { CycleSummary } from '../api/history.types';
import type { BandFilter, KindFilter } from '../lib/filters';
import { BAND_OPTIONS, KIND_OPTIONS } from '../lib/filters';

interface Props {
  cycles: CycleSummary[];
  cycleId: string;
  onCycle: (id: string) => void;
  kind: KindFilter;
  onKind: (value: KindFilter) => void;
  band: BandFilter;
  onBand: (value: BandFilter) => void;
  summaryLine: string;
  isFiltered: boolean;
  onClear: () => void;
  busy: boolean;
}

export const HistoryFilters: FC<Props> = ({
  cycles,
  cycleId,
  onCycle,
  kind,
  onKind,
  band,
  onBand,
  summaryLine,
  isFiltered,
  onClear,
  busy,
}) => (
  <div className="csqh-card">
    <div className="csqh-filters">
      <div className="csqh-field">
        <label className="csqh-label" htmlFor="csqh-cycle">
          Cycle
        </label>
        <select
          id="csqh-cycle"
          className="csqh-select"
          value={cycleId}
          disabled={busy}
          onChange={(e) => onCycle(e.target.value)}
        >
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="csqh-field">
        <label className="csqh-label" htmlFor="csqh-kind">
          Assessor kind
        </label>
        <select
          id="csqh-kind"
          className="csqh-select"
          value={kind}
          onChange={(e) => onKind(e.target.value as KindFilter)}
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="csqh-field">
        <label className="csqh-label" htmlFor="csqh-band">
          Score band
        </label>
        <select
          id="csqh-band"
          className="csqh-select"
          value={band}
          onChange={(e) => onBand(e.target.value as BandFilter)}
        >
          {BAND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="csqh-filters-foot">
      <span aria-live="polite">{summaryLine}</span>
      {isFiltered ? (
        <button type="button" className="csqh-btn csqh-btn--sm" onClick={onClear}>
          Clear filters
        </button>
      ) : null}
    </div>
  </div>
);

export default HistoryFilters;
