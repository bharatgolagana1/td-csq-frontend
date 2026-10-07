import { type ReactNode } from 'react';

import { type HistoryRow } from '@/api/assessments.types';
import { type Column, EmptyState, Pill, type SortState, Table } from '@/design/primitives';
import { formatDateTime, formatRating } from '@/lib/format';

import styles from './history.module.css';
import { assessorLabel, KIND_LABELS, kindVariant, STATUS_LABELS, statusPillVariant, TYPE_LABELS, zoneAbbr } from './historyLabels';
import { useMediaQuery } from './useMediaQuery';

export type HistoryTableProps = {
  rows: HistoryRow[];
  loading: boolean;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  onOpen: (row: HistoryRow) => void;
  /** Cycle id → IANA zone, for the submitted column. */
  tzOf: (cycleId: string) => string;
  filtered: boolean;
  onClearFilters: () => void;
};

function submittedLabel(row: HistoryRow, tz: string): string {
  if (!row.submittedAt) return '—';
  return `${formatDateTime(row.submittedAt, tz)} ${zoneAbbr(tz, new Date(row.submittedAt))}`;
}

function Empty({ filtered, onClearFilters }: { filtered: boolean; onClearFilters: () => void }): ReactNode {
  return filtered ? (
    <EmptyState
      icon="filter"
      size="sm"
      title="No assessments match these filters"
      action={
        <button type="button" className={styles.linkButton} onClick={onClearFilters}>
          Clear filters
        </button>
      }
    />
  ) : (
    <EmptyState icon="clipboard" size="sm" title="No assessments yet" description="Customer returns appear here as participants answer; your self-assessment once it is started." />
  );
}

/** Cycle · kind · customer type · assessor (masked e-mail) · status · submitted · score. Cards under 760px. */
export function HistoryTable({ rows, loading, sort, onSortChange, onOpen, tzOf, filtered, onClearFilters }: HistoryTableProps) {
  const phone = useMediaQuery('(max-width: 760px)');

  if (phone) {
    if (loading) {
      return (
        <ul className={styles.cards} aria-busy="true" aria-label="Loading assessments">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className={styles.cardSkeleton} />
          ))}
        </ul>
      );
    }
    if (rows.length === 0) return <Empty filtered={filtered} onClearFilters={onClearFilters} />;
    return (
      <ul className={styles.cards} aria-label="Assessments">
        {rows.map((row) => {
          const tz = tzOf(row.cycle.id);
          return (
            <li key={row.id}>
              <button type="button" className={styles.card} onClick={() => onOpen(row)}>
                <span className={styles.cardTop}>
                  <span className={styles.cardCycle}>{row.cycle.code}</span>
                  <Pill variant={statusPillVariant(row.status)} size="sm">
                    {STATUS_LABELS[row.status]}
                  </Pill>
                </span>
                <span className={styles.cardName}>{assessorLabel(row)}</span>
                {row.assessorEmailMasked ? <span className={styles.cardEmail}>{row.assessorEmailMasked}</span> : null}
                <span className={styles.cardMeta}>
                  <Pill variant={kindVariant(row.kind)} dot={false} size="sm">
                    {KIND_LABELS[row.kind]}
                  </Pill>
                  {row.customerType ? (
                    <Pill variant="neutral" dot={false} size="sm" title={TYPE_LABELS[row.customerType]}>
                      {row.customerType}
                    </Pill>
                  ) : null}
                  <span className={styles.cardScore}>{formatRating(row.score)}</span>
                </span>
                <span className={styles.cardSubmitted}>{row.submittedAt ? `Submitted ${submittedLabel(row, tz)}` : `${row.progress.answered} of ${row.progress.total} answered`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const columns: Column<HistoryRow>[] = [
    {
      id: 'cycle',
      header: 'Cycle',
      cell: (r) => (
        <span className={styles.cycle}>
          <span className={styles.cycleCode}>{r.cycle.code}</span>
          <span className={styles.cycleName}>{r.cycle.name}</span>
        </span>
      ),
    },
    {
      id: 'kind',
      header: 'Kind',
      width: 110,
      sortable: true,
      cell: (r) => (
        <Pill variant={kindVariant(r.kind)} dot={false} size="sm">
          {KIND_LABELS[r.kind]}
        </Pill>
      ),
    },
    {
      id: 'customerType',
      header: 'Type',
      width: 80,
      sortable: true,
      hideBelow: 'md',
      cell: (r) =>
        r.customerType ? (
          <Pill variant="neutral" dot={false} size="sm" title={TYPE_LABELS[r.customerType]}>
            {r.customerType}
          </Pill>
        ) : (
          <span className={styles.dash}>—</span>
        ),
    },
    {
      id: 'assessor',
      header: 'Assessor',
      cell: (r) => (
        <span className={styles.assessor}>
          <span className={styles.assessorName}>{assessorLabel(r)}</span>
          {r.assessorEmailMasked ? <span className={styles.assessorEmail}>{r.assessorEmailMasked}</span> : null}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: 120,
      sortable: true,
      cell: (r) => (
        <Pill variant={statusPillVariant(r.status)} size="sm">
          {STATUS_LABELS[r.status]}
        </Pill>
      ),
    },
    { id: 'submittedAt', header: 'Submitted', width: 190, sortable: true, mono: true, hideBelow: 'md', cell: (r) => submittedLabel(r, tzOf(r.cycle.id)) },
    { id: 'score', header: 'Score', width: 80, align: 'right', mono: true, cell: (r) => formatRating(r.score) },
  ];

  return (
    <Table
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      sort={sort}
      onSortChange={onSortChange}
      loading={loading}
      stickyHeader
      onRowClick={onOpen}
      caption="Assessments"
      empty={<Empty filtered={filtered} onClearFilters={onClearFilters} />}
    />
  );
}
