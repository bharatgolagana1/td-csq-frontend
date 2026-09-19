import { useState, type FC } from 'react';
import type { InstrumentVersion, ValidationIssue } from '../api/adminMaster.types';
import Orbis from '../../../shared/orbis/Orbis';
import { blockingOf } from '../adminMaster.logic';

export interface PublishGateProps {
  draft: InstrumentVersion;
  issues: ValidationIssue[];
  dirty: boolean;
  publishing: boolean;
  error: string | null;
  openCycle: { label: string; assessmentStarted: boolean };
  onPublish: () => void;
  /** jump the reader to the question an issue is about */
  onFocusIssue: (issue: ValidationIssue) => void;
}

export const PublishGate: FC<PublishGateProps> = ({
  draft, issues, dirty, publishing, error, openCycle, onPublish, onFocusIssue,
}) => {
  const [confirming, setConfirming] = useState(false);
  const blocking = blockingOf(issues);
  const advisory = issues.filter((i) => i.severity === 'ADVISORY');
  const canPublish = blocking.length === 0 && !dirty && !publishing;

  return (
    <section className="am-card" aria-labelledby="am-gate-h">
      <h2 id="am-gate-h">Publish {draft.label}</h2>
      <p className="sub">
        Publishing freezes this draft and forks the next one. Cycles that have already opened keep the
        version they started with, so a past score stays explainable.
      </p>

      <div className="am-gate">
        <div>
          {issues.length === 0 ? (
            <p className="am-ok">Every check passes.</p>
          ) : (
            <>
              {blocking.map((i) => (
                <div className="am-issue" key={i.id}>
                  <span className="am-issue-dot" style={{ background: 'var(--csq-r1)' }} />
                  <span>
                    {i.message}{' '}
                    {i.questionId || i.categoryCode ? (
                      <button type="button" onClick={() => onFocusIssue(i)}>
                        Show it
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
              {advisory.map((i) => (
                <div className="am-issue" key={i.id}>
                  <span className="am-issue-dot" style={{ background: 'var(--csq-r2)' }} />
                  <span>
                    {i.message}{' '}
                    {i.questionId || i.categoryCode ? (
                      <button type="button" onClick={() => onFocusIssue(i)}>
                        Show it
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="am-gate-side">
          <p>
            {blocking.length > 0
              ? `${blocking.length} ${blocking.length === 1 ? 'thing has' : 'things have'} to be fixed before this draft can go live.`
              : dirty
                ? 'Save the draft before publishing it.'
                : advisory.length > 0
                  ? `${advisory.length} advisory ${advisory.length === 1 ? 'note' : 'notes'}, none of them blocking.`
                  : 'Ready to publish.'}
          </p>

          {openCycle.assessmentStarted && (
            <p>
              {openCycle.label} is open and assessors are answering. It stays on the version it started
              with and is not affected by this publish.
            </p>
          )}

          {error && <p className="am-msg am-msg--bad">{error}</p>}

          {publishing ? (
            <Orbis size={8} label="Publishing" />
          ) : confirming ? (
            <div className="am-edit-actions">
              <button type="button" className="am-btn am-btn--primary" onClick={onPublish}>
                Yes, publish {draft.label}
              </button>
              <button type="button" className="am-btn am-btn--quiet" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="am-btn am-btn--primary"
              disabled={!canPublish}
              onClick={() => setConfirming(true)}
            >
              Publish {draft.label}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
