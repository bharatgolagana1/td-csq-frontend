import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { type OperatorReport } from '@/api/reports.types';
import { DeltaChip, PairedBars, Segmented } from '@/design/charts';
import { Card, type Column, EmptyState, Table, Tag } from '@/design/primitives';
import { formatInt, formatRating } from '@/lib/format';

import styles from './dashboard.module.css';
import { type CategoryLevel, isSuppressed, type LevelRow, levelRows, pairedRows, parameterCount } from './derive';

type View = 'bars' | 'table';

const LEVELS: { value: CategoryLevel; label: string }[] = [
  { value: 'categories', label: 'Categories' },
  { value: 'subcategories', label: 'Subcategories' },
];

const VIEWS: { value: View; label: string }[] = [
  { value: 'bars', label: 'Bars' },
  { value: 'table', label: 'Table' },
];

const COLUMNS: Column<LevelRow>[] = [
  {
    id: 'name',
    header: 'Category',
    cell: (r) => (
      <span className={styles.name}>
        <span className={styles.nameMain}>{r.name}</span>
        {r.parent ? <span className={styles.nameSub}>{r.parent}</span> : null}
      </span>
    ),
  },
  {
    id: 'customer',
    header: 'Current',
    width: 120,
    align: 'right',
    mono: true,
    cell: (r) =>
      isSuppressed(r) ? (
        <Tag tone="outline">Suppressed</Tag>
      ) : (
        <>
          {formatRating(r.customer.mean)}
          <span className={styles.cellN}>n {formatInt(r.customer.n)}</span>
        </>
      ),
  },
  { id: 'previous', header: 'Previous', width: 96, align: 'right', mono: true, hideBelow: 'sm', cell: (r) => formatRating(r.previous) },
  { id: 'delta', header: 'Change', width: 96, align: 'right', cell: (r) => <DeltaChip value={r.delta} size="sm" /> },
  { id: 'self', header: 'Self', width: 80, align: 'right', mono: true, hideBelow: 'sm', cell: (r) => formatRating(r.self.mean) },
];

/** Category ratings: current over previous per category with the self marker, delta chip; a table twin behind a toggle (§7). */
export function CategoriesCard({ report, questionsTo }: { report: OperatorReport; questionsTo: string }) {
  const [level, setLevel] = useState<CategoryLevel>('categories');
  const [view, setView] = useState<View>('bars');
  const rows = useMemo(() => levelRows(report.categories, level), [report.categories, level]);
  const parameters = parameterCount(report.categories);
  const hasSubcategories = parameters > 0;
  const subtitle = hasSubcategories
    ? `${formatInt(report.categories.length)} categories · ${formatInt(parameters)} parameters · customer rating against the previous cycle, self as a marker`
    : 'Customer rating per category against the previous cycle, self as a marker';

  return (
    <Card className={styles.categories} title="Category ratings" subtitle={subtitle}>
      <div className={styles.toggles}>
        {hasSubcategories ? <Segmented aria-label="Level" value={level} onChange={setLevel} options={LEVELS} /> : null}
        <Segmented aria-label="View" value={view} onChange={setView} options={VIEWS} />
      </div>
      {view === 'bars' ? (
        <PairedBars
          rows={pairedRows(rows)}
          labels={{ current: 'Current', previous: 'Previous', self: 'Self' }}
          summary="Customer rating per category, current over previous, self as a marker"
          emptyTitle="No categories"
          emptyDescription="The survey pinned to this cycle has no categories."
        />
      ) : (
        <Table
          caption="Category ratings"
          columns={COLUMNS}
          rows={rows}
          rowKey={(r) => r.id}
          dense
          stickyHeader={false}
          empty={<EmptyState icon="chart" size="sm" title="No categories" description="The survey pinned to this cycle has no categories." />}
        />
      )}
      <div className={styles.cardFoot}>
        <span>Deltas compare the customer rating with the previous scored cycle of the same survey type.</span>
        <Link className={styles.link} to={questionsTo}>
          Question-level table →
        </Link>
      </div>
    </Card>
  );
}
