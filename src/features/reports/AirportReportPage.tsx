import { type ReactNode } from 'react';

import { isApiError } from '@/api/client';
import { SURVEY_TYPE_LABELS, useAirportReport, useAirportScope, useCycleSelection } from '@/api/reports';
import { type AirportReport } from '@/api/reports.types';
import { useSession } from '@/auth/session';
import { HorizontalBar, RankTable, ScoreHero } from '@/design/charts';
import { Banner, Card, type Column, EmptyState, PageHeader, Pill, Skeleton, Stat, statusVariant, Table, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt, formatPct, formatRating, humanise } from '@/lib/format';

import { airportCategoryBars, airportOperatorRows, coverageCaption } from './derive';
import { ExportButton } from './ExportButton';
import { ReportFilters } from './ReportFilters';
import styles from './reports.module.css';

const CATEGORY_COLUMNS: Column<AirportReport['categories'][number]>[] = [
  { id: 'name', header: 'Category', cell: (c) => c.name },
  { id: 'mean', header: 'Score', width: 90, align: 'right', mono: true, cell: (c) => formatRating(c.mean) },
  { id: 'covered', header: 'Covered', width: 96, align: 'right', mono: true, hideBelow: 'sm', cell: (c) => formatPct(c.coveredSharePct) },
  { id: 'weighting', header: 'Weighting', width: 120, hideBelow: 'md', cell: (c) => (c.marketShareApplied ? 'Market share' : 'Equal') },
];

function AirportBody({ report }: { report: AirportReport }) {
  const scored = report.operators?.filter((o) => !o.suppressed && o.mean !== null).length;
  return (
    <>
      <Card className={styles.span12}>
        <ScoreHero
          label={`Weighted airport score · ${report.cycle.name} · ${SURVEY_TYPE_LABELS[report.surveyType]}`}
          value={report.overall.mean}
          rank={report.overall.rank}
          rankOf={report.overall.rankOf}
          caption={coverageCaption(report.overall)}
          provisional={report.provisional}
          aside={
            <div className={styles.tiles}>
              <Stat className={styles.tile} label="Covered share" value={formatPct(report.overall.coveredSharePct)} hint={report.overall.marketShareApplied ? 'of the airport’s market share' : 'of participating operators'} />
              {report.operators ? (
                <Stat className={styles.tile} label="Operators scored" value={`${formatInt(scored)} / ${formatInt(report.operators.length)}`} hint="with a published rating" />
              ) : (
                <Stat className={styles.tile} label="Weighting" value={report.overall.marketShareApplied ? 'Share' : 'Equal'} hint={report.overall.marketShareApplied ? 'market-share weighted' : 'no snapshot for this cycle'} />
              )}
            </div>
          }
        />
      </Card>
      {report.operators ? (
        <Card className={styles.span12} title="Operators" subtitle="Each operator’s customer rating and its market share in the roll-up" padding="none">
          <RankTable rows={airportOperatorRows(report.operators)} labelHeader="Operator" extraHeader="Share" emptyTitle="No operators in this cycle" />
          <p className={styles.cardNote}>Unranked operators are below the minimum number of responses; their share does not enter the weighted score.</p>
        </Card>
      ) : (
        <Banner tone="info" className={styles.span12} title="Operator figures are shared with the airport and ACFI only">
          This roll-up covers {formatPct(report.overall.coveredSharePct)} of the operators at {report.airport.name}; individual operator ratings are not shown here.
        </Banner>
      )}
      <Card className={styles.span6} title="Categories" subtitle="Weighted score per category">
        <HorizontalBar rows={airportCategoryBars(report.categories)} provisional={report.provisional} summary="Weighted airport score per category" />
      </Card>
      <Card className={styles.span6} title="Category coverage" subtitle="Share of the airport behind each figure" padding="none">
        <Table caption="Category coverage" columns={CATEGORY_COLUMNS} rows={report.categories} rowKey={(c) => c.id} dense stickyHeader={false} empty={<EmptyState icon="chart" size="sm" title="No categories" />} />
      </Card>
    </>
  );
}

/** Reports → Airport: the market-share weighted roll-up (REQUIREMENTS §20, §23). */
export default function AirportReportPage() {
  const { scope, org } = useSession();
  const airport = useAirportScope();
  const cycle = useCycleSelection();
  const report = useAirportReport(airport.airportId || undefined, cycle.query, cycle.ready);
  const data = report.data;
  const current = data?.cycle ?? cycle.selection.cycle;
  const provisional = data?.provisional ?? cycle.selection.provisional;

  let body: ReactNode;
  if (cycle.noCycles) {
    body = <EmptyState icon="chart" size="lg" title="No cycle to report on yet" description="The airport report appears once a cycle that includes the airport is published." />;
  } else if (!airport.airportId && !airport.loading) {
    body = <EmptyState icon="plane" size="lg" title="Choose an airport" description="The report shows one airport at a time." />;
  } else if (report.isError) {
    body = <QueryError error={report.error} title={isApiError(report.error, 'NOT_FOUND') ? 'No figures for this selection' : 'Could not load the airport report'} onRetry={() => void report.refetch()} />;
  } else if (!data) {
    body = (
      <div className={styles.grid} aria-busy="true" data-testid="report-skeleton">
        <Card className={styles.span12}>
          <div className={styles.skeletonHero}>
            <Skeleton height={14} width={240} />
            <Skeleton height={56} width={160} radius={8} />
            <Skeleton height={14} width={320} />
          </div>
        </Card>
        <Card className={styles.span12}>
          <Skeleton height={200} radius={8} />
        </Card>
      </div>
    );
  } else {
    body = (
      <div className={styles.grid} data-stale={report.isFetching || undefined}>
        <AirportBody report={data} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title={data ? `${data.airport.name} · ${data.airport.iata}` : 'Airport report'}
        context={scope.kind === 'AIRPORT' ? `Weighted customer rating across the operators at ${org.name}.` : 'Market-share weighted customer rating across an airport’s operators.'}
        meta={
          current ? (
            <>
              <Pill variant={statusVariant(current.status)}>{humanise(current.status)}</Pill>
              {provisional ? <Tag tone="outline">Provisional</Tag> : null}
            </>
          ) : undefined
        }
        actions={<ExportButton query={{ scope: 'airport', airportId: airport.airportId, ...cycle.query }} cycleCode={current?.code} disabled={!data} />}
      />
      <ReportFilters
        scope={airport.canChoose ? { label: 'Airport', options: airport.options, value: airport.airportId, onChange: airport.setAirportId, loading: airport.loading } : undefined}
        cycles={cycle.cycles}
        cyclesLoading={cycle.cyclesLoading}
        selection={cycle.selection}
        onCycle={cycle.setCycle}
        onSurveyType={cycle.setSurveyType}
      />
      {body}
    </>
  );
}
