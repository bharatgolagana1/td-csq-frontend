import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAirports } from '@/api/airports';
import { type Operator, type OrgStatus } from '@/api/operators.types';
import { useOperators } from '@/api/organisations';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, PageHeader, Pagination, SearchInput, Select, type SortState, Toolbar, ToolbarCount } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt } from '@/lib/format';

import { DeactivateOperatorDialog } from './DeactivateOperatorDialog';
import { OperatorCreateDrawer } from './OperatorCreateDrawer';
import { OperatorEditDrawer } from './OperatorEditDrawer';
import { STATUS_FILTER_OPTIONS } from './operatorLabels';
import { OperatorsTable } from './OperatorsTable';

/** Organisations → Operators: the ACO list with airport and status filters, search, create/edit drawers and deactivation. */
export default function OperatorsPage() {
  const { hasTask } = useSession();
  const canManage = hasTask('operators.manage');
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [airportId, setAirportId] = useState('');
  const [status, setStatus] = useState<OrgStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ id: 'name', dir: 'asc' });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Operator | null>(null);
  const [deactivating, setDeactivating] = useState<Operator | null>(null);

  const query = useOperators({
    q: q || undefined,
    airportId: airportId || undefined,
    status: status || undefined,
    page,
    pageSize,
    sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
  });
  const airports = useAirports({ pageSize: 200, sort: 'iata' }, hasTask('airports.view'));
  const airportOptions = [{ value: '', label: 'All airports' }, ...(airports.data?.data ?? []).map((a) => ({ value: a.id, label: `${a.iata} · ${a.name}` }))];

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const filtered = Boolean(q || airportId || status);

  return (
    <>
      <PageHeader
        eyebrow="Organisations"
        title="Operators"
        context="Airport cargo operators (ACOs): who they are, where they operate and who runs them."
        actions={
          canManage ? (
            <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setCreateOpen(true)}>
              Add operator
            </Button>
          ) : undefined
        }
      />

      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'operator' : 'operators'}`}</ToolbarCount>}>
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          debounce={300}
          placeholder="Search code or name"
          label="Search operators"
        />
        {hasTask('airports.view') ? (
          <Select
            aria-label="Airport"
            options={airportOptions}
            value={airportId}
            size="sm"
            onChange={(e) => {
              setAirportId(e.target.value);
              setPage(1);
            }}
          />
        ) : null}
        <Select
          aria-label="Status"
          options={STATUS_FILTER_OPTIONS}
          value={status}
          size="sm"
          onChange={(e) => {
            setStatus(e.target.value as OrgStatus | '');
            setPage(1);
          }}
        />
      </Toolbar>

      {query.isError ? (
        <QueryError error={query.error} title="Could not load operators" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <OperatorsTable
            rows={rows}
            loading={query.isPending}
            sort={sort}
            onSortChange={setSort}
            canManage={canManage}
            onEdit={setEditing}
            onDeactivate={setDeactivating}
            emptyAction={
              canManage && !filtered ? (
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Add the first operator
                </Button>
              ) : undefined
            }
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </>
      )}

      <OperatorCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(op) => navigate(op.id)} />
      <OperatorEditDrawer open={editing !== null} onClose={() => setEditing(null)} operator={editing} />
      <DeactivateOperatorDialog operator={deactivating} onClose={() => setDeactivating(null)} />
    </>
  );
}
