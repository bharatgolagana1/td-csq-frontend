import type { FC } from 'react';
import type { InstrumentVersion, Question, VersionDiff } from '../api/adminMaster.types';
import {
  CATEGORY_LABEL,
  bpToPct,
  diffIsEmpty,
  directionSummary,
  followUpSummary,
  formatBp,
} from '../adminMaster.logic';

const QuestionLine: FC<{ q: Question }> = ({ q }) => (
  <div>
    <span className="am-code">{q.code}</span>{' '}
    <b style={{ fontSize: 13.5 }}>{q.shortLabel}</b>
    <div className="am-q-text">{q.text}</div>
    <div className="am-q-meta">
      <span className="am-chip">{CATEGORY_LABEL[q.category]}</span>
      <span className="am-chip">{directionSummary(q.directions)}</span>
      <span className="am-chip">{formatBp(q.weightBp)} bp</span>
      <span className="am-chip">follow up on {followUpSummary(q.revealFollowUpOn)}</span>
    </div>
  </div>
);

export interface DiffPanelProps {
  diff: VersionDiff;
  live: InstrumentVersion;
  draft: InstrumentVersion;
  onRestore: (q: Question) => void;
}

export const DiffPanel: FC<DiffPanelProps> = ({ diff, live, draft, onRestore }) => {
  if (diffIsEmpty(diff)) {
    return (
      <div className="am-empty">
        <b>Draft {draft.label} matches live {live.label}</b>
        Nothing to publish. Edit the draft and the changes are listed here.
      </div>
    );
  }

  return (
    <>
      <p className="sub">
        Draft {draft.label} against live {live.label}. This is what publishing would change.
      </p>

      {diff.categoryChanges.length > 0 && (
        <div className="am-diff-grp">
          <h3>Head weights changed ({diff.categoryChanges.length})</h3>
          {diff.categoryChanges.map((c) => (
            <div className="am-diff-item" key={c.code}>
              <b style={{ fontSize: 13.5 }}>{c.label}</b>
              <div className="am-diff-field">
                <span className="am-lbl">Weight</span>
                <span>
                  <span className="am-was">{bpToPct(c.beforeBp)}%</span>{' '}
                  <span className="am-now">{bpToPct(c.afterBp)}%</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {diff.added.length > 0 && (
        <div className="am-diff-grp">
          <h3>Added ({diff.added.length})</h3>
          {diff.added.map((q) => (
            <div className="am-diff-item" key={q.id} style={{ borderLeft: '3px solid var(--csq-r5)' }}>
              <QuestionLine q={q} />
            </div>
          ))}
        </div>
      )}

      {diff.removed.length > 0 && (
        <div className="am-diff-grp">
          <h3>Removed ({diff.removed.length})</h3>
          {diff.removed.map((q) => (
            <div className="am-diff-item" key={q.id} style={{ borderLeft: '3px solid var(--csq-r1)' }}>
              <QuestionLine q={q} />
              <div className="am-edit-actions">
                <button type="button" className="am-btn am-btn--sm" onClick={() => onRestore(q)}>
                  Put back in the draft
                </button>
                <span className="am-hint">
                  Ratings already collected against {q.code} stay on the cycles that used them.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {diff.changed.length > 0 && (
        <div className="am-diff-grp">
          <h3>Changed ({diff.changed.length})</h3>
          {diff.changed.map(({ after, fields }) => (
            <div className="am-diff-item" key={after.id} style={{ borderLeft: '3px solid var(--csq-r2)' }}>
              <div>
                <span className="am-code">{after.code}</span>{' '}
                <b style={{ fontSize: 13.5 }}>{after.shortLabel}</b>
              </div>
              <div style={{ marginTop: 8 }}>
                {fields.map((f) => (
                  <div className="am-diff-field" key={f.label}>
                    <span className="am-lbl">{f.label}</span>
                    <span>
                      <span className="am-was">{f.before}</span>
                      <br />
                      <span className="am-now">{f.after}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
