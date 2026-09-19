import { useMemo, useState, type FC } from 'react';
import type {
  CategoryCode,
  InstrumentVersion,
  Question,
  ValidationIssue,
} from '../api/adminMaster.types';
import {
  BP_TOTAL,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  RATING_LABEL,
  RATING_VAR,
  bpToPct,
  categoryBp,
  countForScope,
  diffVersions,
  directionSummary,
  formatBp,
  formatDate,
  questionsIn,
  sumBp,
} from '../adminMaster.logic';
import { DiffPanel } from './DiffPanel';
import { PublishGate } from './PublishGate';
import { QuestionEditor } from './QuestionEditor';
import { SaveBar } from './SaveBar';

type View = 'DRAFT' | 'LIVE' | 'DIFF';

export interface QuestionBankPanelProps {
  live: InstrumentVersion;
  draft: InstrumentVersion;
  issues: ValidationIssue[];
  onChangeDraft: (next: InstrumentVersion) => void;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  onSave: () => void;
  onDiscard: () => void;
  publishing: boolean;
  publishError: string | null;
  onPublish: () => void;
  openCycle: { label: string; assessmentStarted: boolean };
}

export const QuestionBankPanel: FC<QuestionBankPanelProps> = ({
  live, draft, issues, onChangeDraft,
  dirty, saving, error, savedAt, onSave, onDiscard,
  publishing, publishError, onPublish, openCycle,
}) => {
  const [view, setView] = useState<View>('DRAFT');
  const [editingId, setEditingId] = useState<string | null>(null);

  const diff = useMemo(() => diffVersions(live, draft), [live, draft]);

  const changedIds = useMemo(() => new Set(diff.changed.map((c) => c.after.id)), [diff]);
  const addedIds = useMemo(() => new Set(diff.added.map((q) => q.id)), [diff]);
  const issuesByQuestion = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    issues.forEach((i) => {
      if (!i.questionId) return;
      const list = map.get(i.questionId) ?? [];
      list.push(i);
      map.set(i.questionId, list);
    });
    return map;
  }, [issues]);

  const version = view === 'LIVE' ? live : draft;
  const readOnly = view === 'LIVE';

  const replaceQuestion = (next: Question) => {
    onChangeDraft({ ...draft, questions: draft.questions.map((q) => (q.id === next.id ? next : q)) });
  };

  const removeQuestion = (id: string) => {
    onChangeDraft({ ...draft, questions: draft.questions.filter((q) => q.id !== id) });
    setEditingId(null);
  };

  /** keep a restored or new question beside its own head rather than at the end of the bank */
  const insertQuestion = (q: Question) => {
    const questions = [...draft.questions];
    let at = questions.length;
    for (let i = questions.length - 1; i >= 0; i -= 1) {
      if (questions[i].category === q.category) {
        at = i + 1;
        break;
      }
    }
    questions.splice(at, 0, q);
    onChangeDraft({ ...draft, questions });
  };

  const addQuestion = (category: CategoryCode) => {
    const q: Question = {
      id: `q-new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      code: '',
      category,
      text: '',
      shortLabel: '',
      directions: ['EXPORT', 'IMPORT', 'INBOUND', 'OUTBOUND'],
      weightBp: 0,
      revealFollowUpOn: ['FAIR', 'POOR'],
    };
    insertQuestion(q);
    setView('DRAFT');
    setEditingId(q.id);
  };

  const focusIssue = (issue: ValidationIssue) => {
    setView('DRAFT');
    if (issue.questionId) setEditingId(issue.questionId);
    const id = issue.questionId
      ? `am-q-${issue.questionId}`
      : issue.categoryCode
        ? `am-head-${issue.categoryCode}`
        : null;
    if (!id) return;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  return (
    <>
      <section className="am-card" aria-labelledby="am-bank-h">
        <div className="am-card-head">
          <div>
            <h2 id="am-bank-h">Question bank</h2>
            <p className="sub">
              The Phase 1 instrument. Every question is rated once per direction, so a terminal on both
              scopes answers each of these four times.
            </p>
          </div>
        </div>

        <div className="am-vers">
          <div className="am-ver">
            <div className="am-ver-label">
              {live.label} <span className="am-tag am-tag--active"><i />Live</span>
            </div>
            <div className="am-ver-meta">
              Published {formatDate(live.publishedOn)} by {live.updatedBy}
              <br />
              {live.questions.length} parameters · {countForScope(live, 'INTERNATIONAL')} international ·{' '}
              {countForScope(live, 'DOMESTIC')} domestic
            </div>
          </div>
          <div className="am-ver am-ver--draft">
            <div className="am-ver-label">
              {draft.label} <span className="am-tag"><i />Draft</span>
            </div>
            <div className="am-ver-meta">
              Edited {formatDate(draft.updatedOn)} by {draft.updatedBy}
              <br />
              {draft.questions.length} parameters · {diff.added.length} added · {diff.changed.length} changed ·{' '}
              {diff.removed.length} removed
            </div>
          </div>
        </div>

        <div className="am-filters">
          <div className="am-seg" role="group" aria-label="Which version to show">
            <button type="button" aria-pressed={view === 'DRAFT'} onClick={() => setView('DRAFT')}>
              Draft {draft.label}
            </button>
            <button type="button" aria-pressed={view === 'LIVE'} onClick={() => setView('LIVE')}>
              Live {live.label}
            </button>
            <button type="button" aria-pressed={view === 'DIFF'} onClick={() => setView('DIFF')}>
              Changes
            </button>
          </div>
          {readOnly && (
            <span className="am-hint">
              A published version is never edited in place. Edit the draft.
            </span>
          )}
        </div>

        {view === 'DIFF' ? (
          <DiffPanel diff={diff} live={live} draft={draft} onRestore={(q) => { insertQuestion(q); setView('DRAFT'); }} />
        ) : (
          CATEGORY_ORDER.map((code) => {
            const qs = questionsIn(version, code);
            const sum = sumBp(qs.map((q) => q.weightBp));
            const catBp = categoryBp(version, code);
            return (
              <div key={code}>
                <div className="am-qhead" id={`am-head-${code}`}>
                  <h3>
                    {CATEGORY_LABEL[code]}{' '}
                    <span className="am-chip" style={{ marginLeft: 6 }}>{qs.length}</span>
                  </h3>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="am-qsum">Head weight {bpToPct(catBp)}%</span>
                    <span className={sum === BP_TOTAL ? 'am-qsum' : 'am-qsum am-qsum--bad'}>
                      Questions {formatBp(sum)} of {formatBp(BP_TOTAL)} bp
                    </span>
                    {!readOnly && (
                      <button type="button" className="am-btn am-btn--sm" onClick={() => addQuestion(code)}>
                        Add question
                      </button>
                    )}
                  </div>
                </div>

                {qs.length === 0 && (
                  <div className="am-empty">
                    <b>No parameters under this head</b>
                    A head with no questions cannot be scored.
                  </div>
                )}

                {qs.map((q) => {
                  const qIssues = issuesByQuestion.get(q.id) ?? [];
                  const blocking = qIssues.some((i) => i.severity === 'BLOCKING');
                  const badge = !readOnly && addedIds.has(q.id)
                    ? 'am-q am-q--added'
                    : !readOnly && changedIds.has(q.id)
                      ? 'am-q am-q--changed'
                      : 'am-q';
                  return (
                    <article
                      className={blocking && !readOnly ? `${badge} am-q--flagged` : badge}
                      key={q.id}
                      id={`am-q-${q.id}`}
                    >
                      <div className="am-q-top">
                        <div>
                          <span className="am-code">{q.code || 'no code'}</span>
                          <div className="am-q-meta" style={{ marginTop: 6 }}>
                            <span className="am-chip">{formatBp(q.weightBp)} bp</span>
                          </div>
                        </div>

                        <div>
                          <div className="am-q-label">
                            {q.shortLabel || 'Untitled parameter'}
                            {!readOnly && addedIds.has(q.id) && (
                              <span className="am-chip" style={{ marginLeft: 8, color: 'var(--csq-r5)' }}>Added</span>
                            )}
                            {!readOnly && changedIds.has(q.id) && (
                              <span className="am-chip" style={{ marginLeft: 8, color: 'var(--csq-r2)' }}>Changed</span>
                            )}
                          </div>
                          <div className="am-q-text">{q.text || 'No question text yet.'}</div>
                          <div className="am-q-meta">
                            <span className="am-chip">{directionSummary(q.directions)}</span>
                            {q.revealFollowUpOn.length === 0 ? (
                              <span className="am-chip">no follow up</span>
                            ) : (
                              q.revealFollowUpOn.map((k) => (
                                <span className="am-chip" key={k} style={{ color: RATING_VAR[k] }}>
                                  {RATING_LABEL[k]} asks why
                                </span>
                              ))
                            )}
                          </div>
                          {qIssues.map((i) => (
                            <div
                              className={i.severity === 'BLOCKING' ? 'am-q-issue' : 'am-q-issue am-q-issue--advisory'}
                              key={i.id}
                            >
                              <span aria-hidden="true">!</span>
                              <span>{i.message}</span>
                            </div>
                          ))}
                        </div>

                        <div className="am-q-actions">
                          {!readOnly && (
                            <button
                              type="button"
                              className="am-btn am-btn--sm"
                              aria-expanded={editingId === q.id}
                              aria-controls={`am-qe-${q.id}`}
                              onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                            >
                              {editingId === q.id ? 'Close' : 'Edit'}
                            </button>
                          )}
                        </div>
                      </div>

                      {!readOnly && editingId === q.id && (
                        <div id={`am-qe-${q.id}`}>
                          <QuestionEditor
                            value={q}
                            categoryBp={catBp}
                            onChange={replaceQuestion}
                            onDone={() => setEditingId(null)}
                            onRemove={() => removeQuestion(q.id)}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            );
          })
        )}
      </section>

      <PublishGate
        draft={draft}
        issues={issues}
        dirty={dirty}
        publishing={publishing}
        error={publishError}
        openCycle={openCycle}
        onPublish={onPublish}
        onFocusIssue={focusIssue}
      />

      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        savedAt={savedAt}
        summary={`Draft ${draft.label} has unsaved edits.`}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </>
  );
};
