import { type ReactNode } from 'react';

import { EmptyState } from '@/design/primitives/EmptyState/EmptyState';
import { RatingPill } from '@/design/primitives/Pill/Pill';
import { type Column, Table } from '@/design/primitives/Table/Table';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/format';

import styles from './RankTable.module.css';

export type RankRow = {
  id: string;
  label: string;
  sublabel?: string;
  rating: number | null;
  rank: number | null;
  rankOf?: number;
  /** Optional extra cell, e.g. assessments count. */
  extra?: ReactNode;
};

export type RankTableProps = {
  rows: RankRow[];
  /** Row to highlight (the viewer's own airport/operator). */
  highlightId?: string;
  labelHeader?: string;
  extraHeader?: string;
  loading?: boolean;
  emptyTitle?: string;
  className?: string;
};

/** Plain table for the All-India ranking: airport, rating, rank; own row highlighted (§7). */
export function RankTable({ rows, highlightId, labelHeader = 'Airport', extraHeader, loading, emptyTitle = 'No ranking yet', className }: RankTableProps) {
  const columns: Column<RankRow>[] = [
    {
      id: 'rank',
      header: 'Rank',
      width: 96,
      align: 'right',
      mono: true,
      cell: (r) => (r.rank === null ? '—' : `${r.rank}${r.rankOf ? ` / ${r.rankOf}` : ''}`),
    },
    {
      id: 'label',
      header: labelHeader,
      cell: (r) => (
        <span className={styles.label}>
          <span className={styles.name}>{r.label}</span>
          {r.sublabel ? <span className={styles.sub}>{r.sublabel}</span> : null}
        </span>
      ),
    },
    { id: 'rating', header: 'Rating', width: 90, align: 'right', mono: true, cell: (r) => formatRating(r.rating) },
    { id: 'band', header: 'Band', width: 120, hideBelow: 'sm', cell: (r) => <RatingPill rating={r.rating} size="sm" /> },
  ];
  if (extraHeader) columns.push({ id: 'extra', header: extraHeader, align: 'right', mono: true, cell: (r) => r.extra ?? '—' });

  return (
    <Table
      className={cn(styles.root, className)}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      loading={loading}
      dense
      rowClassName={(r) => (r.id === highlightId ? styles.highlight : undefined)}
      empty={<EmptyState icon="chart" title={emptyTitle} size="sm" />}
      caption="Ranking"
    />
  );
}
