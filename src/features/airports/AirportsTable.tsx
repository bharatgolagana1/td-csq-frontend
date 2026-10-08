import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { type Airport } from '@/api/airports.types';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, type MenuItem, Pill, type SortState, Table } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import styles from './airports.module.css';

export type AirportsTableProps = {
  rows: Airport[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  canManage: boolean;
  onEdit: (airport: Airport) => void;
  onToggleActive: (airport: Airport) => void;
  emptyAction?: ReactNode;
};

/** IATA · name · city · state · region · active · operators; row opens the detail. */
export function AirportsTable({ rows, loading, sort, onSortChange, canManage, onEdit, onToggleActive, emptyAction }: AirportsTableProps) {
  const navigate = useNavigate();

  const columns: Column<Airport>[] = [
    { id: 'iata', header: 'IATA', width: 88, mono: true, sortable: true, cell: (a) => <span className={styles.code}>{a.iata}</span> },
    {
      id: 'name',
      header: 'Airport',
      sortable: true,
      cell: (a) => (
        <span className={styles.nameCell}>
          <Link to={a.id} className={styles.nameLink} onClick={(e) => e.stopPropagation()}>
            {a.name}
          </Link>
          <span className={styles.nameSub}>{a.icao ?? '—'}</span>
        </span>
      ),
    },
    { id: 'city', header: 'City', sortable: true, hideBelow: 'sm', cell: (a) => a.city },
    { id: 'state', header: 'State', sortable: true, hideBelow: 'md', cell: (a) => a.state },
    { id: 'region', header: 'Region', width: 120, sortable: true, hideBelow: 'md', cell: (a) => a.region },
    { id: 'active', header: 'Status', width: 110, cell: (a) => <Pill variant={a.active ? 'success' : 'neutral'}>{a.active ? 'Active' : 'Inactive'}</Pill> },
    {
      id: 'operators',
      header: 'Operators',
      width: 110,
      align: 'right',
      mono: true,
      cell: (a) => formatInt(a.operatorCount),
    },
  ];

  const rowActions = canManage
    ? (a: Airport): MenuItem[] => [
        { id: 'open', label: 'Open', icon: <Icon name="external" size={16} />, onSelect: () => navigate(a.id) },
        { id: 'edit', label: 'Edit', icon: <Icon name="edit" size={16} />, onSelect: () => onEdit(a) },
        { id: 'sep', separator: true },
        a.active
          ? { id: 'deactivate', label: 'Mark inactive', icon: <Icon name="lock" size={16} />, danger: true, onSelect: () => onToggleActive(a) }
          : { id: 'activate', label: 'Mark active', icon: <Icon name="unlock" size={16} />, onSelect: () => onToggleActive(a) },
      ]
    : undefined;

  return (
    <Table
      caption="Airports"
      columns={columns}
      rows={rows}
      rowKey={(a) => a.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      rowActions={rowActions}
      onRowClick={(a) => navigate(a.id)}
      empty={<EmptyState icon="plane" title="No airports match" description="Try another search or filter, or add an airport." action={emptyAction} />}
    />
  );
}
