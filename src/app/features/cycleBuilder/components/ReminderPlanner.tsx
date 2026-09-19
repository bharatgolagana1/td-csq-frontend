import type { FC } from 'react';
import type {
  AssessorKind,
  AudienceOption,
  CycleDraft,
  ReminderDraft,
  SendChannel,
  ZonedDateTime,
} from '../api/cycleBuilder.types';
import type { EditPolicy, Issue } from '../lib/cycleRules';
import { issuesFor } from '../lib/cycleRules';
import { MS, formatWallDateTime, fromInstant, toInstant } from '../lib/zonedTime';
import { channelLabel } from '../lib/sendPlan';
import { FieldMessages } from './Field';
import { ZonedDateTimeInput } from './ZonedDateTimeInput';

export interface ReminderPlannerProps {
  draft: CycleDraft;
  audiences: AudienceOption[];
  policy: EditPolicy;
  issues: Issue[];
  onAdd: (at: ZonedDateTime) => void;
  onUpdate: (id: string, patch: Partial<ReminderDraft>) => void;
  onRemove: (id: string) => void;
}

const CHANNELS: SendChannel[] = ['WHATSAPP_AND_EMAIL', 'WHATSAPP', 'EMAIL'];

/** Reminders land at the start of a working day, not at whatever minute the maths produced. */
function atNineLocal(ms: number, timeZone: string): ZonedDateTime {
  return { ...fromInstant(ms, timeZone), time: '09:00' };
}

export const ReminderPlanner: FC<ReminderPlannerProps> = ({
  draft,
  audiences,
  policy,
  issues,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const open = toInstant(draft.assessmentOpens);
  const close = toInstant(draft.assessmentCloses);
  const windowReady = open !== null && close !== null && close > open;

  const presets = windowReady
    ? [
        { label: 'Day after it opens', at: open + MS.DAY },
        { label: 'Halfway', at: open + (close - open) / 2 },
        { label: 'Two days before close', at: close - 2 * MS.DAY },
      ]
    : [];

  const editable = policy.reminders;

  return (
    <section className="cb-card" aria-labelledby="cb-reminders-h">
      <h2 id="cb-reminders-h">Reminders</h2>
      <p className="sub">
        Every reminder has to land inside the assessment window. Outside it there is either no link
        yet or nothing left to submit.
      </p>

      {editable ? (
        <div className="cb-presets">
          <span className="cb-presets-label">Add one</span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="cb-btn cb-btn--ghost"
              onClick={() => onAdd(atNineLocal(preset.at, draft.timeZone))}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className="cb-btn cb-btn--ghost"
            onClick={() =>
              onAdd(
                windowReady && open !== null
                  ? atNineLocal(open + MS.DAY, draft.timeZone)
                  : { date: '', time: '09:00', timeZone: draft.timeZone },
              )
            }
          >
            Empty reminder
          </button>
        </div>
      ) : null}

      {draft.reminders.length === 0 ? (
        <p className="cb-empty">
          No reminders yet. On a form this long the reminders, not the invitation, are what bring the
          response rate in.
        </p>
      ) : null}

      <ol className="cb-rem-list">
        {draft.reminders.map((reminder, index) => {
          const whenIssues = issuesFor(issues, `reminder:${reminder.id}:at`);
          const whoIssues = issuesFor(issues, `reminder:${reminder.id}:audiences`);
          const whoMsgId = whoIssues.length > 0 ? `cb-rem-${reminder.id}-who-msg` : undefined;
          const locked = reminder.alreadySent || !editable;

          return (
            <li className={locked ? 'cb-rem is-locked' : 'cb-rem'} key={reminder.id}>
              <div className="cb-rem-head">
                <b>Reminder {index + 1}</b>
                {reminder.alreadySent ? <span className="cb-chip is-sent">sent</span> : null}
                {locked ? null : (
                  <button
                    type="button"
                    className="cb-btn cb-btn--quiet"
                    onClick={() => onRemove(reminder.id)}
                  >
                    Remove
                  </button>
                )}
              </div>

              {reminder.alreadySent ? (
                <p className="cb-rem-sent">
                  Went out {formatWallDateTime(reminder.at)} to{' '}
                  {audiences
                    .filter((a) => reminder.audiences.includes(a.kind))
                    .map((a) => a.label)
                    .join(', ')}{' '}
                  by {channelLabel(reminder.channel).toLowerCase()}. A message that has been
                  delivered cannot be edited or withdrawn.
                </p>
              ) : (
                <div className="cb-rem-grid">
                  <ZonedDateTimeInput
                    id={`cb-rem-${reminder.id}`}
                    label="Sends at"
                    value={reminder.at}
                    issues={whenIssues}
                    disabled={!editable}
                    compact
                    onChange={(at) => onUpdate(reminder.id, { at })}
                  />

                  <fieldset
                    className="cb-fieldset"
                    disabled={!editable}
                    aria-describedby={whoMsgId}
                  >
                    <legend className="cb-label">Goes to</legend>
                    <div className="cb-checks-row">
                      {audiences.map((audience) => {
                        const checked = reminder.audiences.includes(audience.kind);
                        return (
                          <label className="cb-check" key={audience.kind}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next: AssessorKind[] = checked
                                  ? reminder.audiences.filter((k) => k !== audience.kind)
                                  : [...reminder.audiences, audience.kind];
                                onUpdate(reminder.id, { audiences: next });
                              }}
                            />
                            <span>{audience.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <FieldMessages id={whoMsgId} issues={whoIssues} />
                  </fieldset>

                  <div className="cb-field">
                    <label className="cb-label" htmlFor={`cb-rem-${reminder.id}-channel`}>
                      Channel
                    </label>
                    <select
                      id={`cb-rem-${reminder.id}-channel`}
                      className="cb-select"
                      value={reminder.channel}
                      disabled={!editable}
                      onChange={(e) =>
                        onUpdate(reminder.id, { channel: e.target.value as SendChannel })
                      }
                    >
                      {CHANNELS.map((channel) => (
                        <option key={channel} value={channel}>{channelLabel(channel)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

            </li>
          );
        })}
      </ol>

      <FieldMessages issues={issuesFor(issues, 'reminders')} />

      <p className="cb-note">
        Reminders reach only the assessors who have not submitted. Anyone who has already answered
        is dropped from the send at the moment it goes out.
      </p>

      <dl className="cb-legend">
        {audiences.map((audience) => (
          <div key={audience.kind}>
            <dt>{audience.label}</dt>
            <dd>
              {audience.description}
              {audience.countsTowardScore ? '' : ' Reminding them changes no published number.'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
