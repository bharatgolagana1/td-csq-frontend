import type { FC } from 'react';

const LockIcon: FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" strokeLinecap="round" />
  </svg>
);

/**
 * The first question an operator asks on this screen is who said that. Answering
 * it once, in place, is cheaper than answering it on every support call, and the
 * reason matters as much as the rule.
 */
export const IdentityBoundary: FC<{ canSeeRespondentIdentity: boolean }> = ({
  canSeeRespondentIdentity,
}) => {
  if (canSeeRespondentIdentity) {
    return (
      <div className="csqh-note">
        <div className="csqh-note-hd">
          <LockIcon />
          Respondent identities are visible to your ACFI role
        </div>
        <p>
          You are seeing named respondents because your role allows it. Operators never do. Take
          care when sharing anything from this screen, including the export.
        </p>
      </div>
    );
  }

  return (
    <div className="csqh-note">
      <div className="csqh-note-hd">
        <LockIcon />
        You can see what kind of respondent answered, not who they are
      </div>
      <p>
        Each response carries a stable reference such as F-07, so you can follow one respondent
        through a cycle and see whether a complaint in one head repeats in another. Names,
        companies, contact details and the invitation used are not sent to your session, and they
        are not in the CSV export.
      </p>
      <details>
        <summary>Why the boundary is drawn here</summary>
        <p>
          ACFI&apos;s undertaking to the trade is that a customer can rate a terminal candidly
          without it touching the commercial relationship. A response that can be traced back to
          the person who gave it stops being candid, and the exercise stops being worth running.
          ACFI holds the mapping from reference to respondent. If a response needs following up,
          raise it with ACFI quoting the reference and they can go back to the respondent without
          naming them to you.
        </p>
      </details>
    </div>
  );
};

export default IdentityBoundary;
