import type { FC } from 'react';
import type { PlannedSend } from '../lib/sendPlan';
import { channelLabel } from '../lib/sendPlan';
import { formatWallDateTime } from '../lib/zonedTime';

export interface SendPreviewProps {
  plan: PlannedSend[];
  timeZone: string;
  /** sampling is still open once assessment has begun */
  overlapping: boolean;
}

export const SendPreview: FC<SendPreviewProps> = ({ plan, timeZone, overlapping }) => (
  <section className="cb-card" aria-labelledby="cb-preview-h">
    <h2 id="cb-preview-h">What goes out</h2>
    <p className="sub">
      Every message this cycle sends, in the order it sends them. Read it before you schedule, not
      after somebody forwards you a screenshot of it.
    </p>

    {plan.length === 0 ? (
      <p className="cb-empty">Set the four window dates and the send plan appears here.</p>
    ) : (
      <>
        <p className="cb-note">
          {plan.length} message{plan.length === 1 ? '' : 's'} across the cycle. Recipient counts are
          illustrative until the sample locks.
        </p>
        <ol className="cb-plan">
          {plan.map((send) => (
            <li className={send.automatic ? 'cb-send' : 'cb-send is-reminder'} key={send.id}>
              <div className="cb-send-when">
                <b>{formatWallDateTime(send.at)}</b>
                <span className="cb-send-zone">{timeZone}</span>
              </div>
              <div className="cb-send-body">
                <div className="cb-send-title">
                  {send.title}
                  <span className="cb-send-kind">{send.automatic ? 'automatic' : 'reminder'}</span>
                </div>
                <div className="cb-send-meta">
                  {send.audienceLabel}
                  {send.recipients === null ? '' : `, about ${send.recipients.toLocaleString('en-IN')} people`}
                  {' · '}
                  {channelLabel(send.channel)}
                </div>
                <p className="cb-send-text">{send.body}</p>
              </div>
            </li>
          ))}
        </ol>
        {overlapping ? (
          <p className="cb-note">
            Sampling is still open after assessment begins, so a customer nominated in that period
            gets their link when the nomination is accepted rather than at the moment listed above.
            They still see the same form and the same closing date.
          </p>
        ) : null}
        <p className="cb-note">
          Nothing in these messages carries another operator's score. Results go to each cargo
          handling agency individually and are not published at any stage.
        </p>
      </>
    )}
  </section>
);
