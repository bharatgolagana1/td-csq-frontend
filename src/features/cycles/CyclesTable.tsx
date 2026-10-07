import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { type CycleSummary } from '@/api/cycles.types';
import { Icon } from '@/design/icons';
import { Card, type Column, EmptyState, type MenuItem, Pill, Skeleton, type SortState, statusVariant, Table } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import { CYCLE_STATUS_LABELS, CYCLE_TYPE_LABELS, formatWindow, TYPE_PILL } from './cycleLabels';
import { CycleMeters } from './CycleMeters';
import styles from './cycles.module.css';

export type CyclesTableProps = {
  rows: CycleSummary[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  canManage: boolean;
  emptyAction?: ReactNode;
  /** True when a filter or search is active (changes the empty copy). */
  filtered: boolean;
};

function Title({ cycle }: { cycle: CycleSummary }) {
  return (
    <span className={styles.rowTitle}>
      <span className={styles.rowName}>{cycle.name}</span>
      <span className={styles.rowCode}>{cycle.code}</span>
    </span>
  );
}

function Windows({ cycle }: { cycle: CycleSummary }) {
  return (
    <span className={styles.windowCell}>
      <span>
        <b>Sampling</b> {formatWindow(cycle.sampling, cycle.tz)}
      </span>
      <span>
        <b>Assessment</b> {formatWindow(cycle.assessment, cycle.tz)}
      </span>
    </span>
  );
}

/** Table at ≥760px, a card list below it (route-relative links so the dev shell works). */
export function CyclesTable({ rows, loading, sort, onSortChange, canManage, emptyAction, filtered }: CyclesTableProps) {
  const navigate = useNavigate();

  const columns: Column<CycleSummary>[] = [
    { id: 'name', header: 'Cycle', sortable: true, cell: (c) => <Title cycle={c} /> },
    { id: 'type', header: 'Type', width: 120, sortable: true, cell: (c) => <Pill variant={TYPE_PILL[c.type]}>{CYCLE_TYPE_LABELS[c.type]}</Pill> },
    { id: 'status', header: 'Status', width: 150, sortable: true, cell: (c) => <Pill variant={statusVariant(c.status)}>{CYCLE_STATUS_LABELS[c.status]}</Pill> },
    { id: 'sampling.start.utc', header: 'Windows', sortable: true, hideBelow: 'md', cell: (c) => <Windows cycle={c} /> },
    {
      id: 'participants',
      header: 'Airports · operators',
      width: 150,
      align: 'right',
      mono: true,
      hideBelow: 'sm',
      cell: (c) => (
        <span className={styles.counts}>
          {formatInt(c.participants.airports)} · {formatInt(c.participants.operators)}
        </span>
      ),
    },
    { id: 'progress', header: 'Progress', width: 220, cell: (c) => <CycleMeters cycle={c} /> },
  ];

  const rowActions = (c: CycleSummary): MenuItem[] => {
    const items: MenuItem[] = [{ id: 'open', label: 'Open', icon: <Icon name="eye" size={16} />, onSelect: () => navigate(c.id) }];
    if (canManage && c.status === 'DRAFT') {
      items.push({ id: 'edit', label: 'Edit draft', icon: <Icon name="edit" size={16} />, onSelect: () => navigate(`${c.id}/edit`) });
    }
    return items;
  };

  const empty = (
    <EmptyState
      icon="cycles"
      title={filtered ? 'No cycles match' : 'No cycles yet'}
      description={filtered ? 'Try another search, status or type.' : 'Create the first assessment cycle: windows, minimum sample, reminders and participants.'}
      action={emptyAction}
    />
  );

  return (
    <>
      <div className={styles.tableWrap}>
        <Table
          caption="Cycles"
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          loading={loading}
          sort={sort}
          onSortChange={onSortChange}
          rowActions={rowActions}
          onRowClick={(c) => navigate(c.id)}
          empty={empty}
        />
      </div>
      <div className={styles.cards} aria-label="Cycles">
        {loading ? (
          <div className={styles.skeletonStack}>
            <Skeleton height={120} radius={10} />
            <Skeleton height={120} radius={10} />
          </div>
        ) : rows.length === 0 ? (
          empty
        ) : (
          rows.map((c) => (
            <Link key={c.id} to={c.id} className={styles.cardLink}>
              <Card as="article" padding="sm">
                <div className={styles.cardHead}>
                  <Title cycle={c} />
                  <span className={styles.pills}>
                    <Pill variant={TYPE_PILL[c.type]} size="sm">
                      {CYCLE_TYPE_LABELS[c.type]}
                    </Pill>
                    <Pill variant={statusVariant(c.status)} size="sm">
                      {CYCLE_STATUS_LABELS[c.status]}
                    </Pill>
                  </span>
                </div>
                <dl className={styles.cardRows}>
                  <dt>Sampling</dt>
                  <dd>{formatWindow(c.sampling, c.tz)}</dd>
                  <dt>Assessment</dt>
                  <dd>{formatWindow(c.assessment, c.tz)}</dd>
                  <dt>Participants</dt>
                  <dd className={styles.counts}>
                    {formatInt(c.participants.airports)} airports · {formatInt(c.participants.operators)} operators
                  </dd>
                </dl>
                {c.status !== 'DRAFT' ? (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <CycleMeters cycle={c} />
                  </div>
                ) : null}
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
