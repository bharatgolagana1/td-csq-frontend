import { useId, useState } from 'react';

import { type FormQuestion } from '@/api/assessments.types';
import { Checkbox, Textarea } from '@/design/primitives';

import styles from './QuestionCard.module.css';
import { RatingScale } from './RatingScale';
import { answerIssues, commentHint, commentRequired, type RatingValue, showsFollowUp } from './rules';
import { type AnswerPatch, type LocalAnswer } from './types';

export type AnswerControlsProps = {
  question: FormQuestion;
  answer: LocalAnswer | undefined;
  onChange: (patch: AnswerPatch) => void;
  /** Radio group name; unique per question (and direction). */
  name: string;
  /** id of the element naming the rating group (the question text)… */
  labelledBy?: string;
  /** …or a name of its own ("<question> — Import"). */
  label?: string;
  /** Show rule errors before the user touched the answer (after Next, or a jump from review). */
  showValidation?: boolean;
  readOnly?: boolean;
};

/**
 * One answer to a question: the segmented rating, the follow-up options on
 * Fair/Poor, and the comment with its mode rules (backend §7 "Form rules").
 * Validation is inline: the rating error appears when asked for; the comment
 * error as soon as the rule applies and the field was left or asked for.
 */
export function AnswerControls({ question, answer, onChange, name, labelledBy, label, showValidation = false, readOnly = false }: AnswerControlsProps) {
  const id = useId();
  const ratingErrorId = `${id}-rating-error`;
  const [commentTouched, setCommentTouched] = useState(false);

  const issues = answerIssues(question, answer);
  const ratingIssue = showValidation ? issues.find((i) => i.field === 'rating') : undefined;
  const commentIssue = showValidation || commentTouched ? issues.find((i) => i.field === 'comment') : undefined;
  const value: RatingValue | null = answer?.na ? 'NA' : (answer?.rating ?? null);
  const followUp = showsFollowUp(question, answer) ? question.followUp : null;
  const hasComment = question.commentMode !== 'NONE';

  const onRating = (next: RatingValue) => {
    if (next === 'NA') onChange({ na: true, rating: null });
    else onChange({ rating: next, na: false });
  };

  const toggleFollowUp = (option: string, checked: boolean) => {
    const current = answer?.followUp ?? [];
    onChange({ followUp: checked ? Array.from(new Set([...current, option])) : current.filter((o) => o !== option) });
  };

  return (
    <>
      <RatingScale name={name} value={value} onChange={onRating} disabled={readOnly} labelledBy={labelledBy} label={label} describedBy={ratingIssue ? ratingErrorId : undefined} invalid={Boolean(ratingIssue)} />
      {ratingIssue ? (
        <p id={ratingErrorId} role="alert" className={styles.error}>
          {ratingIssue.message}
        </p>
      ) : null}

      {followUp ? (
        <div role="group" aria-labelledby={`${id}-followup`} className={styles.followUp}>
          <p id={`${id}-followup`} className={styles.followUpPrompt}>
            {followUp.prompt}
          </p>
          <div className={styles.followUpOptions}>
            {followUp.options.map((option) => (
              <Checkbox key={option} label={option} checked={(answer?.followUp ?? []).includes(option)} disabled={readOnly} onChange={(e) => toggleFollowUp(option, e.target.checked)} />
            ))}
          </div>
        </div>
      ) : null}

      {hasComment ? (
        <Textarea
          id={`${id}-comment`}
          label="Comment"
          hint={commentHint(question, answer)}
          error={commentIssue?.message}
          required={commentRequired(question, answer)}
          value={answer?.comment ?? ''}
          rows={3}
          maxLength={2000}
          disabled={readOnly}
          onChange={(e) => onChange({ comment: e.target.value })}
          onBlur={() => setCommentTouched(true)}
          wrapperClassName={styles.comment}
        />
      ) : null}
    </>
  );
}
