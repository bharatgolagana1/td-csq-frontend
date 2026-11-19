import { useId } from 'react';

import { type FormQuestion } from '@/api/assessments.types';

import { FollowUpChoices } from './FollowUpChoices';
import styles from './QuestionCard.module.css';
import { QuestionComment } from './QuestionComment';
import { RatingScale } from './RatingScale';
import { answerIssues, type RatingValue, showsFollowUp } from './rules';
import { type AnswerPatch, type LocalAnswer } from './types';

export type AnswerControlsProps = {
  question: FormQuestion;
  answer: LocalAnswer | undefined;
  onChange: (patch: AnswerPatch) => void;
  /** Radio group name; unique per question. */
  name: string;
  /** id of the element naming the rating group (the question text). */
  labelledBy: string;
  /** Show rule errors before the user touched the answer (after Next, or a jump from review). */
  showValidation?: boolean;
  readOnly?: boolean;
};

/** A single rating, follow-up options on Fair/Poor, and an optional comment. */
export function AnswerControls({ question, answer, onChange, name, labelledBy, showValidation = false, readOnly = false }: AnswerControlsProps) {
  const id = useId();
  const ratingErrorId = `${id}-rating-error`;

  const issues = answerIssues(question, answer);
  const ratingIssue = showValidation ? issues.find((i) => i.field === 'rating') : undefined;
  const value: RatingValue | null = answer?.na ? 'NA' : (answer?.rating ?? null);
  const followUp = showsFollowUp(question, answer) ? question.followUp : null;

  const onRating = (next: RatingValue) => {
    if (next === 'NA') onChange({ na: true, rating: null });
    else onChange({ rating: next, na: false });
  };

  return (
    <>
      <RatingScale name={name} value={value} onChange={onRating} disabled={readOnly} labelledBy={labelledBy} describedBy={ratingIssue ? ratingErrorId : undefined} invalid={Boolean(ratingIssue)} />
      {ratingIssue ? (
        <p id={ratingErrorId} role="alert" className={styles.error}>
          {ratingIssue.message}
        </p>
      ) : null}

      {followUp ? <FollowUpChoices followUp={followUp} value={answer?.followUp ?? []} onChange={(next) => onChange({ followUp: next })} disabled={readOnly} /> : null}

      <QuestionComment value={answer?.comment ?? ''} onChange={(comment) => onChange({ comment })} readOnly={readOnly} />
    </>
  );
}
