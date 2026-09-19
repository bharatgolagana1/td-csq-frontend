import type { CSSProperties, FC } from 'react';
import type { CycleDraft } from '../api/cycleBuilder.types';
import type { TimelineModel } from '../lib/cycleRules';
import { durationText, formatShortDate, formatWallDateTime, fromInstant, toInstant } from '../lib/zonedTime';

export interface CycleTimelineProps {
  draft: CycleDraft;
  model: TimelineModel | null;
  nowMs: number;
}

function pos(leftPct: number, widthPct?: number): CSSProperties {
  return widthPct === undefined
    ? { left: `${leftPct}%` }
    : { left: `${leftPct}%`, width: `${widthPct}%` };
}

export const CycleTimeline: FC<CycleTimelineProps> = ({ draft, model, nowMs }) => {
  const samplingSpan = (() => {
    const a = toInstant(draft.samplingOpens);
    const b = toInstant(draft.samplingCloses);
    return a !== null && b !== null && b > a ? durationText(a, b) : null;
  })();
  const assessmentSpan = (() => {
    const a = toInstant(draft.assessmentOpens);
    const b = toInstant(draft.assessmentCloses);
    return a !== null && b !== null && b > a ? durationText(a, b) : null;
  })();

  // a future cycle never crosses the now marker, so say the lead time in words
  const lead = (() => {
    const sOpen = toInstant(draft.samplingOpens);
    const aOpen = toInstant(draft.assessmentOpens);
    const aClose = toInstant(draft.assessmentCloses);
    if (sOpen !== null && nowMs < sOpen) return `Sampling opens in ${durationText(nowMs, sOpen)}.`;
    if (aOpen !== null && nowMs < aOpen) return `Assessment opens in ${durationText(nowMs, aOpen)}.`;
    if (aClose !== null && nowMs < aClose) return `Assessment closes in ${durationText(nowMs, aClose)}.`;
    if (aClose !== null) return `The assessment window closed ${durationText(aClose, nowMs)} ago.`;
    return null;
  })();

  return (
    <section className="cb-card" aria-labelledby="cb-timeline-h">
      <h2 id="cb-timeline-h">The cycle, laid out</h2>
      <p className="sub">A dozen date fields hide their own mistakes. This does not.</p>

      {model === null ? (
        <p className="cb-empty">
          Set the sampling and assessment dates above and the cycle draws itself here.
        </p>
      ) : (
        <>
          <div className="cb-tl" aria-hidden="true">
            <div className="cb-tl-plot">
              <div className="cb-tl-overlay">
                {model.overlap ? (
                  <div className="cb-tl-overlap" style={pos(model.overlap.leftPct, model.overlap.widthPct)}>
                    {model.overlap.widthPct > 14 ? <span>both open</span> : null}
                  </div>
                ) : null}
                {model.nowPct !== null ? (
                  <div className="cb-tl-now" style={pos(model.nowPct)}>
                    <span>now</span>
                  </div>
                ) : null}
              </div>

              <div className="cb-tl-lane">
                <span className="cb-tl-name">Sampling</span>
                <div className="cb-tl-track">
                  {model.sampling ? (
                    <div
                      className="cb-tl-bar is-sampling"
                      style={pos(model.sampling.leftPct, model.sampling.widthPct)}
                    />
                  ) : null}
                </div>
              </div>

              <div className="cb-tl-lane">
                <span className="cb-tl-name">Assessment</span>
                <div className="cb-tl-track">
                  {model.assessment ? (
                    <div
                      className="cb-tl-bar is-assessment"
                      style={pos(model.assessment.leftPct, model.assessment.widthPct)}
                    />
                  ) : null}
                  {model.pins.map((pin) => (
                    <span
                      key={pin.id}
                      className={pin.valid ? 'cb-pin' : 'cb-pin is-bad'}
                      style={pos(pin.leftPct)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="cb-tl-axis">
              <span className="cb-tl-name" />
              <div className="cb-tl-track">
                {model.ticks.map((tick, index) => (
                  <span
                    key={tick.atMs}
                    className="cb-tick"
                    style={{
                      ...pos(tick.leftPct),
                      transform:
                        index === 0
                          ? 'none'
                          : index === model.ticks.length - 1
                            ? 'translateX(-100%)'
                            : 'translateX(-50%)',
                    }}
                  >
                    {formatShortDate(fromInstant(tick.atMs, draft.timeZone))}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="cb-tl-legend" aria-hidden="true">
            <span><i className="cb-swatch is-sampling" />Sampling</span>
            <span><i className="cb-swatch is-assessment" />Assessment</span>
            <span><i className="cb-swatch is-overlap" />Both open</span>
            <span><i className="cb-swatch is-pin" />Reminder</span>
          </div>

          <div className="cb-tl-read">
            <p>
              Sampling runs {formatWallDateTime(draft.samplingOpens)} to{' '}
              {formatWallDateTime(draft.samplingCloses)}
              {samplingSpan ? `, ${samplingSpan}` : ''}.
            </p>
            <p>
              Assessment runs {formatWallDateTime(draft.assessmentOpens)} to{' '}
              {formatWallDateTime(draft.assessmentCloses)}
              {assessmentSpan ? `, ${assessmentSpan}` : ''}.
            </p>
            {model.overlap ? (
              <p className="cb-tl-overlap-note">
                Both windows are open together for{' '}
                <b>{durationText(model.overlap.fromMs, model.overlap.toMs)}</b>. That is intended:
                customers nominated after assessment has begun can still be sampled and still get a
                link. It is not an error and nothing below flags it as one.
              </p>
            ) : null}
            {lead ? <p className="cb-tl-lead">{lead}</p> : null}
            <p className="cb-tl-zone">All times read in {draft.timeZone}.</p>
          </div>
        </>
      )}
    </section>
  );
};
