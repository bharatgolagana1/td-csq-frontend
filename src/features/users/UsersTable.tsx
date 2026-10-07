import { type ReactNode } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useUpdateUser } from '@/api/identity';
import { type UserRow } from '@/api/types';
import { Icon } from '@/design/icons';
import { Avatar, type Column, EmptyState, type MenuItem, Pill, type SortState, statusVariant, Table, useToast } from '@/design/primitives';
import { formatRelative, humanise } from '@/lib/format';

import styles from './users.module.css';

export type UsersTableProps = {
  rows: UserRow[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  canManage: boolean;
  emptyAction?: ReactNode;
};

export function UsersTable({ rows, loading, sort, onSortChange, canManage, emptyAction }: UsersTableProps) {
  const toast = useToast();
  const update = useUpdateUser();

  const setStatus = (user: UserRow, status: 'ACTIVE' | 'SUSPENDED') => {
    update.mutate(
      { id: user.id, status },
      {
        onSuccess: () => toast.success(status === 'SUSPENDED' ? `${user.name} suspended` : `${user.name} reactivated`),
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  const columns: Column<UserRow>[] = [
    {
      id: 'name',
      header: 'User',
      sortable: true,
      cell: (u) => (
        <span className={styles.user}>
          <Avatar name={u.name} size="sm" />
          <span className={styles.userText}>
            <span className={styles.userName}>{u.name}</span>
            <span className={styles.userEmail}>{u.email}</span>
          </span>
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: 120,
      sortable: true,
      cell: (u) => <Pill variant={statusVariant(u.status)}>{humanise(u.status)}</Pill>,
    },
    {
      id: 'memberships',
      header: 'Memberships',
      hideBelow: 'md',
      cell: (u) => (
        <span className={styles.memberships}>
          {u.memberships.length === 0 ? <span style={{ color: 'var(--muted)' }}>—</span> : null}
          {u.memberships.map((m) => (
            <span key={`${m.orgId}-${m.roleCode}`} className={styles.membership}>
              {m.orgName}
              <span className={styles.membershipRole}>· {humanise(m.roleCode)}</span>
            </span>
          ))}
        </span>
      ),
    },
    { id: 'phone', header: 'Phone', width: 150, mono: true, hideBelow: 'sm', cell: (u) => u.phone ?? '—' },
    { id: 'lastLoginAt', header: 'Last sign-in', width: 150, mono: true, sortable: true, align: 'right', cell: (u) => (u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Never') },
  ];

  const rowActions = canManage
    ? (u: UserRow): MenuItem[] => [
        {
          id: 'copy',
          label: 'Copy e-mail',
          icon: <Icon name="mail" size={16} />,
          onSelect: () => {
            void navigator.clipboard?.writeText(u.email).then(() => toast.info('E-mail copied'));
          },
        },
        { id: 'sep', separator: true },
        u.status === 'SUSPENDED'
          ? { id: 'activate', label: 'Reactivate', icon: <Icon name="unlock" size={16} />, onSelect: () => setStatus(u, 'ACTIVE') }
          : { id: 'suspend', label: 'Suspend', icon: <Icon name="lock" size={16} />, danger: true, onSelect: () => setStatus(u, 'SUSPENDED') },
      ]
    : undefined;

  return (
    <Table
      caption="Users"
      columns={columns}
      rows={rows}
      rowKey={(u) => u.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      rowActions={rowActions}
      empty={<EmptyState icon="users" title="No users match" description="Try another search or status, or invite someone new." action={emptyAction} />}
    />
  );
}
