import { Link, useParams } from 'react-router-dom';

import { useAssessment } from '@/api/assessments';
import { useCycle } from '@/api/cycles';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Card, KeyValue, PageHeader, Pill, Skeleton, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { AnswerSummary, groupsFromDetail } from '@/features/assessmentForm';
import { DEFAULT_TZ, describeTimeZone, formatDateTime, formatInt, formatRating } from '@/lib/format';

import styles from './history.module.css';
import { KIND_LABELS, kindVariant, STATUS_LABELS, statusPillVariant, SURVEY_LABELS, TYPE_LABELS } from './historyLabels';

function DetailSkeleton() {
  return (
    <div className={styles.detail} aria-busy="true" aria-label="Loading the assessment">
      <Skeleton height={160} radius={10} />
      <Skeleton width="30%" height={20} />
      <Skeleton height={64} radius={6} />
      <Skeleton height={64} radius={6} />
      <Skeleton height={64} radius={6} />
    </div>
  );
}

/** /history/:id — one read-only return: identity (masked per setting), status, score, answers by category. */
export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const { hasTask } = useSession();
  const query = useAssessment(id);
  const data = query.data;
  // The cycle carries the zone; readable only with cycles.view, else the default zone.
  const cycle = useCycle(data?.cycle.id, hasTask('cycles.view'));
  const tz = cycle.data?.tz ?? DEFAULT_TZ;
  const zone = describeTimeZone(tz);

  const title = data ? (data.kind === 'SELF' ? 'Self-assessment' : 'Customer assessment') : 'Assessment';

  return (
    <>
      <PageHeader
        eyebrow="History"
        title={title}
        context={data ? `${data.operator.name} · ${data.cycle.name}` : undefined}
        breadcrumbs={[{ label: 'History', to: '..' }, { label: data?.cycle.code ?? '…' }]}
        actions={
          <Link to=".." className={styles.backLink}>
            <Icon name="chevron-left" size={18} /> Back to history
          </Link>
        }
      />

      {query.isPending ? (
        <DetailSkeleton />
      ) : query.isError ? (
        <QueryError error={query.error} title="Could not load this assessment" onRetry={() => void query.refetch()} />
      ) : !data ? null : (
        <div className={styles.detail}>
          <Card>
            <KeyValue
              columns={3}
              items={[
                { key: 'Cycle', value: `${data.cycle.code} · ${data.cycle.name}` },
                { key: 'Operator', value: data.operator.name },
                { key: 'Survey', value: `${SURVEY_LABELS[data.surveyType]} · ${data.survey.name} v${data.survey.version}` },
                {
                  key: 'Kind',
                  value: (
                    <Pill variant={kindVariant(data.kind)} dot={false} size="sm">
                      {KIND_LABELS[data.kind]}
                    </Pill>
                  ),
                },
                { key: 'Customer type', value: data.customerType ? TYPE_LABELS[data.customerType] : '—' },
                {
                  key: 'Assessor',
                  value: (
                    <span className={styles.identity}>
                      <span>{data.assessor.name ?? (data.kind === 'SELF' ? 'Self-assessment' : '—')}</span>
                      {data.assessor.email ? <span className={styles.identityEmail}>{data.assessor.email}</span> : null}
                      {!data.assessor.revealed ? <Tag tone="outline">Identity masked</Tag> : null}
                    </span>
                  ),
                },
                {
                  key: 'Status',
                  value: (
                    <Pill variant={statusPillVariant(data.status)} size="sm">
                      {STATUS_LABELS[data.status]}
                    </Pill>
                  ),
                },
                { key: 'Started', value: `${formatDateTime(data.startedAt, tz)} ${zone}`, mono: true },
                { key: 'Submitted', value: data.submittedAt ? `${formatDateTime(data.submittedAt, tz)} ${zone}` : '—', mono: true },
                { key: 'Answered', value: `${formatInt(data.progress.answered)} of ${formatInt(data.progress.total)}`, mono: true },
                { key: 'Score', value: formatRating(data.score), mono: true },
              ]}
            />
            {data.kind === 'SELF' ? <p className={styles.selfNote}>Self scores are reported beside customer scores and never enter the published rating.</p> : null}
          </Card>

          <AnswerSummary groups={groupsFromDetail(data.answers)} />
        </div>
      )}
    </>
  );
}
