import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAssessments, useExportAssessments } from '@/api/assessments';
import { useCycles } from '@/api/cycles';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, PageHeader, Pagination, Select, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { DEFAULT_TZ, formatInt } from '@/lib/format';

import styles from './history.module.css';
import { HistoryTable } from './HistoryTable';
import { useHistoryQuery } from './useHistoryQuery';

const KIND_OPTIONS = [
  { value: '', label: 'All kinds' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'SELF', label: 'Self' },
];
const TYPE_OPTIONS = [
  { value: '', label: 'All customer types' },
  { value: 'FF', label: 'Freight forwarder' },
  { value: 'CB', label: 'Customs broker' },
];
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
];
const SURVEY_OPTIONS = [
  { value: '', label: 'Both surveys' },
  { value: 'DOMESTIC', label: 'Domestic' },
  { value: 'INTERNATIONAL', label: 'International' },
];

/** /history — every assessment the caller may see; row → read-only return; CSV export per cycle (assessments.view). */
export default function HistoryPage() {
  const { hasTask, scope, org } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const state = useHistoryQuery();
  const list = useAssessments(state.query);
  const cycles = useCycles({ pageSize: 100, sort: '-createdAt' }, hasTask('cycles.view'));
  const exportCsv = useExportAssessments();

  const rows = useMemo(() => list.data?.data ?? [], [list.data]);
  const total = list.data?.meta.total ?? 0;

  // Cycle filter options: the cycles list when permitted, else the cycles on this page.
  const cycleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    cycles.data?.data.forEach((c) => seen.set(c.id, `${c.code} · ${c.name}`));
    rows.forEach((r) => {
      if (!seen.has(r.cycle.id)) seen.set(r.cycle.id, `${r.cycle.code} · ${r.cycle.name}`);
    });
    return [{ value: '', label: 'All cycles' }, ...Array.from(seen, ([value, label]) => ({ value, label }))];
  }, [cycles.data, rows]);
  const tzByCycle = useMemo(() => new Map(cycles.data?.data.map((c) => [c.id, c.tz]) ?? []), [cycles.data]);
  const tzOf = (cycleId: string) => tzByCycle.get(cycleId) ?? DEFAULT_TZ;

  const selectedCycle = state.filters.cycleId;
  const onExport = () => {
    if (!selectedCycle) return;
    const code = cycleOptions.find((o) => o.value === selectedCycle)?.label.split(' · ')[0] ?? selectedCycle;
    exportCsv.mutate(
      {
        query: {
          cycleId: selectedCycle,
          ...(state.filters.kind ? { kind: state.filters.kind as 'CUSTOMER' | 'SELF' } : {}),
          ...(state.filters.status ? { status: state.filters.status as 'DRAFT' | 'SUBMITTED' } : {}),
        },
        fileName: `assessments-${code}.csv`,
      },
      { onError: (e) => toast.error('Export failed', { description: e instanceof Error ? e.message : undefined }) },
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={scope.kind === 'ACO' ? 'Operator' : 'Assessments'}
        title="History"
        context={scope.kind === 'ACO' ? `Every assessment of ${org.name}: customer returns and your self-assessments.` : 'Every assessment across operators; assessor identity is masked for operator users.'}
        actions={
          <Button variant="secondary" icon={<Icon name="download" size={18} />} disabled={!selectedCycle} loading={exportCsv.isPending} onClick={onExport} title={selectedCycle ? undefined : 'Choose a cycle to export'}>
            Export CSV
          </Button>
        }
      />

      <Toolbar end={<ToolbarCount>{list.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'assessment' : 'assessments'}`}</ToolbarCount>}>
        <Select aria-label="Cycle" options={cycleOptions} value={state.filters.cycleId} size="sm" onChange={(e) => state.setFilter('cycleId', e.target.value)} wrapperClassName={styles.cycleSelect} />
        <Select aria-label="Kind" options={KIND_OPTIONS} value={state.filters.kind} size="sm" onChange={(e) => state.setFilter('kind', e.target.value)} />
        <Select aria-label="Customer type" options={TYPE_OPTIONS} value={state.filters.customerType} size="sm" onChange={(e) => state.setFilter('customerType', e.target.value)} />
        <Select aria-label="Status" options={STATUS_OPTIONS} value={state.filters.status} size="sm" onChange={(e) => state.setFilter('status', e.target.value)} />
        <Select aria-label="Survey" options={SURVEY_OPTIONS} value={state.filters.surveyType} size="sm" onChange={(e) => state.setFilter('surveyType', e.target.value)} />
      </Toolbar>

      {list.isError ? (
        <QueryError error={list.error} title="Could not load assessments" onRetry={() => void list.refetch()} />
      ) : (
        <>
          <HistoryTable rows={rows} loading={list.isPending} sort={state.sort} onSortChange={state.setSort} onOpen={(row) => navigate(row.id)} tzOf={tzOf} filtered={state.filtered} onClearFilters={state.clearFilters} />
          <Pagination page={state.page} pageSize={state.pageSize} total={total} onPageChange={state.setPage} onPageSizeChange={state.setPageSize} />
        </>
      )}
    </>
  );
}
