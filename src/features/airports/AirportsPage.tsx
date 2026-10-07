import { useMemo, useState } from 'react';

import { useAirports, useUpdateAirport } from '@/api/airports';
import { type Airport, type Region } from '@/api/airports.types';
import { errorMessage, errorRequestId } from '@/api/client';
import { useOperators } from '@/api/organisations';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, PageHeader, Pagination, SearchInput, Select, type SortState, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt } from '@/lib/format';

import { AirportFormDrawer } from './AirportFormDrawer';
import { AirportImportDrawer } from './AirportImportDrawer';
import { ACTIVE_FILTER_OPTIONS, REGION_FILTER_OPTIONS } from './airportLabels';
import { AirportsTable } from './AirportsTable';

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; airport: Airport };

/** Master data → Airports: table with search, region and active filters; create/edit and CSV import drawers. */
export default function AirportsPage() {
  const { hasTask } = useSession();
  const canManage = hasTask('airports.manage');
  const toast = useToast();
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<Region | ''>('');
  const [active, setActive] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ id: 'iata', dir: 'asc' });
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [importOpen, setImportOpen] = useState(false);
  const update = useUpdateAirport();

  const query = useAirports({
    q: q || undefined,
    region: region || undefined,
    active: active || undefined,
    page,
    pageSize,
    sort: `${sort.dir === 'desc' ? '-' : ''}${sort.id}`,
  });
  // GET /airports rows carry no operator count; derive it from the operator list when the caller may see it.
  const operators = useOperators({ pageSize: 500 }, hasTask('operators.view'));
  const operatorCounts = useMemo(() => {
    if (!operators.data) return undefined;
    const counts = new Map<string, number>();
    operators.data.data.forEach((o) => counts.set(o.airport.id, (counts.get(o.airport.id) ?? 0) + 1));
    return counts;
  }, [operators.data]);

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const filtered = Boolean(q || region || active);

  const toggleActive = (a: Airport) => {
    update.mutate(
      { id: a.id, active: !a.active },
      {
        onSuccess: (next) => toast.success(`${next.iata} marked ${next.active ? 'active' : 'inactive'}`),
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Master data"
        title="Airports"
        context="Every airport CSQ can run at. Operators, market shares and reports hang off these records."
        actions={
          canManage ? (
            <>
              <Button icon={<Icon name="upload" size={18} />} onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
              <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => setForm({ mode: 'create' })}>
                Add airport
              </Button>
            </>
          ) : undefined
        }
      />

      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'airport' : 'airports'}`}</ToolbarCount>}>
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          debounce={300}
          placeholder="Search code, name or city"
          label="Search airports"
        />
        <Select
          aria-label="Region"
          options={REGION_FILTER_OPTIONS}
          value={region}
          size="sm"
          onChange={(e) => {
            setRegion(e.target.value as Region | '');
            setPage(1);
          }}
        />
        <Select
          aria-label="Status"
          options={ACTIVE_FILTER_OPTIONS}
          value={active}
          size="sm"
          onChange={(e) => {
            setActive(e.target.value as '' | 'true' | 'false');
            setPage(1);
          }}
        />
      </Toolbar>

      {query.isError ? (
        <QueryError error={query.error} title="Could not load airports" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <AirportsTable
            rows={rows}
            loading={query.isPending}
            sort={sort}
            onSortChange={setSort}
            canManage={canManage}
            operatorCounts={operatorCounts}
            onEdit={(airport) => setForm({ mode: 'edit', airport })}
            onToggleActive={toggleActive}
            emptyAction={
              canManage && !filtered ? (
                <Button variant="primary" onClick={() => setForm({ mode: 'create' })}>
                  Add the first airport
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

      <AirportFormDrawer open={form.mode !== 'closed'} onClose={() => setForm({ mode: 'closed' })} airport={form.mode === 'edit' ? form.airport : null} />
      <AirportImportDrawer open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
