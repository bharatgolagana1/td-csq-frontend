import { useId } from 'react';

import { type AnswerDirection, type FormQuestion } from '@/api/assessments.types';
import { cn } from '@/lib/cn';

import { FollowUpChoices } from './FollowUpChoices';
import styles from './ImportExportQuestionCard.module.css';
import cardStyles from './QuestionCard.module.css';
import { QuestionHead } from './QuestionHead';
import { RatingScale } from './RatingScale';
import { ANSWER_DIRECTIONS, answerIssues, DIRECTION_LABELS, questionDomId, type RatingValue, showsFollowUp } from './rules';
import { type AnswerPatch, type LocalAnswer } from './types';

export type ImportExportQuestionCardProps = {
  question: FormQuestion;
  /** 1-based position across the whole form ("Q7"). */
  index: number;
  /** The local answer of each direction. */
  answerFor: (direction: AnswerDirection) => LocalAnswer | undefined;
  onChange: (direction: AnswerDirection, patch: AnswerPatch) => void;
  /** Section label above the text (the subcategory). */
  section?: string | null;
  /** Show rule errors before the user touched the question (after Next, or a jump from review). */
  showValidation?: boolean;
  readOnly?: boolean;
  className?: string;
};

type DirectionRowProps = Omit<ImportExportQuestionCardProps, 'index' | 'answerFor' | 'onChange' | 'section' | 'className'> & {
  direction: AnswerDirection;
  answer: LocalAnswer | undefined;
  onChange: (patch: AnswerPatch) => void;
};

/** One direction of the card: its label, the rating row, the rating error, and the follow-up once that direction is rated Fair or Poor. A jump target of its own. */
function DirectionRow({ question, direction, answer, onChange, showValidation = false, readOnly = false }: DirectionRowProps) {
  const id = useId();
  const label = DIRECTION_LABELS[direction];
  const titleId = `${id}-title`;
  const errorId = `${id}-error`;
  const ratingIssue = showValidation ? answerIssues(question, answer, direction).find((i) => i.field === 'rating') : undefined;
  const value: RatingValue | null = answer?.na ? 'NA' : (answer?.rating ?? null);
  const followUp = showsFollowUp(question, answer) ? question.followUp : null;

  const onRating = (next: RatingValue) => {
    if (next === 'NA') onChange({ na: true, rating: null });
    else onChange({ rating: next, na: false });
  };

  return (
    <div role="group" id={questionDomId(question.id, direction)} tabIndex={-1} aria-labelledby={titleId} className={styles.direction}>
      <p id={titleId} className={styles.directionTitle}>
        {label}
      </p>
      <RatingScale
        compact
        name={`rating-${question.id}-${direction.toLowerCase()}`}
        label={`${question.text} — ${label}`}
        value={value}
        onChange={onRating}
        disabled={readOnly}
        describedBy={ratingIssue ? errorId : undefined}
        invalid={Boolean(ratingIssue)}
      />
      {ratingIssue ? (
        <p id={errorId} role="alert" className={cardStyles.error}>
          {ratingIssue.message}
        </p>
      ) : null}
      {followUp ? <FollowUpChoices inline followUp={followUp} value={answer?.followUp ?? []} onChange={(next) => onChange({ followUp: next })} disabled={readOnly} /> : null}
    </div>
  );
}

/**
 * One question of an IMPORT_EXPORT form, compact: the text and help once,
 * then an Import and an Export rating row — side by side when the card is wide
 * enough, stacked on a phone. Each row is a full rating group named
 * "<question> — Import" / "— Export" with its own inline validation, opens the
 * question's follow-up only when that direction is rated Fair or Poor, and is a
 * jump target of its own. No comment: the section's remark carries the free text.
 */
export function ImportExportQuestionCard({ question, index, answerFor, onChange, section, showValidation = false, readOnly = false, className }: ImportExportQuestionCardProps) {
  const textId = `${useId()}-text`;
  return (
    <article id={questionDomId(question.id)} tabIndex={-1} aria-labelledby={textId} className={cn(cardStyles.card, styles.card, className)} data-question-id={question.id}>
      <QuestionHead question={question} index={index} section={section} textId={textId} />
      <div className={styles.directions}>
        {ANSWER_DIRECTIONS.map((direction) => (
          <DirectionRow
            key={direction}
            question={question}
            direction={direction}
            answer={answerFor(direction)}
            onChange={(patch) => onChange(direction, patch)}
            showValidation={showValidation}
            readOnly={readOnly}
          />
        ))}
      </div>
    </article>
  );
}
