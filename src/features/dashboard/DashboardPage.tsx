import { type ReactNode } from 'react';

import { isApiError } from '@/api/client';
import { useOperatorReport } from '@/api/reports';
import { useSettings } from '@/api/settings';
import { useSession } from '@/auth/session';
import { Card, EmptyState, PageHeader, Pill, Skeleton, statusVariant, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { cn } from '@/lib/cn';
import { humanise } from '@/lib/format';
import { useShell } from '@/shell/ShellContext';

import { AssessorCard } from './AssessorCard';
import styles from './dashboard.module.css';
import { DashboardFilters } from './DashboardFilters';
import { dashboardTabs } from './dashboardTabs';
import { CategoriesCard } from './CategoriesCard';
import { ExportButton } from './ExportButton';
import { FeedbackCard } from './FeedbackCard';
import { HeroCard } from './HeroCard';
import { NationalCard } from './NationalCard';
import { OverallCard } from './OverallCard';
import { useDashboardSelection } from './useDashboardSelection';

function DashboardSkeleton() {
  return (
    <div className={styles.grid} aria-busy="true" data-testid="dashboard-skeleton">
      <Card className={cn(styles.hero, styles.inverse)}>
        <div className={styles.skeletonHero}>
          <Skeleton height={12} width={120} />
          <Skeleton height={26} width={220} radius={6} />
          <Skeleton height={80} width={150} radius={8} />
          <Skeleton height={14} width={260} />
          <Skeleton height={64} radius={6} />
        </div>
      </Card>
      <Card className={styles.overall}>
        <Skeleton height={236} radius={8} />
      </Card>
      <Card className={styles.feedback}>
        <div className={styles.skeletonHero}>
          <Skeleton height={28} radius={999} />
          <Skeleton lines={4} />
        </div>
      </Card>
      <Card className={styles.categories}>
        <Skeleton height={300} radius={8} />
      </Card>
      <Card className={styles.national}>
        <Skeleton height={440} radius={8} />
      </Card>
      <Card className={styles.assessors}>
        <Skeleton height={120} radius={8} />
      </Card>
    </div>
  );
}

/** Operator → Dashboard: the ACFI deck's slide 8 for one operator and cycle (ARCHITECTURE §7). */
export default function DashboardPage() {
  const { org, scope, hasTask } = useSession();
  const { href } = useShell();
  const selection = useDashboardSelection();
  const report = useOperatorReport(selection.acoId || undefined, selection.query, selection.enabled);
  const settings = useSettings(hasTask('settings.view'));
  const data = report.data;
  const provisional = data?.provisional ?? selection.selection.provisional;
  const cycle = data?.cycle ?? selection.selection.cycle;
  const questionsTo = `${href(`/reports/operator/${selection.acoId}/questions`)}${selection.search ? `?${selection.search}` : ''}`;

  let body: ReactNode;
  if (selection.noCycles) {
    body = <EmptyState icon="chart" size="lg" title="No cycle to report on yet" description={scope.kind === 'ACO' ? `Figures appear here once a cycle that includes ${org.name} is published.` : 'Figures appear here once a cycle is published.'} />;
  } else if (!selection.acoId && !selection.scope.loading) {
    body = <EmptyState icon="building" size="lg" title="Choose an operator" description="The dashboard shows one operator at a time." />;
  } else if (report.isError) {
    body = (
      <QueryError
        error={report.error}
        title={isApiError(report.error, 'NOT_FOUND') ? 'No figures for this selection' : 'Could not load the dashboard'}
        onRetry={() => void report.refetch()}
      />
    );
  } else if (!data) {
    body = <DashboardSkeleton />;
  } else {
    body = (
      <div className={styles.grid} data-stale={report.isFetching || undefined}>
        <HeroCard report={data} minResponses={settings.data?.scoring.minResponses} />
        <OverallCard report={data} />
        <FeedbackCard report={data} />
        <CategoriesCard report={data} questionsTo={questionsTo} />
        <NationalCard report={data} />
        <AssessorCard report={data} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Operator"
        title="Dashboard"
        context={scope.kind === 'ACO' ? `Shared with your organisation only · customer feedback and self-assessment for ${org.name}.` : 'The operator dashboard as the operator sees it · shared with that organisation only.'}
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
