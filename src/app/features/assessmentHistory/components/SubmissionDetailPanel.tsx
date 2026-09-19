import { useCallback, useEffect, useMemo, useRef, useState, type FC, type KeyboardEvent } from 'react';
import Orbis from '../../../shared/orbis/Orbis';
import { fetchSubmissionDetail } from '../api/history.mock';
import type { SubmissionDetail } from '../api/history.types';
import { ASSESSOR_TYPE_LABEL, CATEGORY_LABEL, DIRECTION_LABEL, formatDayTime } from '../lib/labels';
import { bandLabel, scoreColour } from '../lib/scoring';
import { exportAnswers } from '../lib/exportCsv';
import { KindPill, RatingTag } from './Pills';
import StateCard from './StateCard';

interface Props {
  submissionId: string;
  canExport: boolean;
  onClose: () => void;
}

/**
 * A slide over rather than a route: the operator is comparing one response
 * against the list and loses their place if the table unmounts.
 */
export const SubmissionDetailPanel: FC<Props> = ({ submissionId, canExport, onClose }) => {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    setDetail(null);
    setFailed(false);
    fetchSubmissionDetail(submissionId)
      .then((d) => {
        if (live) setDetail(d);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [submissionId, attempt]);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      // a slide over that lets focus wander behind it is a trap of a different kind
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], select, input, summary, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const grouped = useMemo(() => {
    if (!detail) return [];
    return detail.categoryScores.map((cat) => ({
      ...cat,
      parameters: detail.parameters.filter((p) => p.category === cat.code),
    }));
  }, [detail]);

  return (
    <>
      <div className="csqh-backdrop" aria-hidden="true" onClick={onClose} />
      <div
        className="csqh-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csqh-panel-title"
        ref={panelRef}
        onKeyDown={onKeyDown}
      >
        <div className="csqh-panel-head">
          <div>
            <div className="csqh-eyebrow" style={{ marginBottom: 4 }}>
              Assessment
            </div>
            <h2 id="csqh-panel-title" style={{ fontFamily: 'var(--csq-mono)' }}>
              {submissionId}
            </h2>
          </div>
          <button
            type="button"
            className="csqh-close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close assessment detail"
          >
            ×
          </button>
        </div>

        <div className="csqh-panel-body">
          {failed ? (
            <StateCard
              title="That assessment did not load"
              body="The connection dropped or the response is no longer available. Try again, and if it keeps failing the assessment id above is what ACFI will need."
              action={
                <button type="button" className="csqh-btn" onClick={() => setAttempt((a) => a + 1)}>
                  Try again
                </button>
              }
            />
          ) : !detail ? (
            <div className="csqh-loadpad">
              <Orbis label="Loading the response" />
            </div>
          ) : (
            <>
              <div className="csqh-kv">
                <div>
                  <div className="csqh-stat-k">Assessor</div>
                  <div style={{ margin: '6px 0 4px' }}>
                    <KindPill kind={detail.assessorKind} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{detail.respondent.reference}</div>
                  <div className="csqh-tiny">{ASSESSOR_TYPE_LABEL[detail.respondent.type]}</div>
                </div>
                <div>
                  <div className="csqh-stat-k">Submitted</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>{formatDayTime(detail.submittedAt)}</div>
                  <div className="csqh-tiny">{detail.cycleLabel}</div>
                </div>
                <div>
                  <div className="csqh-stat-k">Score</div>
                  <div className="csqh-stat-v" style={{ color: scoreColour(detail.score) }}>
                    {detail.score === null ? 'n/a' : detail.score.toFixed(1)}
                  </div>
                  <div className="csqh-tiny">
                    {detail.score === null ? 'not scored' : bandLabel(detail.score)}
                  </div>
                </div>
              </div>

              {detail.status === 'IN_PROGRESS' ? (
                <StateCard
                  title="This response has not been submitted"
                  body="Answers become visible once the assessor submits. A part finished response is not shown, because a rating the assessor has not stood behind is not something to read anything into."
                />
              ) : (
                <>
                  <div className="csqh-dirscores">
                    {detail.directionScores.map((d) => (
                      <div className="csqh-dirscore" key={d.direction}>
                        <div className="csqh-stat-k">{DIRECTION_LABEL[d.direction]}</div>
                        <div className="csqh-stat-v" style={{ color: scoreColour(d.score) }}>
                          {d.score === null ? 'n/a' : d.score.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="csqh-sec-hd">
                    <span>By head</span>
                  </div>
                  {detail.categoryScores.map((c) => (
                    <div className="csqh-catline" key={c.code}>
                      <span>
                        {CATEGORY_LABEL[c.code]}{' '}
                        <span className="csqh-tiny">· {c.parameterCount} parameters</span>
                      </span>
                      <span
                        className="csqh-num"
                        style={{ fontWeight: 800, color: scoreColour(c.score) }}
                      >
                        {c.score === null ? 'n/a' : c.score.toFixed(1)}
                      </span>
                    </div>
                  ))}

                  {canExport ? (
                    <button
                      type="button"
                      className="csqh-btn csqh-btn--sm"
                      style={{ marginTop: 16 }}
                      onClick={() => exportAnswers(detail)}
                    >
                      Export these answers (CSV)
                    </button>
                  ) : null}

                  {grouped.map((group) => (
                    <div className="csqh-sec" key={group.code}>
                      <div className="csqh-sec-hd">
                        <span>{CATEGORY_LABEL[group.code]}</span>
                        <span>{group.parameters.length} parameters</span>
                      </div>
                      {group.parameters.map((p) => (
                        <div className="csqh-param" key={p.parameterNo}>
                          <div className="csqh-param-q">
                            <span className="csqh-param-no">
                              {String(p.parameterNo).padStart(2, '0')}
                            </span>
                            <span>{p.question}</span>
                          </div>
                          <div className="csqh-dirs">
                            {p.answers.map((a) => (
                              <div className="csqh-dir" key={a.direction}>
                                <div className="csqh-dir-k">{DIRECTION_LABEL[a.direction]}</div>
                                <RatingTag rating={a.rating} />
                                {a.comment ? <p className="csqh-dir-c">{a.comment}</p> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SubmissionDetailPanel;
