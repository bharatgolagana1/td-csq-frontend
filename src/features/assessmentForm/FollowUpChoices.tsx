import { useId } from 'react';

import { type FormQuestion } from '@/api/assessments.types';
import { Checkbox } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './QuestionCard.module.css';

export type FollowUpChoicesProps = {
  followUp: NonNullable<FormQuestion['followUp']>;
  /** The options ticked so far. */
  value: readonly string[];
  onChange: (followUp: string[]) => void;
  /** Options side by side, wrapping (the import / export rows); one per line otherwise. */
  inline?: boolean;
  disabled?: boolean;
};

/** The follow-up a Fair or Poor rating opens (backend §7 "Form rules"): the question's prompt and a checkbox per listed option. */
export function FollowUpChoices({ followUp, value, onChange, inline = false, disabled = false }: FollowUpChoicesProps) {
  const promptId = `${useId()}-followup`;
  const toggle = (option: string, checked: boolean) => {
    onChange(checked ? Array.from(new Set([...value, option])) : value.filter((o) => o !== option));
  };
  return (
    <div role="group" aria-labelledby={promptId} className={cn(styles.followUp, inline && styles.followUpInline)}>
      <p id={promptId} className={styles.followUpPrompt}>
        {followUp.prompt}
      </p>
      <div className={styles.followUpOptions}>
        {followUp.options.map((option) => (
          <Checkbox key={option} label={option} checked={value.includes(option)} disabled={disabled} onChange={(e) => toggle(option, e.target.checked)} />
        ))}
      </div>
    </div>
  );
}
