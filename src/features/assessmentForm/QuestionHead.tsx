import { useId, useState } from 'react';

import { type FormQuestion } from '@/api/assessments.types';
import { Icon } from '@/design/icons';
import { IconButton } from '@/design/primitives';

import styles from './QuestionCard.module.css';

export type QuestionHeadProps = {
  question: FormQuestion;
  /** 1-based position across the whole form ("Q7"). */
  index: number;
  /** Section label above the text (the subcategory). */
  section?: string | null;
  /** id given to the question text, so the card and its rating can be named by it. */
  textId: string;
};

/** The top of a question card: number and section, the text, and the ⓘ help toggle. */
export function QuestionHead({ question, index, section, textId }: QuestionHeadProps) {
  const helpId = `${useId()}-help`;
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <>
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
    </>
  );
}
