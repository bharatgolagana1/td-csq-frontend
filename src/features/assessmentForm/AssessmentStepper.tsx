import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { type Answer, type AnswerInput, type AssessmentForm, type Progress } from '@/api/assessments.types';
import { Icon } from '@/design/icons';
import { Button } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { formatInt } from '@/lib/format';

import styles from './AssessmentStepper.module.css';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { ReviewList } from './ReviewList';
import { questionDomId, reviewItems } from './rules';
import { SaveStatus } from './SaveStatus';
import { StepHeader } from './StepHeader';
import { StepList, type StepListItem } from './StepList';
import { SubmitConfirm } from './SubmitConfirm';
import { type ReviewItem, type SaveStatus as SaveStatusValue } from './types';
import { useAssessmentDraft } from './useAssessmentDraft';

export type AssessmentStepperProps = {
  form: AssessmentForm;
  /** Answers saved on the server when the form was loaded. */
  draft: readonly Answer[];
  /** Merge-saves a batch of changed answers (the signed-in or the link-token PATCH); may resolve to a `SaveResult` (`{ lastSavedAt }`). */
  onSave: (answers: AnswerInput[]) => Promise<unknown>;
  /** Submits the assessment; rejects with the ApiError to show (412 lists `missing`). */
  onSubmit: () => Promise<unknown>;
  /** localStorage key of the offline replay queue. */
  storageKey?: string;
  /** Time zone for "Saved · 12:04" (the cycle's). */
  tz?: string;
  readOnly?: boolean;
  initialStep?: number;
  /** Line under the submit confirm (confidentiality, "self scores are reported separately"…). */
  submitNote?: ReactNode;
  onProgress?: (progress: Progress) => void;
  onStatus?: (status: SaveStatusValue) => void;
  /** After a successful submit. */
  onSubmitted?: () => void;
  className?: string;
};

function focusQuestionCard(questionId: string): boolean {
  const el = document.getElementById(questionDomId(questionId));
  if (!el) return false;
  el.scrollIntoView({ block: 'start' });
  el.focus({ preventScroll: true });
  return true;
}

/**
 * One category per step, a review step last (ARCHITECTURE §6, REQ §17). Every
 * step is navigable; leaving an incomplete step turns its inline validation
 * on; the review step lists what is missing with jump links; Submit is enabled
 * only when the whole form is complete, flushes the draft, then confirms.
 */
export function AssessmentStepper({ form, draft, onSave, onSubmit, storageKey, tz, readOnly = false, initialStep = 0, submitNote, onProgress, onStatus, onSubmitted, className }: AssessmentStepperProps) {
  const d = useAssessmentDraft({ form, draft, save: onSave, storageKey, readOnly });
  const stepCount = d.steps.length;
  const reviewIndex = stepCount;
  const [step, setStep] = useState(() => Math.min(Math.max(0, initialStep), reviewIndex));
  const [validated, setValidated] = useState<ReadonlySet<number>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const navigated = useRef(false);
  /** Question to land on after the next step change (a jump from the review list). */
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => onProgress?.(d.progress), [d.progress, onProgress]);
  useEffect(() => onStatus?.(d.status), [d.status, onStatus]);

  // Unsaved answers: warn before the tab closes (they are also queued on this device).
  useEffect(() => {
    if (d.pending === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [d.pending]);

  // After a step change: scroll to the top of the step and move focus there (or to the jumped-to question).
  useEffect(() => {
    if (!navigated.current) return;
    const questionId = pendingFocus.current;
    pendingFocus.current = null;
    if (questionId && focusQuestionCard(questionId)) return;
    sectionRef.current?.scrollIntoView({ block: 'start' });
    sectionRef.current?.focus({ preventScroll: true });
  }, [step]);

  const go = useCallback(
    (next: number) => {
      const target = Math.min(Math.max(0, next), reviewIndex);
      if (step < reviewIndex && !d.readinessFor(step).complete) setValidated((v) => new Set(v).add(step));
      navigated.current = true;
      setBlocked(null);
      setStep(target);
    },
    [d, reviewIndex, step],
  );

  const jump = (item: ReviewItem) => {
    setValidated((v) => new Set(v).add(item.stepIndex));
    if (item.stepIndex === step) {
      focusQuestionCard(item.questionId);
      return;
    }
    pendingFocus.current = item.questionId;
    go(item.stepIndex);
  };

  const askToSubmit = async () => {
    setSubmitError(null);
    const flushed = await d.flush();
    if (!flushed) {
      setBlocked('Your latest answers have not reached the server yet. Check your connection and try again.');
      return;
    }
    setBlocked(null);
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit();
      setConfirmOpen(false);
      onSubmitted?.();
    } catch (e) {
      setSubmitError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const items: StepListItem[] = [
    ...d.steps.map((s, i) => {
      const r = d.readinessFor(i);
      return { id: s.id, label: s.label, answered: r.answered, total: r.total, complete: r.complete };
    }),
    { id: 'review', label: 'Review & submit', answered: 0, total: 0, complete: d.readiness.complete, review: true },
  ];
  const current = d.steps[step];
  const review = step === reviewIndex;
  const canSubmit = !readOnly && d.readiness.complete;

  return (
    <div className={cn(styles.root, className)}>
      <aside className={styles.rail}>
        <StepList items={items} current={step} onSelect={go} />
      </aside>

      <div className={styles.main}>
        <div className={styles.sticky}>
          <ProgressBar answered={d.progress.answered} total={d.progress.total} className={styles.progress} />
          <SaveStatus status={d.status} onRetry={d.retry} tz={tz} />
        </div>

        <section key={step} ref={sectionRef} tabIndex={-1} className={styles.section} aria-label={review ? 'Review and submit' : current?.label}>
          {review ? (
            <>
              <StepHeader index={reviewIndex} count={stepCount + 1} title="Review and submit" description="Submitted answers are locked." />
              <ReviewList items={reviewItems(d.steps, d.answers)} onJump={jump} />
            </>
          ) : current ? (
            <>
              <StepHeader index={step} count={stepCount + 1} title={current.label} description={`${formatInt(d.readinessFor(step).answered)} of ${formatInt(current.questions.length)} answered in this section`} />
              <div className={styles.cards}>
                {current.questions.map(({ question, subcategory, index }) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    section={subcategory?.name ?? null}
                    answer={d.answerFor(question.id)}
                    onChange={(patch) => d.setAnswer(question.id, patch)}
                    showValidation={validated.has(step)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>

        {blocked ? (
          <p role="alert" className={styles.blocked}>
            {blocked}
          </p>
        ) : null}

        <footer className={styles.nav}>
          <Button variant="ghost" icon={<Icon name="chevron-left" size={18} />} disabled={step === 0} onClick={() => go(step - 1)}>
            Back
          </Button>
          <div className={styles.navEnd}>
            {review ? (
              <Button variant="primary" disabled={!canSubmit} onClick={() => void askToSubmit()} title={canSubmit ? undefined : 'Answer every question to submit'}>
                Submit
              </Button>
            ) : (
              <Button variant="primary" iconRight={<Icon name="chevron-right" size={18} />} onClick={() => go(step + 1)}>
                {step === stepCount - 1 ? 'Review' : 'Next'}
              </Button>
            )}
          </div>
        </footer>
      </div>

      <SubmitConfirm
        open={confirmOpen}
        onClose={() => {
          if (!submitting) setConfirmOpen(false);
        }}
        onConfirm={() => void confirmSubmit()}
        answered={d.progress.answered}
        total={d.progress.total}
        loading={submitting}
        error={submitError}
        note={submitNote}
      />
    </div>
  );
}
