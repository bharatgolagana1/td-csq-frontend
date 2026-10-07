import { type Registration } from '@/api/onboarding.types';
import { type Column, EmptyState, Pill, type SortState, Table, Tag } from '@/design/primitives';
import { formatPct, formatRelative } from '@/lib/format';

import styles from './onboarding.module.css';
import { ORG_TYPE_LABEL, registrationStatusLabel, registrationStatusVariant } from './onboardingLabels';

export type RequestsTableProps = {
  rows: Registration[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  onOpen: (r: Registration) => void;
  filtered: boolean;
};

/** Organisation · type · airport · administrator · requested share · submitted · status; row opens the review drawer. */
export function RequestsTable({ rows, loading, sort, onSortChange, onOpen, filtered }: RequestsTableProps) {
  const columns: Column<Registration>[] = [
    {
      id: 'organisation',
      header: 'Organisation',
      cell: (r) => (
        <span className={styles.cell}>
          <button type="button" className={styles.cellMain} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }} onClick={() => onOpen(r)}>
            {r.organisation.name}
          </button>
          {r.organisation.legalName && r.organisation.legalName !== r.organisation.name ? <span className={styles.cellSub}>{r.organisation.legalName}</span> : null}
        </span>
      ),
    },
    { id: 'orgType', header: 'Type', width: 150, sortable: true, hideBelow: 'sm', cell: (r) => <Tag tone={r.orgType === 'ACO' ? 'accent' : 'neutral'}>{ORG_TYPE_LABEL[r.orgType]}</Tag> },
    {
      id: 'airport',
      header: 'Airport',
      width: 180,
      cell: (r) =>
        r.airport ? (
          <span className={styles.airportCell}>
            <span className={styles.code}>{r.airport.iata}</span>
            <span>{r.airport.name}</span>
          </span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      id: 'admin',
      header: 'Administrator',
      hideBelow: 'md',
      cell: (r) => (
        <span className={styles.cell}>
          <span>{r.admin.name}</span>
          <span className={styles.cellSub}>{r.admin.email}</span>
        </span>
      ),
    },
    { id: 'share', header: 'Share', width: 90, align: 'right', mono: true, hideBelow: 'sm', cell: (r) => formatPct(r.marketSharePct) },
    { id: 'createdAt', header: 'Submitted', width: 140, sortable: true, mono: true, cell: (r) => formatRelative(r.createdAt) },
    { id: 'status', header: 'Status', width: 140, sortable: true, cell: (r) => <Pill variant={registrationStatusVariant(r.status)}>{registrationStatusLabel(r.status)}</Pill> },
  ];

  return (
    <Table
      caption="Registration requests"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={onOpen}
      empty={
        <EmptyState
          icon="clipboard"
          title={filtered ? 'No requests match' : 'No registration requests yet'}
          description={filtered ? 'Try another status or type.' : 'Requests appear here when an organisation submits the form behind an onboarding link.'}
        />
      }
    />
  );
}
