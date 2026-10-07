import { useMemo, useState } from 'react';

import { Button } from '@/design/primitives';

import styles from './audit.module.css';
import { changedCount, type DiffRow, diffRows } from './diff';

export type DiffTableProps = {
  before: unknown;
  after: unknown;
};

/** Before/after of an audit entry, one row per dotted path; changed rows are highlighted. */
export function DiffTable({ before, after }: DiffTableProps) {
  const rows = useMemo(() => diffRows(before, after), [before, after]);
  const changed = changedCount(rows);
  const [onlyChanged, setOnlyChanged] = useState(true);
  const visible = onlyChanged && changed > 0 ? rows.filter((r) => r.changed) : rows;

  if (rows.length === 0) {
    return <p className={styles.muted}>This entry recorded no before/after snapshot.</p>;
  }

  return (
    <div className={styles.diff}>
      <div className={styles.diffBar}>
        <span className={styles.diffCount} aria-live="polite">
          {changed === 0 ? 'No changes' : `${changed} ${changed === 1 ? 'change' : 'changes'}`} · {rows.length} {rows.length === 1 ? 'field' : 'fields'}
        </span>
        {changed > 0 && changed < rows.length ? (
          <Button variant="ghost" size="sm" onClick={() => setOnlyChanged((v) => !v)} aria-pressed={onlyChanged}>
            {onlyChanged ? 'Show all fields' : 'Show changes only'}
          </Button>
        ) : null}
      </div>
      <div className={styles.diffWrap}>
        <table className={styles.diffTable}>
          <caption className="visually-hidden">Before and after</caption>
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Before</th>
              <th scope="col">After</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <DiffRowView key={r.path} row={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  return (
    <tr className={row.changed ? styles.changed : undefined} data-changed={row.changed || undefined}>
      <th scope="row" className={styles.diffPath}>
        {row.path || '(value)'}
      </th>
      <td className={styles.diffBefore}>{row.before === undefined ? <span className={styles.muted}>—</span> : row.before}</td>
      <td className={styles.diffAfter}>{row.after === undefined ? <span className={styles.muted}>—</span> : row.after}</td>
    </tr>
  );
}
