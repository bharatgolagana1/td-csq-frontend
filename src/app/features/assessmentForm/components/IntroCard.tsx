import { useState, type FC } from 'react';
import type { DirectionCode, Invite } from '../api/assessmentForm.types';
import { DIRECTION_LABEL, formatDate } from '../assessmentForm.logic';

export interface IntroCardProps {
  invite: Invite;
  cycleLabel: string;
  parameterCount: number;
  directions: DirectionCode[];
}

const SEEN_KEY = 'csq.assess.intro.seen';

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // nothing recoverable to do
  }
}

/**
 * The first screen after a WhatsApp link. It answers the four questions an
 * assessor has before they will start: who is asking, how long this takes, why
 * everything is rated twice, and who gets to see it.
 */
export const IntroCard: FC<IntroCardProps> = ({ invite, cycleLabel, parameterCount, directions }) => {
  const [open, setOpen] = useState(() => !readSeen());
  const pair = directions.map((d) => DIRECTION_LABEL[d]).join(' and ');

  if (!open) {
    return (
      <button type="button" className="af-intro-collapsed" onClick={() => setOpen(true)}>
        How this works, and who sees it
      </button>
    );
  }

  return (
    <section className="af-intro" aria-labelledby="af-intro-title">
      <h2 id="af-intro-title">Before you start</h2>
      <p className="af-intro-lede">
        {invite.assessorName}, you are rating <strong>{invite.terminal.terminalName}</strong> at{' '}
        {invite.terminal.airportFullName} on behalf of {invite.organisation}, for {cycleLabel}.
      </p>

      <ul className="af-intro-list">
        <li>
          <strong>{parameterCount} parameters</strong>, each rated twice, once for {pair}. That is{' '}
          {parameterCount * directions.length} ratings, and it takes most assessors around 15 minutes.
        </li>
        <li>
          <strong>Five points plus NA.</strong> Excellent 5, Very Good 4, Good 3, Fair 2, Poor 1.
          Choose NA where the parameter does not apply to your cargo. NA counts as answered and is
          left out of scoring.
        </li>
        <li>
          <strong>Nothing is lost.</strong> Your answers save as you go, on this phone and to your
          account. You can close this page and come back to the same link.
        </li>
        <li>
          <strong>Confidential.</strong> Results are reported to each operator individually and are
          never made public at any stage. Your individual ratings are not shown to the terminal.
        </li>
      </ul>

      <p className="af-intro-window">
        Open until {formatDate(invite.assessmentWindow.closesAt)}
      </p>

      <button
        type="button"
        className="af-btn af-btn--primary"
        onClick={() => {
          writeSeen();
          setOpen(false);
        }}
      >
        Start
      </button>
    </section>
  );
};

export default IntroCard;
