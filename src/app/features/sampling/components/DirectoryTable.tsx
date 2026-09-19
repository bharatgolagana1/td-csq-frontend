import type { FC } from 'react';
import type { Customer } from '../api/sampling.types';
import { SCOPE_DIRECTIONS, SCOPE_LABEL, TYPE_LABEL, formatDate } from '../api/sampling.logic';
import type { SortKey, SortState } from '../directory';

interface Props {
  rows: Customer[];
  selected: Set<string>;
  /** customer id to the plain language reasons it was flagged, for the row marker */
  flags: Map<string, string[]>;
  sort: SortState;
  onSort: (key: SortKey) => void;
  onToggle: (id: string) => void;
  onToggleVisible: (checked: boolean) => void;
  onRemove: (customer: Customer) => void;
  selectable: boolean;
  removable: boolean;
}

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'type', label: 'Customer type' },
  { key: 'scope', label: 'Form scope' },
  { key: 'lastSampledAt', label: 'Last sampled' },
];

export const DirectoryTable: FC<Props> = ({
  rows,
  selected,
  flags,
  sort,
  onSort,
  onToggle,
  onToggleVisible,
  onRemove,
  selectable,
  removable,
}) => {
  const pickedHere = rows.filter((row) => selected.has(row.id)).length;
  const allPicked = rows.length > 0 && pickedHere === rows.length;
  const somePicked = pickedHere > 0 && !allPicked;

  return (
    <div className="smp-tablewrap">
      <table className="smp-table">
        <caption className="smp-sr">
          Customer directory. Select contacts to build the sample for this cycle.
        </caption>
        <thead>
          <tr>
            {selectable ? (
              <th scope="col" className="cell-pick">
                <label className="smp-pick">
                  <span className="smp-sr">
                    {allPicked ? 'Clear the selection of every listed contact' : 'Select every listed contact'}
                  </span>
                  <input
                    type="checkbox"
                    checked={allPicked}
                    disabled={rows.length === 0}
                    ref={(element) => {
                      if (element) element.indeterminate = somePicked;
                    }}
                    onChange={(event) => onToggleVisible(event.target.checked)}
                  />
                </label>
              </th>
            ) : null}

            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <button type="button" className="smp-sort" onClick={() => onSort(column.key)}>
                    {column.label}
                    <span className="arrow" aria-hidden="true">
                      {active ? (sort.dir === 'asc' ? '▲' : '▼') : '▲'}
                    </span>
                  </button>
                </th>
              );
            })}

            {removable ? (
              <th scope="col" className="cell-act">
                <span className="pad smp-sr">Remove</span>
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const picked = selected.has(row.id);
            const rowFlags = flags.get(row.id);
            return (
              <tr key={row.id} className={picked ? 'is-picked' : undefined}>
                {selectable ? (
                  <td className="cell-pick">
                    <label className="smp-pick">
                      <span className="smp-sr">Include {row.name} of {row.company} in the sample</span>
                      <input type="checkbox" checked={picked} onChange={() => onToggle(row.id)} />
                    </label>
                  </td>
                ) : null}

                <td className="nm">
                  {row.name}
                  {rowFlags ? (
                    <span className="smp-flag" role="img" title={rowFlags.join(' ')} aria-label={`Flagged for review. ${rowFlags.join(' ')}`}>
                      !
                    </span>
                  ) : null}
                </td>
                <td className="co">{row.company}</td>
                <td className="em">{row.email}</td>
                <td className="num">{row.phone}</td>
                <td>
                  <span className="smp-tag">{TYPE_LABEL[row.type]}</span>
                </td>
                <td>
                  <span className="smp-tag" title={`Rates ${SCOPE_DIRECTIONS[row.scope]}`}>
                    {SCOPE_LABEL[row.scope]}
                  </span>
                </td>
                <td className="num">
                  {row.lastSampledAt ? formatDate(row.lastSampledAt) : <span className="smp-never">Never</span>}
                </td>

                {removable ? (
                  <td className="cell-act">
                    <button
                      type="button"
                      className="smp-rowremove"
                      onClick={() => onRemove(row)}
                      aria-label={`Remove ${row.name} of ${row.company} from the directory`}
                    >
                      &times;
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DirectoryTable;
