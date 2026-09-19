import type { FC } from 'react';
import type { Invite, Progress } from '../api/assessmentForm.types';
import type { SaveState } from '../hooks/useAssessmentDraft';
import { formatClock } from '../assessmentForm.logic';

export interface FormHeaderProps {
  invite: Invite;
  cycleLabel: string;
  progress: Progress;
  saveState: SaveState;
  savedAt: string | null;
  online: boolean;
}

/**
 * The autosave line reassures without nagging: it never takes focus, never
 * animates, and only ever occupies one muted line. It matters most when it says
 * something has gone wrong.
 */
function saveText(state: SaveState, savedAt: string | null, online: boolean): string {
  if (!online) return 'Saved on this phone. It will sync when you are back online.';
  switch (state) {
    case 'saving':
      return 'Saving';
    case 'saved':
      return savedAt ? `Saved ${formatClock(savedAt)}` : 'Saved';
    case 'failed':
      return 'Could not reach the server. Your answers are safe on this phone.';
    case 'local':
      return 'Saved on this phone.';
    case 'pending':
      return 'Saving';
    default:
      return savedAt ? `Last saved ${formatClock(savedAt)}` : 'Your answers save automatically';
  }
}

export const FormHeader: FC<FormHeaderProps> = ({
  invite,
  cycleLabel,
  progress,
  saveState,
  savedAt,
  online,
}) => {
  const pct = progress.total === 0 ? 0 : Math.round((progress.answered / progress.total) * 100);
  const warn = !online || saveState === 'failed' || saveState === 'local';
  const message = saveText(saveState, savedAt, online);

  return (
    <header className="af-header">
      <div className="af-header-top">
        <div className="af-header-id">
          <div className="af-eyebrow">Cargo Service Quality · {cycleLabel}</div>
          <h1 className="af-title">
            {invite.terminal.terminalName}, {invite.terminal.airportName}
            <span className="af-iata">{invite.terminal.airportIata}</span>
          </h1>
        </div>
        <span className="af-sample">Illustrative · sample instrument</span>
      </div>

      <div className="af-progress">
        <div className="af-progress-bar">
          <span
            role="progressbar"
            aria-valuenow={progress.answered}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-label="Directions answered"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="af-progress-text">
          <strong>
            {progress.answered} of {progress.total}
          </strong>{' '}
          answered
          <span className={warn ? 'af-save is-warn' : 'af-save'}>{message}</span>
        </p>
      </div>

      {/* a polite region that fires on every save is nagging, so only the
          states an assessor needs to act on are announced */}
      <p className="af-vis-hidden" role="status" aria-live="polite">
        {warn ? message : ''}
      </p>
    </header>
  );
};

export default FormHeader;
