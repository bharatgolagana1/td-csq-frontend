import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { type Operator } from '@/api/operators.types';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, type MenuItem, Pill, type SortState, statusVariant, Table } from '@/design/primitives';
import { formatInt, formatPct, humanise } from '@/lib/format';

import { OperationsTags } from './OperationsTags';
import styles from './operators.module.css';

export type OperatorsTableProps = {
  rows: Operator[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  canManage: boolean;
  onEdit: (o: Operator) => void;
  onDeactivate: (o: Operator) => void;
  emptyAction?: ReactNode;
};

/** Code · name · airport · operations · status · members · customers · current share. */
export function OperatorsTable({ rows, loading, sort, onSortChange, canManage, onEdit, onDeactivate, emptyAction }: OperatorsTableProps) {
  const navigate = useNavigate();

  const columns: Column<Operator>[] = [
    { id: 'code', header: 'Code', width: 120, mono: true, sortable: true, cell: (o) => <span className={styles.code}>{o.code}</span> },
    {
      id: 'name',
      header: 'Operator',
      sortable: true,
      cell: (o) => (
        <span className={styles.nameCell}>
          <Link to={o.id} className={styles.nameLink} onClick={(e) => e.stopPropagation()}>
            {o.name}
          </Link>
          {o.legalName && o.legalName !== o.name ? <span className={styles.nameSub}>{o.legalName}</span> : null}
        </span>
      ),
    },
    {
      id: 'airport',
      header: 'Airport',
      width: 180,
      cell: (o) => (
        <span className={styles.airportCell}>
          <span className={styles.code}>{o.airport.iata}</span>
          <span>{o.airport.name}</span>
        </span>
      ),
    },
    { id: 'operations', header: 'Operations', hideBelow: 'sm', cell: (o) => <OperationsTags operations={o.operations} /> },
    { id: 'status', header: 'Status', width: 110, sortable: true, cell: (o) => <Pill variant={statusVariant(o.status)}>{humanise(o.status)}</Pill> },
    { id: 'members', header: 'Members', width: 100, align: 'right', mono: true, hideBelow: 'md', cell: (o) => formatInt(o.memberCount) },
    { id: 'customers', header: 'Customers', width: 110, align: 'right', mono: true, hideBelow: 'md', cell: (o) => formatInt(o.customerCount) },
    { id: 'share', header: 'Share', width: 90, align: 'right', mono: true, cell: (o) => formatPct(o.currentShare) },
  ];

  const rowActions = canManage
    ? (o: Operator): MenuItem[] => [
        { id: 'open', label: 'Open', icon: <Icon name="external" size={16} />, onSelect: () => navigate(o.id) },
        { id: 'edit', label: 'Edit', icon: <Icon name="edit" size={16} />, onSelect: () => onEdit(o) },
        { id: 'sep', separator: true },
        { id: 'deactivate', label: 'Deactivate', icon: <Icon name="lock" size={16} />, danger: true, disabled: o.status === 'INACTIVE', onSelect: () => onDeactivate(o) },
      ]
    : undefined;

  return (
    <Table
      caption="Operators"
      columns={columns}
      rows={rows}
      rowKey={(o) => o.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      rowActions={rowActions}
      onRowClick={(o) => navigate(o.id)}
      empty={<EmptyState icon="building" title="No operators match" description="Try another search or filter, or add an operator." action={emptyAction} />}
    />
  );
}
