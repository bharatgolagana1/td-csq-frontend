import { type ReactNode, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { isApiError } from '@/api/client';
import { useOperatorQuestions } from '@/api/reports';
import { useSession } from '@/auth/session';
import { EmptyState, PageHeader, Pill, SearchInput, Select, type SortState, statusVariant, Tag, Toolbar, ToolbarCount } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt, humanise } from '@/lib/format';
import { useShell } from '@/shell/ShellContext';

import { DashboardFilters } from './DashboardFilters';
import { dashboardTabs } from './dashboardTabs';
import { ExportButton } from './ExportButton';
import { QuestionsTable } from './QuestionsTable';
import { useDashboardSelection } from './useDashboardSelection';

/** Operator → Dashboard → Questions: every active question with customer, self, previous, delta and comment counts. */
export default function OperatorQuestionsPage() {
  const { acoId: routeAcoId } = useParams();
  const { scope, org } = useSession();
  const { href } = useShell();
  const selection = useDashboardSelection(routeAcoId);
  const query = useOperatorQuestions(selection.acoId || undefined, selection.query, selection.enabled);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  // Survey order until a column is chosen (`order` matches no column, so nothing is marked sorted).
  const [sort, setSort] = useState<SortState>({ id: 'order', dir: 'asc' });

  const data = query.data;
  const cycle = data?.cycle ?? selection.selection.cycle;
  const provisional = data?.provisional ?? selection.selection.provisional;

  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    data?.questions.forEach((row) => seen.set(row.category.code, row.category.name));
    return [{ value: '', label: 'All categories' }, ...Array.from(seen, ([value, label]) => ({ value, label }))];
  }, [data]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.questions ?? []).filter((row) => (!category || row.category.code === category) && (!needle || `${row.code} ${row.text}`.toLowerCase().includes(needle)));
  }, [data, q, category]);

  let body: ReactNode;
  if (selection.noCycles) {
    body = <EmptyState icon="chart" size="lg" title="No cycle to report on yet" description="Question-level figures appear once a cycle is published." />;
  } else if (query.isError) {
    body = <QueryError error={query.error} title={isApiError(query.error, 'NOT_FOUND') ? 'No figures for this selection' : 'Could not load the questions'} onRetry={() => void query.refetch()} />;
  } else {
    body = (
      <>
        <Toolbar end={<ToolbarCount>{data ? `${formatInt(rows.length)} of ${formatInt(data.questions.length)} questions` : '…'}</ToolbarCount>}>
          <SearchInput value={q} onChange={setQ} debounce={200} placeholder="Search code or question" label="Search questions" />
          <Select aria-label="Category" size="sm" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} disabled={!data} />
        </Toolbar>
        <QuestionsTable rows={rows} loading={!data} sort={sort} onSortChange={setSort} filtered={Boolean(q || category)} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Operator"
        title="Questions"
        context={scope.kind === 'ACO' ? `Shared with your organisation only · question-level ratings for ${org.name} with comment counts.` : `Question-level ratings for ${data?.operator.name ?? 'the operator'} with comment counts.`}
        meta={
          cycle ? (
            <>
              <Pill variant={statusVariant(cycle.status)}>{humanise(cycle.status)}</Pill>
              {provisional ? <Tag tone="outline">Provisional</Tag> : null}
            </>
          ) : undefined
        }
        actions={<ExportButton query={{ scope: 'operator', acoId: selection.acoId, ...selection.query }} cycleCode={cycle?.code} disabled={!data} />}
        tabs={{ tabs: dashboardTabs(href, selection.acoId, selection.search), 'aria-label': 'Dashboard views' }}
      />
      <DashboardFilters selection={selection} />
      {body}
    </>
  );
}
