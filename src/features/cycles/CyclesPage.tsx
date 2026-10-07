import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCycles } from '@/api/cycles';
import { CYCLE_STATUSES, CYCLE_TYPES, type CycleStatus, type CycleType } from '@/api/cycles.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, PageHeader, Pagination, SearchInput, Select, type SortState, Toolbar, ToolbarCount } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt } from '@/lib/format';

import { CYCLE_STATUS_LABELS, CYCLE_TYPE_LABELS } from './cycleLabels';
import styles from './cycles.module.css';
import { CyclesTable } from './CyclesTable';

const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...CYCLE_STATUSES.map((s) => ({ value: s, label: CYCLE_STATUS_LABELS[s] }))];
const TYPE_OPTIONS = [{ value: '', label: 'All types' }, ...CYCLE_TYPES.map((t) => ({ value: t, label: CYCLE_TYPE_LABELS[t] }))];

/** Cycles → list: code, name, type, status, windows, participants, progress; filters, search, New cycle. */
export default function CyclesPage() {
  const { hasTask, scope } = useSession();
  const navigate = useNavigate();
  const canManage = hasTask('cycles.manage');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<CycleStatus | ''>('');
  const [type, setType] = useState<CycleType | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ id: 'sampling.start.utc', dir: 'desc' });

  const query = useCycles({
    q: q || undefined,
    status: status || undefined,
    type: type || undefined,
    page,
    pageSize,
    sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
  });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const filtered = Boolean(q || status || type);

  return (
    <>
      <PageHeader
        eyebrow="Cycles"
        title="Cycles"
        context={scope.kind === 'PLATFORM' ? 'Every assessment cycle: draft, publish, monitor and score.' : 'The assessment cycles your organisation takes part in.'}
        actions={
          canManage ? (
            <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => navigate('new')}>
              New cycle
            </Button>
          ) : undefined
        }
      />

      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'cycle' : 'cycles'}`}</ToolbarCount>}>
        <div className={styles.filters}>
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            debounce={300}
            placeholder="Search code or name"
            label="Search cycles"
          />
          <Select
            aria-label="Status"
            options={STATUS_OPTIONS}
            value={status}
            size="sm"
            onChange={(e) => {
              setStatus(e.target.value as CycleStatus | '');
              setPage(1);
            }}
          />
          <Select
            aria-label="Type"
            options={TYPE_OPTIONS}
            value={type}
            size="sm"
            onChange={(e) => {
              setType(e.target.value as CycleType | '');
              setPage(1);
            }}
          />
        </div>
      </Toolbar>

      {query.isError ? (
        <QueryError error={query.error} title="Could not load cycles" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <CyclesTable
            rows={rows}
            loading={query.isPending}
            sort={sort}
            onSortChange={setSort}
            canManage={canManage}
            filtered={filtered}
            emptyAction={
              canManage && !filtered ? (
                <Button variant="primary" onClick={() => navigate('new')}>
                  Create the first cycle
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
    </>
  );
}
