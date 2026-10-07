import { useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useUsers } from '@/api/identity';
import { type UserStatus } from '@/api/types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, EmptyState, PageHeader, Pagination, SearchInput, Select, type SortState, Toolbar, ToolbarCount } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import { InviteUserDrawer } from './InviteUserDrawer';
import { usersTabs } from './usersTabs';
import { UsersTable } from './UsersTable';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

/** Users & roles → Users: table with search, status pill and memberships; invite drawer. */
export default function UsersPage() {
  const { hasTask, org } = useSession();
  const canManage = hasTask('users.manage');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ id: 'name', dir: 'asc' });
  const [inviteOpen, setInviteOpen] = useState(false);

  const query = useUsers({
    q: q || undefined,
    status: status || undefined,
    page,
    pageSize,
    sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
  });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users & roles"
        context={hasTask('operators.view') ? 'Everyone with access to CSQ, across every organisation.' : `People with access to ${org.name}.`}
        tabs={{ tabs: usersTabs('users', hasTask('roles.view')), 'aria-label': 'Users and roles' }}
        actions={
          canManage ? (
            <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setInviteOpen(true)}>
              Invite user
            </Button>
          ) : undefined
        }
      />

      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'user' : 'users'}`}</ToolbarCount>}>
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          debounce={300}
          placeholder="Search name or e-mail"
          label="Search users"
        />
        <Select
          aria-label="Status"
          options={STATUS_OPTIONS}
          value={status}
          size="sm"
          onChange={(e) => {
            setStatus(e.target.value as UserStatus | '');
            setPage(1);
          }}
        />
      </Toolbar>

      {query.isError ? (
        <EmptyState
          icon="warning"
          title="Could not load users"
          description={
            <>
              {errorMessage(query.error)}
              {errorRequestId(query.error) ? (
                <>
                  {' '}
                  · Request <code>{errorRequestId(query.error)}</code>
                </>
              ) : null}
            </>
          }
          action={
            <Button variant="primary" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <UsersTable
            rows={rows}
            loading={query.isPending}
            sort={sort}
            onSortChange={setSort}
            canManage={canManage}
            emptyAction={
              canManage && !q && !status ? (
                <Button variant="primary" onClick={() => setInviteOpen(true)}>
                  Invite the first user
                </Button>
              ) : undefined
            }
          />
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
        </>
      )}

      <InviteUserDrawer open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
