import { useId, useState } from 'react';

import { type FormQuestion } from '@/api/assessments.types';
import { Icon } from '@/design/icons';
import { Checkbox, IconButton, Textarea } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './QuestionCard.module.css';
import { RatingScale } from './RatingScale';
import { answerIssues, commentHint, commentRequired, questionDomId, type RatingValue, showsFollowUp } from './rules';
import { type AnswerPatch, type LocalAnswer } from './types';

export type QuestionCardProps = {
  question: FormQuestion;
  /** 1-based position across the whole form ("Q7"). */
  index: number;
  answer: LocalAnswer | undefined;
  onChange: (patch: AnswerPatch) => void;
  /** Section label above the text (the subcategory). */
  section?: string | null;
  /** Show rule errors before the user touched the question (after Next, or a jump from review). */
  showValidation?: boolean;
  readOnly?: boolean;
  className?: string;
};

/**
 * One question: text with ⓘ help, the segmented rating, the follow-up options
 * on Fair/Poor, and the comment with its mode rules (backend §7 "Form rules").
 * Validation is inline: the rating error appears when asked for; the comment
 * error as soon as the rule applies and the field was left or asked for.
 */
export function QuestionCard({ question, index, answer, onChange, section, showValidation = false, readOnly = false, className }: QuestionCardProps) {
  const id = useId();
  const textId = `${id}-text`;
  const helpId = `${id}-help`;
  const ratingErrorId = `${id}-rating-error`;
  const [helpOpen, setHelpOpen] = useState(false);
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
    <article id={questionDomId(question.id)} tabIndex={-1} aria-labelledby={textId} className={cn(styles.card, className)} data-question-id={question.id}>
      <p className={styles.eyebrow}>
        <span className="num">Q{index}</span>
        {section ? <span className={styles.eyebrowSection}> · {section}</span> : null}
      </p>
      <div className={styles.head}>
        <h3 id={textId} className={styles.text}>
          {question.text}
        </h3>
        {question.help ? (
          <IconButton
            label={helpOpen ? 'Hide help' : 'About this question'}
            icon={<Icon name="info" size={18} />}
            size="sm"
            active={helpOpen}
            aria-expanded={helpOpen}
            aria-controls={helpId}
            onClick={() => setHelpOpen((v) => !v)}
            className={styles.helpButton}
          />
        ) : null}
      </div>
      {question.help && helpOpen ? (
        <p id={helpId} className={styles.help}>
          {question.help}
        </p>
      ) : null}

      <RatingScale
        name={`rating-${question.id}`}
        value={value}
        onChange={onRating}
        disabled={readOnly}
        labelledBy={textId}
        describedBy={ratingIssue ? ratingErrorId : undefined}
        invalid={Boolean(ratingIssue)}
      />
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
    </article>
  );
}
