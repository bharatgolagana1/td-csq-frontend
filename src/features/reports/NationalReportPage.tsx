import { type ReactNode } from 'react';

import { isApiError } from '@/api/client';
import { SURVEY_TYPE_LABELS, useCycleSelection, useNationalReport } from '@/api/reports';
import { type NationalReport } from '@/api/reports.types';
import { HorizontalBar, RankTable } from '@/design/charts';
import { Card, EmptyState, PageHeader, Pill, Progress, Skeleton, Stat, statusVariant, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt, formatPct, humanise } from '@/lib/format';

import { nationalAirportBars, nationalAirportRows, nationalCategoryBars, nationalOperatorRows, participationFunnel } from './derive';
import { ExportButton } from './ExportButton';
import { ReportFilters } from './ReportFilters';
import styles from './reports.module.css';

function ParticipationCard({ report }: { report: NationalReport }) {
  const p = report.participation;
  return (
    <Card className={styles.span12} title="Participation" subtitle={`Sampling and assessment funnel of ${report.cycle.name} (REQUIREMENTS §24)`}>
      <div className={styles.split}>
        <div className={styles.stack}>
          <div>
            <p className={styles.sectionTitle}>Sampling</p>
            <div className={styles.tiles4}>
              <Stat label="Airports" value={formatInt(p.airports)} />
              <Stat label="Operators" value={formatInt(p.operators)} />
              <Stat label="Samples locked" value={formatInt(p.sampleLocked)} hint={`of ${formatInt(p.operators)} operators`} />
            </div>
          </div>
          <div>
            <p className={styles.sectionTitle}>Assessment</p>
            <div className={styles.tiles4}>
              <Stat label="Invited" value={formatInt(p.invited)} />
              <Stat label="Started" value={formatInt(p.started)} />
              <Stat label="Completed" value={formatInt(p.completed)} />
              <Stat label="Pending" value={formatInt(p.pending)} />
            </div>
          </div>
          <Progress value={p.completionRate} label="Completion rate" caption={formatPct(p.completionRate)} size="sm" />
        </div>
        <HorizontalBar rows={participationFunnel(p)} max={Math.max(1, p.invited, p.started, p.completed)} format={formatInt} rowHeight={40} provisional={report.provisional} summary={`Invited ${formatInt(p.invited)}, started ${formatInt(p.started)}, completed ${formatInt(p.completed)}`} />
      </div>
    </Card>
  );
}

function NationalBody({ report }: { report: NationalReport }) {
  return (
    <>
      <ParticipationCard report={report} />
      <Card className={styles.span7} title="Airports" subtitle="Market-share weighted rating and national rank" padding="none">
        <RankTable rows={nationalAirportRows(report.airports)} extraHeader="Covered" emptyTitle={report.provisional ? 'Ranked once the cycle is scored' : 'No airports scored'} />
      </Card>
      <Card className={styles.span5} title="Airport ratings" subtitle="Scored airports, best first">
        <HorizontalBar rows={nationalAirportBars(report.airports)} provisional={report.provisional} summary="Weighted rating per airport" />
      </Card>
      <Card className={styles.span7} title="Operators" subtitle="Customer rating and national rank per operator" padding="none">
        <RankTable rows={nationalOperatorRows(report.operators)} labelHeader="Operator" extraHeader="Responses" emptyTitle={report.provisional ? 'Ranked once the cycle is scored' : 'No operators scored'} />
      </Card>
      <Card className={styles.span5} title="Category averages" subtitle="Equal-weight average of the operators’ category ratings">
        <HorizontalBar rows={nationalCategoryBars(report.categories)} provisional={report.provisional} summary="Average rating per category across operators" />
      </Card>
    </>
  );
}

/** Reports → National: airports ranked, operators ranked, category averages and the participation funnel (§23–24). */
export default function NationalReportPage() {
  const cycle = useCycleSelection();
  const report = useNationalReport(cycle.query, cycle.ready);
  const data = report.data;
  const current = data?.cycle ?? cycle.selection.cycle;
  const provisional = data?.provisional ?? cycle.selection.provisional;

  let body: ReactNode;
  if (cycle.noCycles) {
    body = <EmptyState icon="chart" size="lg" title="No cycle to report on yet" description="The national report appears once a cycle is published." />;
  } else if (report.isError) {
    body = <QueryError error={report.error} title={isApiError(report.error, 'NOT_FOUND') ? 'No figures for this selection' : 'Could not load the national report'} onRetry={() => void report.refetch()} />;
  } else if (!data) {
    body = (
      <div className={styles.grid} aria-busy="true" data-testid="report-skeleton">
        <Card className={styles.span12}>
          <Skeleton height={180} radius={8} />
        </Card>
        <Card className={styles.span7}>
          <Skeleton height={320} radius={8} />
        </Card>
        <Card className={styles.span5}>
          <Skeleton height={320} radius={8} />
        </Card>
      </div>
    );
  } else {
    body = (
      <div className={styles.grid} data-stale={report.isFetching || undefined}>
        <NationalBody report={data} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="National report"
        context={data ? `${data.cycle.name} · ${SURVEY_TYPE_LABELS[data.surveyType]} · every participating airport and operator across India.` : 'Every participating airport and operator across India.'}
        meta={
          current ? (
            <>
              <Pill variant={statusVariant(current.status)}>{humanise(current.status)}</Pill>
              {provisional ? <Tag tone="outline">Provisional</Tag> : null}
            </>
          ) : undefined
        }
        actions={<ExportButton query={{ scope: 'national', ...cycle.query }} cycleCode={current?.code} disabled={!data} />}
      />
      <ReportFilters cycles={cycle.cycles} cyclesLoading={cycle.cyclesLoading} selection={cycle.selection} onCycle={cycle.setCycle} onSurveyType={cycle.setSurveyType} />
      {body}
    </>
  );
}
