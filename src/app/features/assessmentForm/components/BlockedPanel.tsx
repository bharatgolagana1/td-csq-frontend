import type { FC, ReactNode } from 'react';
import type { SessionBlock } from '../api/assessmentForm.types';
import { formatDate, formatDateTime } from '../assessmentForm.logic';

export interface BlockedPanelProps {
  block: SessionBlock;
}

interface Copy {
  title: string;
  body: ReactNode;
  tone: 'neutral' | 'closed' | 'done';
}

function copyFor(block: SessionBlock): Copy {
  switch (block.reason) {
    case 'ALREADY_SUBMITTED':
      return {
        tone: 'done',
        title: 'You have already submitted',
        body: (
          <>
            <p>
              This assessment was submitted on {formatDateTime(block.effectiveAt)} and is locked. An
              assessment cannot be edited or withdrawn once it has been submitted.
            </p>
            {block.submission ? (
              <p>
                Reference <span className="af-mono">{block.submission.reference}</span>
              </p>
            ) : null}
          </>
        ),
      };
    case 'LINK_EXPIRED':
      return {
        tone: 'closed',
        title: 'This link has expired',
        body: (
          <p>
            The link expired on {formatDate(block.effectiveAt)}. Links are timed for security and
            each one is tied to a single assessor. Ask for a fresh link and any draft you had saved
            will still be there.
          </p>
        ),
      };
    case 'WINDOW_NOT_OPEN':
      return {
        tone: 'neutral',
        title: 'Assessment has not opened yet',
        body: (
          <p>
            This cycle opens on {formatDate(block.effectiveAt)}. Keep this link. It will work from
            that date and you will get a reminder.
          </p>
        ),
      };
    case 'WINDOW_CLOSED':
      return {
        tone: 'closed',
        title: 'The assessment window has closed',
        body: (
          <p>
            Assessment for this cycle closed on {formatDate(block.effectiveAt)} and responses are no
            longer accepted. You will be invited again for the next cycle.
          </p>
        ),
      };
    case 'NOT_SAMPLED':
      return {
        tone: 'neutral',
        title: 'You are not in the sample for this cycle',
        body: (
          <p>
            Your link is valid, but your organisation is not part of the locked customer sample for
            this terminal in this cycle. The sample is fixed once a cycle is approved, so it cannot
            be changed from here. If you believe this is wrong, write to ACFI.
          </p>
        ),
      };
    default:
      return {
        tone: 'neutral',
        title: 'This link is not valid',
        body: (
          <p>
            We could not recognise this link. It may have been copied incompletely from a message.
            Try opening it again from the original message, or ask for a new one.
          </p>
        ),
      };
  }
}

export const BlockedPanel: FC<BlockedPanelProps> = ({ block }) => {
  const copy = copyFor(block);

  return (
    <div className="af-state">
      <div className={`af-state-card af-state-card--${copy.tone}`}>
        <div className="af-eyebrow">Cargo Service Quality assessment</div>
        <h1>{copy.title}</h1>
        <div className="af-state-lede">{copy.body}</div>

        {block.context ? (
          <dl className="af-receipt">
            <div>
              <dt>Terminal</dt>
              <dd>{block.context.terminalLabel}</dd>
            </div>
            <div>
              <dt>Cycle</dt>
              <dd>{block.context.cycleLabel}</dd>
            </div>
            <div>
              <dt>On behalf of</dt>
              <dd>{block.context.organisation}</dd>
            </div>
          </dl>
        ) : null}

        <p className="af-state-note">
          Questions about this assessment go to{' '}
          <a className="af-link" href={`mailto:${block.supportEmail}`}>
            {block.supportEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default BlockedPanel;
