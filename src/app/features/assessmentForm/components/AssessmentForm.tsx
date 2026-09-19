import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import type {
  DirectionCode,
  DraftAnswers,
  FollowUp,
  HeadCode,
  Instrument,
  Invite,
  MissingItem,
  RatingValue,
  Submission,
} from '../api/assessmentForm.types';
import { submitAssessment } from '../api/assessmentForm.mock';
import {
  answerKey,
  countLowRatings,
  lowRatingsWithoutReason,
  missingItems,
  progressByHead,
  progressOf,
} from '../assessmentForm.logic';
import { useAssessmentDraft } from '../hooks/useAssessmentDraft';
import FormHeader from './FormHeader';
import HeadTabs from './HeadTabs';
import IntroCard from './IntroCard';
import QuestionCard from './QuestionCard';
import ReviewSheet from './ReviewSheet';
import SubmittedPanel from './SubmittedPanel';

export interface AssessmentFormProps {
  token: string;
  invite: Invite;
  instrument: Instrument;
  initialDraft: DraftAnswers | null;
  online: boolean;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The highlight after a jump, long enough to find, short enough not to linger. */
const TARGET_MS = 2400;

export const AssessmentForm: FC<AssessmentFormProps> = ({
  token,
  invite,
  instrument,
  initialDraft,
  online,
}) => {
  const directions = invite.directions;
  const { draft, saveState, savedAt, setRating, toggleReason, setNote, setComment, saveNow } =
    useAssessmentDraft(token, initialDraft, online);

  const [activeHead, setActiveHead] = useState<HeadCode>(instrument.heads[0].code);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [pendingJump, setPendingJump] = useState<MissingItem | null>(null);
  const [target, setTarget] = useState<{ parameterId: string; direction: DirectionCode } | null>(
    null,
  );

  const directionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const progress = useMemo(
    () => progressOf(instrument.parameters, directions, draft),
    [instrument.parameters, directions, draft],
  );
  const headProgress = useMemo(
    () => progressByHead(instrument, directions, draft),
    [instrument, directions, draft],
  );
  const missing = useMemo(
    () => missingItems(instrument, directions, draft),
    [instrument, directions, draft],
  );
  const lowCount = useMemo(
    () => countLowRatings(instrument, directions, draft),
    [instrument, directions, draft],
  );
  const lowUnexplained = useMemo(
    () => lowRatingsWithoutReason(instrument, directions, draft),
    [instrument, directions, draft],
  );

  const registerDirection = useCallback(
    (parameterId: string, direction: DirectionCode, el: HTMLDivElement | null) => {
      const key = answerKey(parameterId, direction);
      if (el) directionRefs.current.set(key, el);
      else directionRefs.current.delete(key);
    },
    [],
  );

  const selectHead = useCallback((code: HeadCode) => {
    setActiveHead(code);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  const jumpTo = useCallback((item: MissingItem) => {
    setReviewOpen(false);
    setActiveHead(item.head);
    setPendingJump(item);
  }, []);

  // the head switch and the scroll cannot happen in the same paint, so the jump
  // is resolved one frame after the panel for the target head has mounted
  useEffect(() => {
    if (!pendingJump) return undefined;
    const key = answerKey(pendingJump.parameterId, pendingJump.direction);
    const frame = window.requestAnimationFrame(() => {
      const el = directionRefs.current.get(key);
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        el.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
      }
      setTarget({ parameterId: pendingJump.parameterId, direction: pendingJump.direction });
      setPendingJump(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingJump]);

  useEffect(() => {
    if (!target) return undefined;
    const t = window.setTimeout(() => setTarget(null), TARGET_MS);
    return () => window.clearTimeout(t);
  }, [target]);

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAssessment(token, draft);
      setReviewOpen(false);
      setSubmission(result);
    } catch {
      setSubmitError(
        'Your assessment could not be submitted. Nothing has been lost. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [draft, token]);

  if (submission) {
    return (
      <SubmittedPanel
        submission={submission}
        organisation={invite.organisation}
        terminalLabel={`${invite.terminal.terminalName}, ${invite.terminal.airportName} (${invite.terminal.airportIata})`}
        cycleLabel={instrument.cycleLabel}
      />
    );
  }

  const found = instrument.heads.findIndex((h) => h.code === activeHead);
  const headIndex = found === -1 ? 0 : found;
  const head = instrument.heads[headIndex];
  const nextHead = instrument.heads[headIndex + 1];
  const prevHead = instrument.heads[headIndex - 1];
  const headParams = instrument.parameters.filter((p) => p.head === head.code);

  const ratingsFor = (id: string): Partial<Record<DirectionCode, RatingValue>> => {
    const out: Partial<Record<DirectionCode, RatingValue>> = {};
    for (const d of directions) {
      const v = draft.ratings[answerKey(id, d)];
      if (v !== undefined) out[d] = v;
    }
    return out;
  };

  const followUpsFor = (id: string): Partial<Record<DirectionCode, FollowUp>> => {
    const out: Partial<Record<DirectionCode, FollowUp>> = {};
    for (const d of directions) {
      const f = draft.followUps[answerKey(id, d)];
      if (f) out[d] = f;
    }
    return out;
  };

  return (
    <div className="af">
      {!online ? (
        <p className="af-offline" role="status">
          You are offline. Keep answering. Everything is being saved on this phone and will sync
          when you reconnect.
        </p>
      ) : null}

      <div className="af-sticky">
        <FormHeader
          invite={invite}
          cycleLabel={instrument.cycleLabel}
          progress={progress}
          saveState={saveState}
          savedAt={savedAt}
          online={online}
        />
        <HeadTabs
          heads={instrument.heads}
          active={head.code}
          progress={headProgress}
          onSelect={selectHead}
        />
      </div>

      <main className="af-main">
        <IntroCard
          invite={invite}
          cycleLabel={instrument.cycleLabel}
          parameterCount={instrument.parameters.length}
          directions={directions}
        />

        <section
          className="af-panel"
          role="tabpanel"
          id={`panel-${head.code}`}
          aria-labelledby={`tab-${head.code}`}
          tabIndex={-1}
        >
          <h2 className="af-panel-title">
            {head.label}
            <span className="af-panel-count">
              {headParams.length} {headParams.length === 1 ? 'parameter' : 'parameters'}
            </span>
          </h2>

          {headParams.map((p) => {
            const number = instrument.parameters.findIndex((q) => q.id === p.id) + 1;
            const targetDirection = target?.parameterId === p.id ? target.direction : null;
            return (
              <QuestionCard
                key={p.id}
                parameter={p}
                head={head}
                number={number}
                total={instrument.parameters.length}
                directions={directions}
                ratings={ratingsFor(p.id)}
                followUps={followUpsFor(p.id)}
                comment={draft.comments[p.id] ?? ''}
                onRate={(d, v) => setRating(p.id, d, v)}
                onToggleReason={(d, r) => toggleReason(p.id, d, r)}
                onNote={(d, n) => setNote(p.id, d, n)}
                onComment={(text) => setComment(p.id, text)}
                registerDirection={(d, el) => registerDirection(p.id, d, el)}
                targetDirection={targetDirection}
              />
            );
          })}

          <nav className="af-section-nav" aria-label="Move between sections">
            {prevHead ? (
              <button
                type="button"
                className="af-btn af-btn--ghost"
                onClick={() => selectHead(prevHead.code)}
              >
                Back to {prevHead.shortLabel}
              </button>
            ) : (
              <span />
            )}
            {nextHead ? (
              <button
                type="button"
                className="af-btn af-btn--primary"
                onClick={() => selectHead(nextHead.code)}
              >
                Next: {nextHead.shortLabel}
              </button>
            ) : (
              <button
                type="button"
                className="af-btn af-btn--primary"
                onClick={() => setReviewOpen(true)}
              >
                Review answers
              </button>
            )}
          </nav>
        </section>

        <p className="af-conf">
          Confidential by design. Individual responses are never shown to the terminal operator.
          Scores are aggregated and shared with each operator separately, and are not made public at
          any stage of the exercise.
        </p>
      </main>

      <div className="af-bar">
        <button type="button" className="af-btn af-btn--ghost" onClick={saveNow}>
          Save draft
        </button>
        <button
          type="button"
          className="af-btn af-btn--primary af-btn--wide"
          onClick={() => setReviewOpen(true)}
        >
          {missing.length === 0
            ? 'Review and submit'
            : `Review · ${missing.length} left`}
        </button>
      </div>

      <ReviewSheet
        open={reviewOpen}
        heads={instrument.heads}
        missing={missing}
        progress={progress}
        lowCount={lowCount}
        lowWithoutReason={lowUnexplained}
        online={online}
        submitting={submitting}
        submitError={submitError}
        onClose={() => setReviewOpen(false)}
        onJump={jumpTo}
        onSubmit={() => {
          void onSubmit();
        }}
      />
    </div>
  );
};

export default AssessmentForm;
