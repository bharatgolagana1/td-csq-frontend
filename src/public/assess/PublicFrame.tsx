import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './assess.module.css';

export const FLOW_STEPS = ['Invitation', 'Code', 'Answers', 'Done'] as const;
export type FlowStep = 0 | 1 | 2 | 3;

export type PublicFrameProps = {
  /** Which of the four flow segments is current; null hides the affordance (closed states). */
  step: FlowStep | null;
  /** 0..1 fill of the current segment (the form's answered share). */
  stepProgress?: number;
  /** The form phase: a wider column for the step rail and the question cards. */
  wide?: boolean;
  children: ReactNode;
};

/** How full segment `index` is: done segments are full, the current one shows its own progress, later ones are empty. */
export function segmentFill(index: number, step: FlowStep, progress: number): number {
  if (index < step) return 1;
  if (index > step) return 0;
  // Only the answers segment has real progress; the others show "started".
  return step === 2 ? Math.max(0, Math.min(1, progress)) : 0.35;
}

/** The public page chrome: brand bar with the tiny always-visible flow affordance, a centred column, the confidentiality footer. */
export function PublicFrame({ step, stepProgress = 0, wide, children }: PublicFrameProps) {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            CSQ
          </span>
          <span>CSQ</span>
          <span className={styles.brandSub}>Cargo Service Quality · ACFI</span>
        </div>
        {step !== null ? (
          <div className={styles.flow} role="img" aria-label={`Step ${step + 1} of ${FLOW_STEPS.length}: ${FLOW_STEPS[step]}`}>
            <span className={styles.flowLabel} aria-hidden="true">
              {step + 1}/{FLOW_STEPS.length}
            </span>
            {FLOW_STEPS.map((label, i) => (
              <span key={label} className={cn(styles.seg, i === step && styles.segCurrent)}>
                <span className={styles.segFill} style={{ width: `${segmentFill(i, step, stepProgress) * 100}%` }} />
              </span>
            ))}
          </div>
        ) : null}
      </header>
      <main className={cn(styles.main, wide && styles.wide)}>{children}</main>
      <footer className={styles.footer}>Your answers reach the operator only in aggregate · Air Cargo Forum India</footer>
    </div>
  );
}
