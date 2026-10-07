import { type ReactNode, useMemo, useState } from 'react';

import { isApiError } from '@/api/client';
import { cycleSelectOptions, reportableCycles, SURVEY_TYPE_LABELS, useComparison, useCycleSelection, useOperatorScope, useReportParams } from '@/api/reports';
import { type ComparisonReport } from '@/api/reports.types';
import { useSession } from '@/auth/session';
import { DeltaChip, GroupedBar, Segmented } from '@/design/charts';
import { Card, EmptyState, PageHeader, Select, Skeleton, Stat, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt, formatRating } from '@/lib/format';

import { ComparisonTable } from './ComparisonTable';
import { comparisonBarKey, comparisonDelta, type ComparisonLevel, comparisonRowsAt, orderedCycles, valuesInOrder } from './derive';
import { ExportButton } from './ExportButton';
import { ReportFilters } from './ReportFilters';
import styles from './reports.module.css';

const LEVELS: { value: ComparisonLevel; label: string }[] = [
  { value: 'categories', label: 'Categories' },
  { value: 'subcategories', label: 'Subcategories' },
  { value: 'questions', label: 'Questions' },
];

function ComparisonBody({ report }: { report: ComparisonReport }) {
  const [level, setLevel] = useState<ComparisonLevel>('categories');
  const cycles = useMemo(() => orderedCycles(report), [report]);
  const overall = useMemo(() => cycles.map((c) => report.overall.find((o) => o.cycleId === c.id)), [cycles, report.overall]);
  const delta = comparisonDelta(overall);
  const parentNames = useMemo(() => new Map([...report.categories, ...report.subcategories].map((r) => [r.code, r.name])), [report.categories, report.subcategories]);
  const rows = comparisonRowsAt(report, level);
  const bars = useMemo(
    () => ({
      categories: report.categories.map((r) => r.name),
      series: cycles.map((c, i) => ({ name: c.name, key: comparisonBarKey(i, cycles.length), values: report.categories.map((r) => valuesInOrder(r.values, cycles)[i]?.customer.mean ?? null) })),
    }),
    [cycles, report.categories],
  );

  return (
    <>
      <Card className={styles.span12}>
        <div className={styles.compare}>
          {overall.map((o, i) => {
            const c = cycles[i];
            if (!c) return null;
            return (
              <Stat
                key={c.id}
                size="lg"
                label={
                  <span className={styles.compareLabel}>
                    {c.name}
                    {c.provisional ? <Tag tone="outline">Provisional</Tag> : null}
                  </span>
                }
                value={o?.suppressed ? '—' : formatRating(o?.customer.mean)}
                hint={o ? (o.suppressed ? `Suppressed · ${formatInt(o.customer.n)} responses` : `${o.rank === null ? 'Not ranked' : `Rank ${o.rank} of ${o.rankOf}`} · ${formatInt(o.customer.n)} responses · self ${formatRating(o.self.mean)}`) : 'Did not take part'}
              />
            );
          })}
          <div className={styles.compareDelta} style={{ gridRow: 1, gridColumn: 2 }}>
            <DeltaChip value={delta} title="overall change, later minus earlier cycle" />
            <span>change</span>
          </div>
        </div>
      </Card>
      <Card className={styles.span12} title="Categories across cycles" subtitle="Customer rating per category, earlier cycle in grey, latest in the accent">
        <GroupedBar categories={bars.categories} series={bars.series} height={280} summary="Customer rating per category for each compared cycle" />
      </Card>
      <Card className={styles.span12} title="Side by side" subtitle="Matched on code, so items keep their row across survey versions" padding="none">
        <div className={styles.levelRow}>
          <Segmented aria-label="Level" value={level} onChange={setLevel} options={LEVELS} />
        </div>
        <ComparisonTable rows={rows} cycles={cycles} parentNames={parentNames} caption={`Comparison · ${level}`} />
      </Card>
    </>
  );
}

/** Reports → Comparison: one operator across two cycles with deltas (REQUIREMENTS §23). */
export default function ComparisonPage() {
  const { scope, org } = useSession();
  const operator = useOperatorScope();
  const cycle = useCycleSelection();
  const params = useReportParams();
  const candidates = useMemo(() => reportableCycles(cycle.cycles), [cycle.cycles]);
  const first = cycle.selection.cycle?.id ?? '';
  const secondWanted = params.cycles.find((id) => id !== first) ?? '';
  const second = candidates.some((c) => c.id === secondWanted) ? secondWanted : (candidates.find((c) => c.id !== first)?.id ?? '');
  const ids = useMemo(() => [first, second].filter(Boolean), [first, second]);
  const report = useComparison(operator.acoId || undefined, cycle.ready ? ids : [], cycle.selection.surveyType);
  const data = report.data;
  const secondOptions = cycleSelectOptions(candidates.filter((c) => c.id !== first));

  let body: ReactNode;
  if (cycle.noCycles || (cycle.ready && candidates.length < 2)) {
    body = <EmptyState icon="cycles" size="lg" title="Two cycles are needed" description="The comparison appears once a second cycle has been published." />;
  } else if (!operator.acoId && !operator.loading) {
    body = <EmptyState icon="building" size="lg" title="Choose an operator" description="The comparison shows one operator at a time." />;
  } else if (report.isError) {
    body = <QueryError error={report.error} title={isApiError(report.error, 'NOT_FOUND') ? 'No figures for this selection' : 'Could not load the comparison'} onRetry={() => void report.refetch()} />;
  } else if (!data) {
    body = (
      <div className={styles.grid} aria-busy="true" data-testid="report-skeleton">
        <Card className={styles.span12}>
          <Skeleton height={120} radius={8} />
        </Card>
        <Card className={styles.span12}>
          <Skeleton height={280} radius={8} />
        </Card>
      </div>
    );
  } else {
    body = (
      <div className={styles.grid} data-stale={report.isFetching || undefined}>
        <ComparisonBody report={data} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Comparison"
        context={scope.kind === 'ACO' ? `Shared with your organisation only · ${org.name} across two assessment cycles.` : `${data?.operator.name ?? 'One operator'} across two assessment cycles${data ? ` · ${SURVEY_TYPE_LABELS[data.surveyType]}` : ''}.`}
        actions={<ExportButton query={{ scope: 'operator', acoId: operator.acoId, ...cycle.query }} cycleCode={cycle.selection.cycle?.code} disabled={!data} label="Export latest CSV" />}
      />
      <ReportFilters
        scope={operator.canChoose ? { label: 'Operator', options: operator.options, value: operator.acoId, onChange: operator.setAcoId, loading: operator.loading } : undefined}
        cycles={cycle.cycles}
        cyclesLoading={cycle.cyclesLoading}
        selection={cycle.selection}
        onCycle={cycle.setCycle}
        onSurveyType={cycle.setSurveyType}
        cycleLabel="First cycle"
      >
        <Select
          aria-label="Second cycle"
          size="sm"
          wrapperClassName={styles.filterSelect}
          options={secondOptions}
          value={second}
          placeholder={cycle.cyclesLoading ? 'Loading cycles…' : secondOptions.length === 0 ? 'No other cycle' : 'Choose a cycle'}
          disabled={cycle.cyclesLoading || secondOptions.length === 0}
          onChange={(e) => params.set({ cycles: e.target.value })}
        />
      </ReportFilters>
      {body}
    </>
  );
}
