import { useCallback, useEffect, useRef } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { publicAssessApi, useAssessmentDraftData, useAssessmentForm } from '@/api/publicAssess';
import { type AnswerInput, type LinkSession, type PublicInvitation } from '@/api/publicAssess.types';
import { Icon } from '@/design/icons';
import { Button, EmptyState, Skeleton } from '@/design/primitives';
import { AssessmentStepper } from '@/features/assessmentForm';

import styles from './assess.module.css';
import { cycleTz } from './format';
import { type AssessActions, routeFlowError } from './useAssessFlow';
import { useFocusHeading } from './useFocusHeading';

export type AssessFormProps = {
  token: string;
  session: LinkSession;
  invitation: PublicInvitation;
  /** True when the verified session came from sessionStorage (reload / return within 12 h). */
  resumed: boolean;
  actions: AssessActions;
  /** Lets the frame show the answered share in its flow affordance (0..1). */
  onProgress?: (fraction: number) => void;
};

/** The replay queue in localStorage is keyed by the link token (same key string as the sessionStorage session; different store). */
export function draftStorageKey(token: string): string {
  return `csq.assess.${token}`;
}

function FormSkeleton() {
  return (
    <div className={styles.formWrap} aria-busy="true" aria-label="Loading the questionnaire">
      <div className={styles.skeletonStack}>
        <Skeleton width="40%" height={12} />
        <Skeleton width="70%" height={26} />
        <Skeleton height={5} radius={3} />
        <Skeleton height={160} radius={10} />
        <Skeleton height={160} radius={10} />
      </div>
    </div>
  );
}

/**
 * State `form`: loads the survey and the saved answers through the link
 * session and hands them to the shared stepper (features/assessmentForm). The
 * link-token PATCH/POST go through `routeFlowError` so a dead session, an
 * expired link or an already-submitted assessment move the machine instead of
 * showing an inline error.
 */
export function AssessForm({ token, session, invitation, resumed, actions, onProgress }: AssessFormProps) {
  const form = useAssessmentForm(token, session.sessionToken);
  const draft = useAssessmentDraftData(token, session.sessionToken);
  // The heading exists only once both loads are in; focus it then (announces the questionnaire on verify / resume).
  const heading = useFocusHeading<HTMLHeadingElement>(Boolean(form.data && draft.data));
  const submittedAt = useRef<string | null>(null);
  const linkToken = session.sessionToken;

  // A failed load may mean the session is gone (401), the link died (410) or the return was already submitted.
  const loadError = form.error ?? draft.error;
  useEffect(() => {
    if (loadError) routeFlowError(loadError, actions);
  }, [loadError, actions]);

  const save = useCallback(
    async (answers: AnswerInput[]) => {
      try {
        return await publicAssessApi.saveAnswers(token, linkToken, answers);
      } catch (e) {
        routeFlowError(e, actions);
        throw e;
      }
    },
    [token, linkToken, actions],
  );

  const submit = useCallback(async () => {
    try {
      const result = await publicAssessApi.submit(token, linkToken);
      submittedAt.current = result?.submittedAt ?? new Date().toISOString();
    } catch (e) {
      routeFlowError(e, actions);
      throw e;
    }
  }, [token, linkToken, actions]);

  const submitted = useCallback(() => actions.submitted(submittedAt.current ?? new Date().toISOString()), [actions]);

  const progress = useCallback((p: { answered: number; total: number }) => onProgress?.(p.total === 0 ? 0 : p.answered / p.total), [onProgress]);

  if (loadError) {
    return (
      <section className={styles.card}>
        <EmptyState
          icon="warning"
          title="Could not load the questionnaire"
          description={
            <>
              {errorMessage(loadError)}
              {errorRequestId(loadError) ? (
                <>
                  {' '}
                  · Request <code>{errorRequestId(loadError)}</code>
                </>
              ) : null}
            </>
          }
          action={
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                void form.refetch();
                void draft.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      </section>
    );
  }

  if (!form.data || !draft.data) return <FormSkeleton />;

  const airport = invitation.operator.airport;

  return (
    <div className={styles.formWrap}>
      <header className={styles.formHead}>
        <p className={styles.eyebrow}>{invitation.cycle.name}</p>
        <h1 id="assess-form-title" className={`${styles.title} ${styles.formTitle}`} tabIndex={-1} ref={heading}>
          {form.data.survey.name}
        </h1>
        <p className={styles.titleSub}>
          Rating <strong>{invitation.operator.name}</strong>
          {airport ? (
            <>
              {' '}
              at <span className={styles.mono}>{airport.iata}</span>
            </>
          ) : null}
          {' · '}
          <span className={styles.factMuted}>Your answers reach the operator only in aggregate</span>
        </p>
        {resumed ? (
          <p className={styles.note} role="status">
            <Icon name="info" size={18} />
            <span>Welcome back. Your saved answers are here — carry on where you left off.</span>
          </p>
        ) : null}
      </header>

      <AssessmentStepper
        form={form.data}
        draft={draft.data.answers}
        onSave={save}
        onSubmit={submit}
        onSubmitted={submitted}
        onProgress={progress}
        storageKey={draftStorageKey(token)}
        tz={cycleTz(invitation)}
        readOnly={draft.data.status === 'SUBMITTED'}
        submitNote={`Your answers reach ${invitation.operator.name} only in aggregate. Nobody there sees an individual response.`}
      />
    </div>
  );
}
