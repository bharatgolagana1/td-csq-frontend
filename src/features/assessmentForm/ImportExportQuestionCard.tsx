import { useId } from 'react';

import { type AnswerDirection, type FormQuestion } from '@/api/assessments.types';
import { cn } from '@/lib/cn';

import { AnswerControls } from './AnswerControls';
import styles from './ImportExportQuestionCard.module.css';
import cardStyles from './QuestionCard.module.css';
import { QuestionHead } from './QuestionHead';
import { ANSWER_DIRECTIONS, DIRECTION_LABELS, questionDomId } from './rules';
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

/**
 * One question of an IMPORT_EXPORT form: the text and help once, then an
 * Import and an Export part, each a full answer (rating, follow-up, comment)
 * with the same rules and inline validation as a single-answer QuestionCard.
 * Each part is a jump target of its own, and its rating group is named
 * "<question> — Import" / "— Export".
 */
export function ImportExportQuestionCard({ question, index, answerFor, onChange, section, showValidation = false, readOnly = false, className }: ImportExportQuestionCardProps) {
  const id = useId();
  const textId = `${id}-text`;
  return (
    <article id={questionDomId(question.id)} tabIndex={-1} aria-labelledby={textId} className={cn(cardStyles.card, className)} data-question-id={question.id}>
      <QuestionHead question={question} index={index} section={section} textId={textId} />
      {ANSWER_DIRECTIONS.map((direction) => {
        const label = DIRECTION_LABELS[direction];
        const headingId = `${id}-${direction.toLowerCase()}`;
        return (
          <section key={direction} id={questionDomId(question.id, direction)} tabIndex={-1} aria-labelledby={headingId} className={styles.direction}>
            <h4 id={headingId} className={styles.directionTitle}>
              {label}
            </h4>
            <AnswerControls
              question={question}
              answer={answerFor(direction)}
              onChange={(patch) => onChange(direction, patch)}
              name={`rating-${question.id}-${direction.toLowerCase()}`}
              label={`${question.text} — ${label}`}
              showValidation={showValidation}
              readOnly={readOnly}
            />
          </section>
        );
      })}
    </article>
  );
}
