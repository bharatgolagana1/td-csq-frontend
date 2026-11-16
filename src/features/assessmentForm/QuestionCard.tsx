import { useId } from 'react';

import { type FormQuestion } from '@/api/assessments.types';
import { cn } from '@/lib/cn';

import { AnswerControls } from './AnswerControls';
import styles from './QuestionCard.module.css';
import { QuestionHead } from './QuestionHead';
import { questionDomId } from './rules';
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

/** One question with rating options, conditional follow-ups, and an optional comment. */
export function QuestionCard({ question, index, answer, onChange, section, showValidation = false, readOnly = false, className }: QuestionCardProps) {
  const textId = `${useId()}-text`;
  return (
    <article id={questionDomId(question.id)} tabIndex={-1} aria-labelledby={textId} className={cn(styles.card, className)} data-question-id={question.id}>
      <QuestionHead question={question} index={index} section={section} textId={textId} />
      <AnswerControls question={question} answer={answer} onChange={onChange} name={`rating-${question.id}`} labelledBy={textId} showValidation={showValidation} readOnly={readOnly} />
    </article>
  );
}
