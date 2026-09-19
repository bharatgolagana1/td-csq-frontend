import type { FC } from 'react';
import type { CycleDraft, TimeZoneOption, ZonedDateTime } from '../api/cycleBuilder.types';
import type { EditPolicy, Issue, IssueField } from '../lib/cycleRules';
import { issuesFor } from '../lib/cycleRules';
import { durationText, toInstant } from '../lib/zonedTime';
import { Field } from './Field';
import { ZonedDateTimeInput } from './ZonedDateTimeInput';

export interface WindowFieldsProps {
  draft: CycleDraft;
  timeZones: TimeZoneOption[];
  policy: EditPolicy;
  issues: Issue[];
  onChange: (patch: Partial<CycleDraft>) => void;
  onTimeZoneChange: (timeZone: string) => void;
}

const Span: FC<{ from: ZonedDateTime; to: ZonedDateTime; noun: string }> = ({ from, to, noun }) => {
  const a = toInstant(from);
  const b = toInstant(to);
  if (a === null || b === null || b <= a) return null;
  return (
    <p className="cb-span">
      {noun} window: <b>{durationText(a, b)}</b>.
    </p>
  );
};

export const WindowFields: FC<WindowFieldsProps> = ({
  draft,
  timeZones,
  policy,
  issues,
  onChange,
  onTimeZoneChange,
}) => {
  // the overlap note is an INFO and the timeline explains it properly; repeating
  // it under a date field would be the third copy of one sentence
  const fieldIssues = (field: IssueField) =>
    issuesFor(issues, field).filter((i) => i.severity !== 'INFO');

  const closeRule = policy.assessmentCloses;
  const closeDisabled = closeRule === 'LOCKED';
  const closeNote =
    closeRule === 'EXTEND_ONLY'
      ? 'You can move this later to buy response time. You cannot bring it forward on assessors who already hold a link.'
      : closeRule === 'LOCKED'
        ? 'The cycle is closed. This is a record now.'
        : undefined;

  return (
    <section className="cb-card" aria-labelledby="cb-windows-h">
      <h2 id="cb-windows-h">Windows</h2>
      <p className="sub">
        Four moments decide the whole cycle. Each is a wall clock reading in a named zone, because
        midnight on the 12th is a different instant in a different zone and a cycle that opens early
        cannot be taken back.
      </p>

      <Field
        id="cb-tz"
        label="Cycle timezone"
        help="Every date below is read in this zone. Changing it keeps the readings you typed and moves the moments they name."
        issues={issuesFor(issues, 'timeZone')}
      >
        {({ id, describedBy }) => (
          <select
            id={id}
            className="cb-select cb-select--zone"
            value={draft.timeZone}
            disabled={!policy.samplingWindow && !policy.assessmentOpens && closeDisabled}
            aria-describedby={describedBy}
            onChange={(e) => onTimeZoneChange(e.target.value)}
          >
            {timeZones.map((tz) => (
              <option key={tz.id} value={tz.id}>{tz.label}</option>
            ))}
          </select>
        )}
      </Field>

      <div className="cb-window">
        <h3 className="cb-window-h">
          <span className="cb-swatch is-sampling" aria-hidden="true" />
          Sampling window
        </h3>
        <p className="cb-window-sub">
          Operators nominate the freight forwarders and customs brokers who use their terminal. The
          sample locks when this closes.
        </p>
        <div className="cb-two">
          <ZonedDateTimeInput
            id="cb-sampling-opens"
            label="Sampling opens"
            value={draft.samplingOpens}
            issues={fieldIssues('samplingOpens')}
            disabled={!policy.samplingWindow}
            lockNote={policy.samplingWindow ? undefined : 'Fixed when the cycle was scheduled.'}
            onChange={(samplingOpens) => onChange({ samplingOpens })}
          />
          <ZonedDateTimeInput
            id="cb-sampling-closes"
            label="Sampling closes"
            value={draft.samplingCloses}
            issues={fieldIssues('samplingCloses')}
            disabled={!policy.samplingWindow}
            lockNote={policy.samplingWindow ? undefined : 'Fixed when the cycle was scheduled.'}
            onChange={(samplingCloses) => onChange({ samplingCloses })}
          />
        </div>
        <Span from={draft.samplingOpens} to={draft.samplingCloses} noun="Sampling" />
      </div>

      <div className="cb-window">
        <h3 className="cb-window-h">
          <span className="cb-swatch is-assessment" aria-hidden="true" />
          Assessment window
        </h3>
        <p className="cb-window-sub">
          Sampled customers, the operator and the external assessor answer the form. Links go out by
          WhatsApp and email the moment this opens.
        </p>
        <div className="cb-two">
          <ZonedDateTimeInput
            id="cb-assessment-opens"
            label="Assessment opens"
            value={draft.assessmentOpens}
            issues={fieldIssues('assessmentOpens')}
            disabled={!policy.assessmentOpens}
            lockNote={policy.assessmentOpens ? undefined : 'Fixed when the cycle was scheduled.'}
            onChange={(assessmentOpens) => onChange({ assessmentOpens })}
          />
          <ZonedDateTimeInput
            id="cb-assessment-closes"
            label="Assessment closes"
            value={draft.assessmentCloses}
            issues={fieldIssues('assessmentCloses')}
            disabled={closeDisabled}
            lockNote={closeNote}
            onChange={(assessmentCloses) => onChange({ assessmentCloses })}
          />
        </div>
        <Span from={draft.assessmentOpens} to={draft.assessmentCloses} noun="Assessment" />
      </div>
    </section>
  );
};
