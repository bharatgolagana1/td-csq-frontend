
import { useId, useState } from 'react';

import { type FormQuestion } from '@/api/assessments.types';
import { Icon } from '@/design/icons';
import { IconButton } from '@/design/primitives';

import cardStyles from './QuestionCard.module.css';
import styles from './ImportExportQuestionPreview.module.css';
import { QuestionCard } from './QuestionCard';
import { emptyAnswer, questionDomId } from './rules';
import { type AnswerPatch, type LocalAnswer } from './types';

type Direction = 'IMPORT' | 'EXPORT';

const DIRECTIONS: readonly Direction[] = ['IMPORT', 'EXPORT'];

type Props = {
  question: FormQuestion;
  index: number;
  section?: string | null;
  readOnly?: boolean;
  answerFor?: (direction: Direction) => LocalAnswer | undefined;
  onAnswerChange?: (direction: Direction, patch: AnswerPatch) => void;
};


export function ImportExportQuestionPreview({
  question,
  index,
  section,
  readOnly = false,
  answerFor,
  onAnswerChange,
}: Props) {
  const id = useId();
  const textId = `${id}-question`;
  const helpId = `${id}-help`;

  // Both accordions are expanded by default.
  const [expanded, setExpanded] = useState<Record<Direction, boolean>>({
    IMPORT: true,
    EXPORT: true,
  });

  const [helpOpen, setHelpOpen] = useState(false);

  // Temporary preview state only: never sent to the backend.
  const [answers, setAnswers] = useState<Record<Direction, LocalAnswer>>(
    () => ({
      IMPORT: emptyAnswer(question.id),
      EXPORT: emptyAnswer(question.id),
    }),
  );

  function updateAnswer(direction: Direction, patch: AnswerPatch) {
    if (onAnswerChange) {
      onAnswerChange(direction, patch);
      return;
    }
    setAnswers((previous) => {
      const next = { ...previous[direction], ...patch };

      if (patch.na === true) next.rating = null;
      if (patch.rating !== undefined && patch.rating !== null) {
        next.na = false;
      }

      return {
        ...previous,
        [direction]: next,
      };
    });
  }

  return (
    <article
      id={questionDomId(question.id)}
      tabIndex={-1}
      aria-labelledby={textId}
      className={cardStyles.card}
      data-question-id={question.id}
    >
      <p className={cardStyles.eyebrow}>
        <span className="num">Q{index}</span>
        {section ? (
          <span className={cardStyles.eyebrowSection}>
            {' '}· {section}
          </span>
        ) : null}
      </p>

      <div className={cardStyles.head}>
        <h3 id={textId} className={cardStyles.text}>
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
            onClick={() => setHelpOpen((value) => !value)}
            className={cardStyles.helpButton}
          />
        ) : null}
      </div>

      {question.help && helpOpen ? (
        <p id={helpId} className={cardStyles.help}>
          {question.help}
        </p>
      ) : null}

      <div className={styles.stack}>
        {DIRECTIONS.map((direction) => {
          const label = direction === 'IMPORT' ? 'Import' : 'Export';
          const triggerId = `${id}-${direction}-trigger`;
          const panelId = `${id}-${direction}-panel`;
          const open = expanded[direction];

          return (
            <section className={styles.accordion} key={direction}>
              <h4 className={styles.heading}>
                <button
                  id={triggerId}
                  type="button"
                  className={styles.trigger}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() =>
                    setExpanded((previous) => ({
                      ...previous,
                      [direction]: !previous[direction],
                    }))
                  }
                >
                  <span>{label}</span>
                  <span className={styles.chevron}>
                    <Icon name="chevron-down" size={18} />
                  </span>
                </button>
              </h4>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className={styles.panel}
                hidden={!open}
              >
                <QuestionCard
                  question={question}
                  index={index}
                  answer={answerFor ? answerFor(direction) : answers[direction]}
                  onChange={(patch) => updateAnswer(direction, patch)}
                  readOnly={readOnly}
                  controlsOnly
                  controlsLabelledBy={`${textId} ${triggerId}`}
                  ratingGroupName={`rating-${question.id}-${direction.toLowerCase()}`}
                  className={styles.controls}
                />
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
