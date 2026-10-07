import { type ReactNode } from 'react';

import { type OnboardingLink } from '@/api/onboarding.types';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, type MenuItem, Pill, type SortState, Table, Tag } from '@/design/primitives';
import { formatDate, formatRelative } from '@/lib/format';

import styles from './onboarding.module.css';
import { linkStatusLabel, linkStatusVariant, ORG_TYPE_LABEL } from './onboardingLabels';

export type LinksTableProps = {
  rows: OnboardingLink[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  canManage: boolean;
  onRevoke: (link: OnboardingLink) => void;
  onViewRequest: (registrationId: string) => void;
  emptyAction?: ReactNode;
};

/** Type · airport · note · created · expires · status; revoke / view request. */
export function LinksTable({ rows, loading, sort, onSortChange, canManage, onRevoke, onViewRequest, emptyAction }: LinksTableProps) {
  const columns: Column<OnboardingLink>[] = [
    { id: 'orgType', header: 'Type', width: 150, sortable: true, cell: (l) => <Tag tone={l.orgType === 'ACO' ? 'accent' : 'neutral'}>{ORG_TYPE_LABEL[l.orgType]}</Tag> },
    {
      id: 'airport',
      header: 'Airport',
      width: 200,
      cell: (l) =>
        l.airport ? (
          <span className={styles.airportCell}>
            <span className={styles.code}>{l.airport.iata}</span>
            <span>{l.airport.name}</span>
          </span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    { id: 'note', header: 'Note', hideBelow: 'md', cell: (l) => (l.note ? <span className={styles.note}>{l.note}</span> : <span className={styles.muted}>—</span>) },
    {
      id: 'createdAt',
      header: 'Created',
      width: 170,
      sortable: true,
      hideBelow: 'sm',
      cell: (l) => (
        <span className={styles.cell}>
          <span>{formatRelative(l.createdAt)}</span>
          <span className={styles.cellSub}>{l.createdBy?.name ?? '—'}</span>
        </span>
      ),
    },
    {
      id: 'expiresAt',
      header: 'Expires',
      width: 160,
      sortable: true,
      mono: true,
      cell: (l) => (
        <span className={styles.cell}>
          <span>{formatDate(l.expiresAt)}</span>
          <span className={styles.cellSub}>{l.status === 'USED' ? `used ${formatRelative(l.usedAt)}` : l.status === 'EXPIRED' ? 'expired' : formatRelative(l.expiresAt)}</span>
        </span>
      ),
    },
    { id: 'status', header: 'Status', width: 110, cell: (l) => <Pill variant={linkStatusVariant(l.status)}>{linkStatusLabel(l.status)}</Pill> },
  ];

  const rowActions = (l: OnboardingLink): MenuItem[] => {
    const items: MenuItem[] = [];
    if (l.registrationId) {
      const regId = l.registrationId;
      items.push({ id: 'view', label: 'View request', icon: <Icon name="external" size={16} />, onSelect: () => onViewRequest(regId) });
    }
    if (canManage && l.status !== 'USED') {
      if (items.length > 0) items.push({ id: 'sep', separator: true });
      items.push({ id: 'revoke', label: 'Revoke link', icon: <Icon name="trash" size={16} />, danger: true, onSelect: () => onRevoke(l) });
    }
    return items;
  };

  return (
    <Table
      caption="Onboarding links"
      columns={columns}
      rows={rows}
      rowKey={(l) => l.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      rowActions={rowActions}
      empty={<EmptyState icon="link" title="No onboarding links" description="Create a link and send it to the organisation; they register themselves and you review the request." action={emptyAction} />}
    />
  );
}
