import { useId, type FC } from 'react';
import type { CustomerType, FormScope } from '../api/sampling.types';
import { CUSTOMER_TYPES, FORM_SCOPES, SCOPE_LABEL, TYPE_LABEL, plural } from '../api/sampling.logic';
import { hasActiveFilters, type DirectoryFilters } from '../directory';

interface Props {
  filters: DirectoryFilters;
  onChange: (next: DirectoryFilters) => void;
  visibleCount: number;
  totalCount: number;
  locked: boolean;
}

export const DirectoryToolbar: FC<Props> = ({ filters, onChange, visibleCount, totalCount, locked }) => {
  const searchId = useId();
  const typeId = useId();
  const scopeId = useId();
  const selectedId = useId();

  return (
    <div className="smp-toolbar">
      <div className="smp-search">
        <label className="smp-sr" htmlFor={searchId}>
          Search the directory by name, company, email or phone
        </label>
        <input
          id={searchId}
          className="smp-input"
          type="search"
          value={filters.query}
          placeholder="Search name, company, email or phone"
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>

      <label className="smp-sr" htmlFor={typeId}>
        Filter by customer type
      </label>
      <select
        id={typeId}
        className="smp-select"
        value={filters.type}
        onChange={(event) => onChange({ ...filters, type: event.target.value as CustomerType | 'ALL' })}
      >
        <option value="ALL">All customer types</option>
        {CUSTOMER_TYPES.map((type) => (
          <option key={type} value={type}>
            {TYPE_LABEL[type]}
          </option>
        ))}
      </select>

      <label className="smp-sr" htmlFor={scopeId}>
        Filter by form scope
      </label>
      <select
        id={scopeId}
        className="smp-select"
        value={filters.scope}
        onChange={(event) => onChange({ ...filters, scope: event.target.value as FormScope | 'ALL' })}
      >
        <option value="ALL">All form scopes</option>
        {FORM_SCOPES.map((scope) => (
          <option key={scope} value={scope}>
            {SCOPE_LABEL[scope]}
          </option>
        ))}
      </select>

      {!locked ? (
        <label className="smp-confirm" style={{ padding: '8px 11px', fontSize: 12.5 }} htmlFor={selectedId}>
          <input
            id={selectedId}
            type="checkbox"
            checked={filters.onlySelected}
            onChange={(event) => onChange({ ...filters, onlySelected: event.target.checked })}
          />
          Selected only
        </label>
      ) : null}

      {hasActiveFilters(filters) ? (
        <button
          type="button"
          className="smp-btn smp-btn--ghost"
          onClick={() => onChange({ query: '', type: 'ALL', scope: 'ALL', onlySelected: false, restrictToIds: null })}
        >
          Clear filters
        </button>
      ) : null}

      <span className="smp-count" role="status">
        {visibleCount === totalCount
          ? `${totalCount} ${plural(totalCount, 'contact', 'contacts')}`
          : `${visibleCount} of ${totalCount} contacts`}
      </span>
    </div>
  );
};

export default DirectoryToolbar;
