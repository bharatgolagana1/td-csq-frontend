import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './Stepper.module.css';

export type Step = { id: string; label: string; description?: string };

export type StepperProps = {
  steps: Step[];
  /** Zero-based index of the current step. */
  current: number;
  /** When given, completed steps become buttons that jump back. */
  onStepClick?: (index: number) => void;
  className?: string;
};

export type StepState = 'done' | 'current' | 'upcoming';

export function stepState(index: number, current: number): StepState {
  if (index < current) return 'done';
  if (index === current) return 'current';
  return 'upcoming';
}

/** Multi-step progress for the cycle builder, bulk import and assessor form. */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn(styles.root, className)} aria-label="Progress">
      {steps.map((step, i) => {
        const state = stepState(i, current);
        const clickable = state === 'done' && Boolean(onStepClick);
        const marker = (
          <span className={styles.marker} aria-hidden="true">
            {state === 'done' ? <Icon name="check" size={16} /> : <span className={styles.number}>{i + 1}</span>}
          </span>
        );
        const text = (
          <span className={styles.text}>
            <span className={styles.label}>{step.label}</span>
            {step.description ? <span className={styles.description}>{step.description}</span> : null}
          </span>
        );
        return (
          <li key={step.id} className={cn(styles.step, styles[state])} aria-current={state === 'current' ? 'step' : undefined}>
            {clickable ? (
              <button type="button" className={styles.button} onClick={() => onStepClick?.(i)}>
                {marker}
                {text}
              </button>
            ) : (
              <span className={styles.static}>
                {marker}
                {text}
              </span>
            )}
            <span className={styles.visuallyHidden}>{state === 'done' ? ' (completed)' : state === 'current' ? ' (current)' : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}
