import { type ReactNode } from 'react';

import { type Customer } from '@/api/customers.types';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, type MenuItem, Pill, type SortState, statusVariant, Table, Tag } from '@/design/primitives';

import { STATUS_LABELS, SURVEY_LABELS, surveyVariant, TYPE_LABELS, typeVariant } from './customerLabels';
import styles from './customers.module.css';
import { formatPhone } from './phone';

export type CustomersTableProps = {
  rows: Customer[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  canManage: boolean;
  selected: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
  onOpen: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onSetStatus: (customer: Customer, status: 'ACTIVE' | 'INACTIVE') => void;
  onTagClick: (tag: string) => void;
  emptyAction?: ReactNode;
  filtered: boolean;
};

export function lastSampledLabel(c: Customer): string {
  if (c.lastSampledCycle) return c.lastSampledCycle.code;
  return c.lastSampledCycleId ? 'Sampled' : 'Never';
}

/** Directory table: name · contact · e-mail · phone · type · survey type · status · last sampled · tags. */
export function CustomersTable({ rows, loading, sort, onSortChange, canManage, selected, onSelectedChange, onOpen, onEdit, onSetStatus, onTagClick, emptyAction, filtered }: CustomersTableProps) {
  const columns: Column<Customer>[] = [
    {
      id: 'name',
      header: 'Customer',
      sortable: true,
      cell: (c) => (
        <span className={styles.customer}>
          <button type="button" className={styles.linkButton} onClick={() => onOpen(c)}>
            {c.name}
          </button>
          <span className={styles.customerContact}>{c.contactPerson}</span>
        </span>
      ),
    },
    { id: 'email', header: 'E-mail', sortable: true, hideBelow: 'md', cell: (c) => <span className={styles.email}>{c.email}</span> },
    { id: 'phone', header: 'Phone', width: 150, mono: true, hideBelow: 'md', cell: (c) => formatPhone(c.phone) },
    {
      id: 'type',
      header: 'Type',
      width: 80,
      sortable: true,
      cell: (c) => (
        <Pill variant={typeVariant(c.type)} dot={false} size="sm" title={TYPE_LABELS[c.type]}>
          {c.type}
        </Pill>
      ),
    },
    {
      id: 'surveyType',
      header: 'Survey',
      width: 120,
      sortable: true,
      hideBelow: 'sm',
      cell: (c) => (
        <Pill variant={surveyVariant(c.surveyType)} dot={false} size="sm">
          {SURVEY_LABELS[c.surveyType]}
        </Pill>
      ),
    },
    { id: 'status', header: 'Status', width: 110, sortable: true, cell: (c) => <Pill variant={statusVariant(c.status)}>{STATUS_LABELS[c.status]}</Pill> },
    { id: 'lastSampled', header: 'Last sampled', width: 130, mono: true, hideBelow: 'md', cell: (c) => <span className={c.lastSampledCycleId ? undefined : styles.muted}>{lastSampledLabel(c)}</span> },
    {
      id: 'tags',
      header: 'Tags',
      hideBelow: 'md',
      cell: (c) => (
        <span className={styles.tags}>
          {c.tags.length === 0 ? <span className={styles.muted}>—</span> : null}
          {c.tags.map((t) => (
            <button key={t} type="button" className={styles.tagButton} onClick={() => onTagClick(t)} aria-label={`Filter by tag ${t}`}>
              <Tag tone="neutral">{t}</Tag>
            </button>
          ))}
        </span>
      ),
    },
  ];

  const rowActions = (c: Customer): MenuItem[] => {
    const items: MenuItem[] = [{ id: 'open', label: 'View details', icon: <Icon name="eye" size={16} />, onSelect: () => onOpen(c) }];
    if (canManage) {
      items.push({ id: 'edit', label: 'Edit', icon: <Icon name="edit" size={16} />, onSelect: () => onEdit(c) }, { id: 'sep', separator: true });
      items.push(
        c.status === 'INACTIVE'
          ? { id: 'activate', label: 'Reactivate', icon: <Icon name="refresh" size={16} />, onSelect: () => onSetStatus(c, 'ACTIVE') }
          : { id: 'deactivate', label: 'Deactivate', icon: <Icon name="trash" size={16} />, danger: true, onSelect: () => onSetStatus(c, 'INACTIVE') },
      );
    }
    return items;
  };

  return (
    <Table
      caption="Customers"
      columns={columns}
      rows={rows}
      rowKey={(c) => c.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      selectable={canManage}
      selected={selected}
      onSelectedChange={onSelectedChange}
      rowActions={rowActions}
      empty={
        <EmptyState
          icon="users"
          title={filtered ? 'No customers match' : 'No customers yet'}
          description={filtered ? 'Try another search, type, survey type, status or tag.' : 'Add freight forwarders and customs brokers one by one, or import a CSV.'}
          action={emptyAction}
        />
      }
    />
  );
}
