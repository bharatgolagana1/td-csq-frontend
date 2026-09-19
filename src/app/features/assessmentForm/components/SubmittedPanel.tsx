import type { FC } from 'react';
import type { Submission } from '../api/assessmentForm.types';
import { formatDateTime } from '../assessmentForm.logic';

export interface SubmittedPanelProps {
  submission: Submission;
  organisation: string;
  terminalLabel: string;
  cycleLabel: string;
}

export const SubmittedPanel: FC<SubmittedPanelProps> = ({
  submission,
  organisation,
  terminalLabel,
  cycleLabel,
}) => (
  <div className="af-state">
    <div className="af-state-card">
      <span className="af-tick" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <h1>Assessment submitted</h1>
      <p className="af-state-lede">
        Thank you. Your ratings for {terminalLabel} have been recorded for {cycleLabel}.
      </p>

      <dl className="af-receipt">
        <div>
          <dt>Reference</dt>
          <dd className="af-mono">{submission.reference}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDateTime(submission.submittedAt)}</dd>
        </div>
        <div>
          <dt>On behalf of</dt>
          <dd>{organisation}</dd>
        </div>
      </dl>

      <p className="af-state-note">
        Your answers are now locked and cannot be edited. Results are aggregated across all
        assessors, reported to each operator individually, and are not made public at any stage.
      </p>
      <p className="af-state-note">You can close this page.</p>
    </div>
  </div>
);

export default SubmittedPanel;
