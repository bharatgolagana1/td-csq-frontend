import { useMemo } from 'react';

import { type QuestionReportRow } from '@/api/reports.types';
import { DeltaChip } from '@/design/charts';
import { type Column, EmptyState, type SortState, Table, Tag } from '@/design/primitives';
import { formatInt, formatRating } from '@/lib/format';

import styles from './dashboard.module.css';
import { isSuppressed } from './derive';

export type QuestionsTableProps = {
  rows: QuestionReportRow[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  filtered: boolean;
};

const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * dir;
};

/** Client-side sort: the question table is one page (a survey has tens of questions, not thousands). */
export function sortQuestions(rows: readonly QuestionReportRow[], sort: SortState): QuestionReportRow[] {
  const dir: 1 | -1 = sort.dir === 'asc' ? 1 : -1;
  const sorted = [...rows];
  switch (sort.id) {
    case 'customer':
      return sorted.sort((a, b) => nullsLast(a.customer.mean, b.customer.mean, dir));
    case 'delta':
      return sorted.sort((a, b) => nullsLast(a.delta, b.delta, dir));
    case 'comments':
      return sorted.sort((a, b) => (a.comments - b.comments) * dir);
    case 'code':
      return sorted.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }) * dir);
    default:
      return sorted;
  }
}

export function QuestionsTable({ rows, loading, sort, onSortChange, filtered }: QuestionsTableProps) {
  const sorted = useMemo(() => sortQuestions(rows, sort), [rows, sort]);
  const columns: Column<QuestionReportRow>[] = [
    { id: 'code', header: 'Code', width: 110, mono: true, sortable: true, cell: (q) => q.code },
    {
      id: 'text',
      header: 'Question',
      cell: (q) => (
        <span className={styles.name}>
          <span className={styles.questionText}>{q.text}</span>
          <span className={styles.nameSub}>
            {q.category.name}
            {q.subcategory ? ` › ${q.subcategory.name}` : ''}
          </span>
        </span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      width: 110,
      align: 'right',
      mono: true,
      sortable: true,
      cell: (q) => (isSuppressed(q) ? <Tag tone="outline">Suppressed</Tag> : formatRating(q.customer.mean)),
    },
    { id: 'n', header: 'n', width: 64, align: 'right', mono: true, hideBelow: 'sm', cell: (q) => formatInt(q.customer.n) },
    { id: 'na', header: 'NA', width: 64, align: 'right', mono: true, hideBelow: 'md', cell: (q) => formatInt(q.customer.naCount) },
    { id: 'self', header: 'Self', width: 72, align: 'right', mono: true, hideBelow: 'sm', cell: (q) => formatRating(q.self.mean) },
    { id: 'previous', header: 'Previous', width: 88, align: 'right', mono: true, hideBelow: 'md', cell: (q) => formatRating(q.previous) },
    { id: 'delta', header: 'Change', width: 96, align: 'right', sortable: true, cell: (q) => <DeltaChip value={q.delta} size="sm" /> },
    { id: 'comments', header: 'Comments', width: 100, align: 'right', mono: true, sortable: true, cell: (q) => formatInt(q.comments) },
  ];
  return (
    <Table
      caption="Questions"
      columns={columns}
      rows={sorted}
      rowKey={(q) => q.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      dense
      empty={<EmptyState icon="search" size="sm" title={filtered ? 'No questions match' : 'No questions'} description={filtered ? 'Try another search or category.' : 'The survey pinned to this cycle has no active questions.'} />}
    />
  );
}
