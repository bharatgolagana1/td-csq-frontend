import { useNavigate } from 'react-router-dom';

import { type SurveyType } from '@/api/assessments.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, EmptyState, PageHeader, Skeleton } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { describeTimeZone, formatCountdown, formatDateTime } from '@/lib/format';

import styles from './selfAssessment.module.css';
import { SelfAssessmentForm } from './SelfAssessmentForm';
import { type SelfTarget, useSelfAssessmentTarget } from './useSelfAssessmentTarget';

const SURVEY_LABELS: Record<SurveyType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International' };

function contextOf(target: SelfTarget): string {
  switch (target.kind) {
    case 'open': {
      const end = target.cycle.assessment.end.utc;
      return `${target.cycle.name} · closes ${formatDateTime(end, target.cycle.tz)} ${describeTimeZone(target.cycle.tz)} · ${formatCountdown(end)}`;
    }
    case 'not-open':
      return target.cycle.name;
    default:
      return "Your organisation's own return for the current cycle.";
  }
}

function Body({ target, canViewHistory }: { target: SelfTarget; canViewHistory: boolean }) {
  const navigate = useNavigate();
  switch (target.kind) {
    case 'loading':
      return (
        <div className={styles.headerSkeleton} aria-busy="true" aria-label="Loading the current cycle">
          <Skeleton width="60%" height={14} />
          <Skeleton height={44} radius={6} />
        </div>
      );
    case 'error':
      return <QueryError error={target.error} title="Could not load the current cycle" onRetry={target.retry} />;
    case 'none':
      return <EmptyState icon="cycles" title="No cycle in progress" description="Your self-assessment opens with the next cycle's sampling window. Nothing to do for now." />;
    case 'not-open': {
      if (target.phase === 'before') {
        const opens = target.cycle.sampling.start.utc;
        return <EmptyState icon="clock" title="Self-assessment not open yet" description={`${target.cycle.name} opens on ${formatDateTime(opens, target.cycle.tz)} ${describeTimeZone(target.cycle.tz)}.`} />;
      }
      return (
        <EmptyState
          icon="lock"
          title={`Self-assessment closed for ${target.cycle.name}`}
          description="The assessment window has ended; submitted returns stay available in History."
          action={
            canViewHistory ? (
              <Button variant="primary" onClick={() => navigate(`../history?cycleId=${encodeURIComponent(target.cycle.id)}&kind=SELF`)}>
                View in history
              </Button>
            ) : undefined
          }
        />
      );
    }
    case 'open':
      return <SelfAssessmentForm key={`${target.cycle.id}:${target.surveyType}`} cycle={target.cycle} surveyType={target.surveyType} />;
  }
}

/** /self-assessment — the operator's own return for the current cycle (assessments.self). */
export default function SelfAssessmentPage() {
  const { hasTask } = useSession();
  const target = useSelfAssessmentTarget();
  const tabs =
    target.kind === 'open' && target.surveyTypes.length > 1
      ? {
          tabs: target.surveyTypes.map((t) => ({ id: t, label: SURVEY_LABELS[t] })),
          value: target.surveyType,
          onChange: (id: string) => target.setSurveyType(id as SurveyType),
          'aria-label': 'Survey type',
        }
      : undefined;

  return (
    <>
      <PageHeader eyebrow="Operator" title="Self-assessment" context={contextOf(target)} tabs={tabs} />
      <p className={styles.note}>
        <Icon name="info" size={16} className={styles.noteIcon} />
        Self scores are reported beside customer scores and never enter the published rating.
      </p>
      <Body target={target} canViewHistory={hasTask('assessments.view')} />
    </>
  );
}
