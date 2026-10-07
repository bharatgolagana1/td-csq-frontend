import { useSurveys } from '@/api/surveys';
import { useSession } from '@/auth/session';
import { EmptyState, PageHeader, Skeleton } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';

import { SurveyCard } from './SurveyCard';
import styles from './surveys.module.css';

/** Configuration → Surveys: one card per survey type (Domestic, International) with its published and draft versions. */
export default function SurveysPage() {
  const { hasTask } = useSession();
  const canManage = hasTask('surveys.manage');
  const query = useSurveys();

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Surveys"
        context="The domestic and international instruments. Publishing a draft retires the version before it; cycles pin the published version when they are published."
      />
      {query.isPending ? (
        <div className={styles.cards} aria-busy="true" aria-label="Loading surveys">
          {[0, 1].map((i) => (
            <div key={i} className={styles.cardSkel}>
              <Skeleton height={20} width="40%" />
              <Skeleton height={14} width="70%" />
              <Skeleton height={72} radius={6} />
              <Skeleton lines={4} />
              <Skeleton height={40} width={200} radius={6} />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <QueryError error={query.error} title="Could not load surveys" onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState icon="list-check" title="No surveys" description="The API returned no survey types." />
      ) : (
        <div className={styles.cards}>
          {query.data.map((entry) => (
            <SurveyCard key={entry.code} entry={entry} canManage={canManage} />
          ))}
        </div>
      )}
    </>
  );
}
