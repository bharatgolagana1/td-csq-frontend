import { useSaveSelfAnswers, useSelfAssessment, useSubmitSelfAssessment } from '@/api/assessments';
import { type SurveyType } from '@/api/assessments.types';
import { type CurrentCycleSummary } from '@/api/sampling.types';
import { useSession } from '@/auth/session';
import { Banner, Skeleton, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { AnswerSummary, AssessmentStepper, groupsFromForm } from '@/features/assessmentForm';
import { describeTimeZone, formatDateTime } from '@/lib/format';

import styles from './selfAssessment.module.css';

export type SelfAssessmentFormProps = {
  cycle: Pick<CurrentCycleSummary, 'id' | 'tz'>;
  surveyType: SurveyType;
};

const SELF_NOTE = 'Self scores are reported beside customer scores and never enter the published rating.';

function FormSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading the self-assessment">
      <div className={styles.skeletonRail}>
        <Skeleton height={44} radius={6} />
        <Skeleton height={44} radius={6} />
        <Skeleton height={44} radius={6} />
      </div>
      <div className={styles.skeletonMain}>
        <Skeleton height={8} radius={999} />
        <Skeleton width="40%" height={26} />
        <Skeleton height={180} radius={10} />
        <Skeleton height={180} radius={10} />
      </div>
    </div>
  );
}

/** Binds the shared stepper to the signed-in self-assessment API; read-only once submitted. */
export function SelfAssessmentForm({ cycle, surveyType }: SelfAssessmentFormProps) {
  const { org } = useSession();
  const toast = useToast();
  const query = useSelfAssessment(cycle.id, surveyType);
  const save = useSaveSelfAnswers(cycle.id, surveyType);
  const submit = useSubmitSelfAssessment(cycle.id, surveyType);

  if (query.isPending) return <FormSkeleton />;
  if (query.isError) return <QueryError error={query.error} title="Could not load the self-assessment" onRetry={() => void query.refetch()} />;

  const data = query.data;
  if (data.assessment.status === 'SUBMITTED') {
    const at = data.assessment.submittedAt;
    return (
      <div className={styles.submitted}>
        <Banner tone="success" title={`Submitted${at ? ` on ${formatDateTime(at, cycle.tz)} ${describeTimeZone(cycle.tz)}` : ''}`}>
          Your answers are locked. {SELF_NOTE}
        </Banner>
        <AnswerSummary groups={groupsFromForm(data, data.answers)} />
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <AssessmentStepper
        form={data}
        draft={data.answers}
        onSave={(answers) => save.mutateAsync(answers)}
        onSubmit={() => submit.mutateAsync()}
        storageKey={`csq.self.${org.id}.${cycle.id}.${surveyType}`}
        tz={cycle.tz}
        submitNote={SELF_NOTE}
        onSubmitted={() => toast.success('Self-assessment submitted', { description: 'Your answers are now locked.' })}
      />
    </div>
  );
}
