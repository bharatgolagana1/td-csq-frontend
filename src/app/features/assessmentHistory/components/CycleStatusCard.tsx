import { useMemo, type FC } from 'react';
import type { CycleSummary, SubmissionRow } from '../api/history.types';
import { CYCLE_STATE_LABEL, dayToUtc, formatWindowDay } from '../lib/labels';
import { meanOfScores, scoreColour } from '../lib/scoring';

const STATE_COLOUR: Record<CycleSummary['state'], string> = {
  SAMPLING: 'var(--csq-r2)',
  ASSESSMENT_OPEN: 'var(--csq-r5)',
  CLOSED: 'var(--csq-muted)',
  SCORED: 'var(--csq-accent)',
};

interface TrackProps {
  name: string;
  start: number;
  end: number;
  axisStart: number;
  axisSpan: number;
  today: number;
  colour: string;
  dates: string;
}

const Track: FC<TrackProps> = ({ name, start, end, axisStart, axisSpan, today, colour, dates }) => {
  const left = ((start - axisStart) / axisSpan) * 100;
  const width = ((end - start) / axisSpan) * 100;
  const todayPct = ((today - axisStart) / axisSpan) * 100;
  const isOpen = today >= start && today <= end;

  return (
    <>
      <div className="csqh-track">
        <span className="csqh-track-name">{name}</span>
        <div className="csqh-track-rail">
          <span
            className="csqh-track-bar"
            style={{ left: `${left}%`, width: `${width}%`, background: colour, opacity: isOpen ? 1 : 0.45 }}
          />
          {todayPct >= 0 && todayPct <= 100 ? (
            <span className="csqh-track-today" style={{ left: `${todayPct}%` }} />
          ) : null}
        </div>
      </div>
      <div className="csqh-track" style={{ marginBottom: 12 }}>
        <span />
        <span className="csqh-track-dates">{dates}</span>
      </div>
    </>
  );
};

/**
 * The two windows are drawn on one axis because the fact that matters is where
 * they overlap: a customer sampled in August is still rated in the same cycle.
 */
export const CycleStatusCard: FC<{
  cycle: CycleSummary;
  submissions: SubmissionRow[];
  commentCount: number;
}> = ({ cycle, submissions, commentCount }) => {
  const summary = useMemo(() => {
    const submitted = submissions.filter((s) => s.status === 'SUBMITTED');
    const customer = submitted.filter((s) => s.assessorKind === 'CUSTOMER');
    return {
      submittedCount: submitted.length,
      inProgress: submissions.filter((s) => s.status === 'IN_PROGRESS').length,
      customerMean: meanOfScores(customer.map((s) => s.score)),
      customerCount: customer.length,
    };
  }, [submissions]);

  const today = Date.now();
  const bounds = [
    dayToUtc(cycle.samplingWindow.start),
    dayToUtc(cycle.samplingWindow.end),
    dayToUtc(cycle.assessmentWindow.start),
    dayToUtc(cycle.assessmentWindow.end),
  ];
  const axisStart = Math.min(...bounds);
  const axisEnd = Math.max(...bounds);
  const axisSpan = Math.max(axisEnd - axisStart, 1);

  const responded = cycle.invitedCount > 0
    ? Math.round((summary.submittedCount / cycle.invitedCount) * 100)
    : 0;
  const inProgressPct = cycle.invitedCount > 0
    ? (summary.inProgress / cycle.invitedCount) * 100
    : 0;
  const assessmentOpen =
    today >= dayToUtc(cycle.assessmentWindow.start) && today <= dayToUtc(cycle.assessmentWindow.end);

  return (
    <div className="csqh-card">
      <div className="csqh-cycle">
        <div>
          <div className="csqh-cycle-top">
            <h2>{cycle.label}</h2>
            <span className="csqh-state-pill" style={{ color: STATE_COLOUR[cycle.state] }}>
              {CYCLE_STATE_LABEL[cycle.state]}
            </span>
          </div>

          <Track
            name="Sampling"
            start={dayToUtc(cycle.samplingWindow.start)}
            end={dayToUtc(cycle.samplingWindow.end)}
            axisStart={axisStart}
            axisSpan={axisSpan}
            today={today}
            colour="var(--csq-r3)"
            dates={`${formatWindowDay(cycle.samplingWindow.start)} to ${formatWindowDay(cycle.samplingWindow.end)}`}
          />
          <Track
            name="Assessment"
            start={dayToUtc(cycle.assessmentWindow.start)}
            end={dayToUtc(cycle.assessmentWindow.end)}
            axisStart={axisStart}
            axisSpan={axisSpan}
            today={today}
            colour="var(--csq-accent)"
            dates={`${formatWindowDay(cycle.assessmentWindow.start)} to ${formatWindowDay(cycle.assessmentWindow.end)}`}
          />
          <p className="csqh-tiny" style={{ margin: '4px 0 0' }}>
            The vertical mark is today. The windows overlap on purpose: a customer added to the
            sample late in the cycle can still be invited after assessment has opened.
          </p>
        </div>

        <div>
          <div className="csqh-label">Responses</div>
          <div
            className="csqh-progress"
            role="img"
            aria-label={`${summary.submittedCount} of ${cycle.invitedCount} invited assessors have submitted`}
          >
            <span style={{ width: `${responded}%`, background: 'var(--csq-accent)' }} />
            <span style={{ width: `${inProgressPct}%`, background: 'var(--csq-r2)' }} />
          </div>
          <div className="csqh-legend">
            <span><i style={{ background: 'var(--csq-accent)' }} />{summary.submittedCount} submitted</span>
            <span><i style={{ background: 'var(--csq-r2)' }} />{summary.inProgress} in progress</span>
            <span><i style={{ background: 'var(--csq-surface-2)' }} />
              {Math.max(cycle.invitedCount - summary.submittedCount - summary.inProgress, 0)} not started
            </span>
          </div>

          <div className="csqh-stats">
            <div>
              <div className="csqh-stat-k">Response rate</div>
              <div className="csqh-stat-v">{responded}%</div>
              <div className="csqh-stat-n">of {cycle.invitedCount} invited</div>
            </div>
            <div>
              <div className="csqh-stat-k">Customer mean</div>
              <div className="csqh-stat-v" style={{ color: scoreColour(summary.customerMean) }}>
                {summary.customerMean === null ? 'n/a' : summary.customerMean.toFixed(1)}
              </div>
              <div className="csqh-stat-n">
                {assessmentOpen ? 'provisional' : 'final'} · {summary.customerCount} responses
              </div>
            </div>
            <div>
              <div className="csqh-stat-k">Comments</div>
              <div className="csqh-stat-v">{commentCount}</div>
              <div className="csqh-stat-n">free text answers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleStatusCard;
