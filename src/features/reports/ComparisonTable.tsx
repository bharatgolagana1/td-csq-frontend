import { useMemo } from 'react';

import { type ComparisonRow } from '@/api/reports.types';
import { DeltaChip } from '@/design/charts';
import { type Column, EmptyState, Table, Tag } from '@/design/primitives';
import { formatInt, formatRating } from '@/lib/format';

import { type ComparedCycle, comparisonDelta, valuesInOrder } from './derive';
import styles from './reports.module.css';

export type ComparisonTableProps = {
  rows: ComparisonRow[];
  cycles: ComparedCycle[];
  /** Name the parent (category / subcategory) under the row for the deeper levels. */
  parentNames?: Map<string, string>;
  caption: string;
};

/** One survey node per row, one column per compared cycle, then the change later − earlier. */
export function ComparisonTable({ rows, cycles, parentNames, caption }: ComparisonTableProps) {
  const columns = useMemo<Column<ComparisonRow>[]>(() => {
    const cols: Column<ComparisonRow>[] = [
      {
        id: 'name',
        header: 'Item',
        cell: (r) => (
          <span className={styles.name}>
            <span className={styles.wrapText}>{r.name}</span>
            <span className={styles.nameSub}>{[r.code, r.parentCode ? parentNames?.get(r.parentCode) : undefined].filter(Boolean).join(' · ')}</span>
          </span>
        ),
      },
    ];
    cycles.forEach((c, i) => {
      cols.push({
        id: `c${i}`,
        header: c.name,
        width: 128,
        align: 'right',
        mono: true,
        cell: (r) => {
          const v = valuesInOrder(r.values, cycles)[i];
          if (!v) return <span className={styles.nameSub}>not in survey</span>;
          if (v.suppressed) return <Tag tone="outline">Suppressed</Tag>;
          return (
            <>
              {formatRating(v.customer.mean)}
              <span className={styles.cellN}>n {formatInt(v.customer.n)}</span>
            </>
          );
        },
      });
    });
    cols.push({ id: 'delta', header: 'Change', width: 96, align: 'right', cell: (r) => <DeltaChip value={comparisonDelta(valuesInOrder(r.values, cycles))} size="sm" title="later minus earlier cycle" /> });
    cycles.forEach((c, i) => {
      cols.push({ id: `s${i}`, header: `Self · ${c.code}`, width: 110, align: 'right', mono: true, hideBelow: 'md', cell: (r) => formatRating(valuesInOrder(r.values, cycles)[i]?.self.mean) });
    });
    return cols;
  }, [cycles, parentNames]);

  return <Table caption={caption} columns={columns} rows={rows} rowKey={(r) => r.code} dense stickyHeader={false} empty={<EmptyState icon="chart" size="sm" title="Nothing at this level" description="The compared surveys have no items here." />} />;
}
