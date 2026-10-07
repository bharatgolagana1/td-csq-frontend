import { useState } from 'react';

import { useUsers } from '@/api/identity';
import { type Operator } from '@/api/operators.types';
import { type UserRow } from '@/api/types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Avatar, Button, type Column, EmptyState, Pill, statusVariant, Table } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatRelative, humanise } from '@/lib/format';

import { InviteMemberDrawer } from './InviteMemberDrawer';
import styles from './operators.module.css';

function roleAt(u: UserRow, orgId: string): string {
  const m = u.memberships.find((x) => x.orgId === orgId);
  return m ? humanise(m.roleCode) : '—';
}

/** Members tab: `GET /users?orgId=` with the invite drawer (users.manage). */
export function OperatorMembers({ operator }: { operator: Operator }) {
  const { hasTask } = useSession();
  const canInvite = hasTask('users.manage');
  const [inviteOpen, setInviteOpen] = useState(false);
  const query = useUsers({ orgId: operator.id, pageSize: 100, sort: 'name' });
  const rows = query.data?.data ?? [];

  const columns: Column<UserRow>[] = [
    {
      id: 'name',
      header: 'Member',
      cell: (u) => (
        <span className={styles.user}>
          <Avatar name={u.name} size="sm" />
          <span className={styles.nameCell}>
            <span className={styles.nameLink}>{u.name}</span>
            <span className={styles.nameSub}>{u.email}</span>
          </span>
        </span>
      ),
    },
    { id: 'role', header: 'Role', width: 160, cell: (u) => roleAt(u, operator.id) },
    { id: 'status', header: 'Status', width: 120, cell: (u) => <Pill variant={statusVariant(u.status)}>{humanise(u.status)}</Pill> },
    { id: 'lastLoginAt', header: 'Last sign-in', width: 150, mono: true, align: 'right', hideBelow: 'sm', cell: (u) => (u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Never') },
  ];

  const invite = canInvite ? (
    <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setInviteOpen(true)}>
      Invite member
    </Button>
  ) : undefined;

  return (
    <>
      <div className={styles.toolbarRow}>
        <p className={styles.muted}>People with access to {operator.name}. Roles are set per membership in Users &amp; roles.</p>
        {invite}
      </div>
      {query.isError ? (
        <QueryError error={query.error} title="Could not load members" onRetry={() => void query.refetch()} />
      ) : (
        <Table
          caption="Members"
          columns={columns}
          rows={rows}
          rowKey={(u) => u.id}
          loading={query.isPending}
          empty={<EmptyState icon="users" title="No members yet" description="Invite the operator's administrator so they can start sampling." action={invite} />}
        />
      )}
      <InviteMemberDrawer open={inviteOpen} onClose={() => setInviteOpen(false)} operator={operator} />
    </>
  );
}
