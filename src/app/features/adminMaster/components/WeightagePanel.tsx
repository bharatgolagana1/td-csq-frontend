import type { FC } from 'react';
import type { AssessorWeight, CategoryCode, InstrumentVersion } from '../api/adminMaster.types';
import {
  ASSESSOR_LABEL,
  BP_TOTAL,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  bpToPct,
  categoryBp,
  effectiveBp,
  formatBp,
  questionsIn,
  sumBp,
} from '../adminMaster.logic';
import { AllocationBar } from './AllocationBar';
import { NumberField } from './Fields';
import { SaveBar } from './SaveBar';

/** Scale a set of weights onto 10,000 bp, giving the rounding remainder to the largest. */
function normalise(values: number[]): number[] {
  const total = sumBp(values);
  if (values.length === 0) return values;
  if (total <= 0) {
    const each = Math.floor(BP_TOTAL / values.length);
    return values.map((_, i) => (i === 0 ? BP_TOTAL - each * (values.length - 1) : each));
  }
  const scaled = values.map((v) => Math.floor((v * BP_TOTAL) / total));
  const drift = BP_TOTAL - sumBp(scaled);
  let biggest = 0;
  scaled.forEach((v, i) => {
    if (v > scaled[biggest]) biggest = i;
  });
  scaled[biggest] += drift;
  return scaled;
}

export interface WeightagePanelProps {
  draft: InstrumentVersion;
  onChangeDraft: (next: InstrumentVersion) => void;
  assessorWeights: AssessorWeight[];
  onChangeAssessorWeights: (next: AssessorWeight[]) => void;
  unsettledAirports: number;
  onGoToOperators: () => void;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

export const WeightagePanel: FC<WeightagePanelProps> = ({
  draft, onChangeDraft, assessorWeights, onChangeAssessorWeights,
  unsettledAirports, onGoToOperators,
  dirty, saving, error, savedAt, onSave, onDiscard,
}) => {
  const setCategoryBp = (code: CategoryCode, bp: number) => {
    onChangeDraft({
      ...draft,
      categories: draft.categories.map((c) => (c.code === code ? { ...c, weightBp: Math.max(0, Math.round(bp)) } : c)),
    });
  };

  const setQuestionBp = (id: string, bp: number) => {
    onChangeDraft({
      ...draft,
      questions: draft.questions.map((q) => (q.id === id ? { ...q, weightBp: Math.max(0, Math.round(bp)) } : q)),
    });
  };

  const normaliseCategory = (code: CategoryCode) => {
    const qs = questionsIn(draft, code);
    const next = normalise(qs.map((q) => q.weightBp));
    const byId = new Map(qs.map((q, i) => [q.id, next[i]]));
    onChangeDraft({
      ...draft,
      questions: draft.questions.map((q) => (byId.has(q.id) ? { ...q, weightBp: byId.get(q.id) as number } : q)),
    });
  };

  const categorySum = sumBp(draft.categories.map((c) => c.weightBp));
  const assessorSum = sumBp(assessorWeights.map((w) => w.weightBp));

  return (
    <>
      <section className="am-card" aria-labelledby="am-mix-h">
        <h2 id="am-mix-h">Assessor mix</h2>
        <p className="sub">
          How the three kinds of assessment combine into one published rating.
        </p>

        {assessorWeights.map((w) => (
          <div className="am-w-row" key={w.kind}>
            <div>
              <div className="am-w-name">{ASSESSOR_LABEL[w.kind]}</div>
              <div className="am-w-sub">{w.note}</div>
            </div>
            {w.locked ? (
              <div className="am-w-locked">Fixed at zero</div>
            ) : (
              <NumberField
                label={`${ASSESSOR_LABEL[w.kind]} weight in basis points`}
                hideLabel
                value={w.weightBp}
                step={100}
                min={0}
                max={BP_TOTAL}
                onChange={(bp) =>
                  onChangeAssessorWeights(
                    assessorWeights.map((x) => (x.kind === w.kind ? { ...x, weightBp: Math.max(0, Math.round(bp)) } : x)),
                  )
                }
              />
            )}
            <div className="am-w-pct">{bpToPct(w.weightBp)}%</div>
            <div className="am-meter">
              <span style={{ width: `${(w.weightBp / BP_TOTAL) * 100}%` }} />
            </div>
          </div>
        ))}

        <AllocationBar
          noun="assessor mix"
          segments={assessorWeights
            .filter((w) => !w.locked)
            .map((w) => ({ id: w.kind, label: ASSESSOR_LABEL[w.kind], bp: w.weightBp }))}
          onSettle={(id, deltaBp) =>
            onChangeAssessorWeights(
              assessorWeights.map((x) =>
                x.kind === id ? { ...x, weightBp: Math.max(0, x.weightBp + deltaBp) } : x,
              ),
            )
          }
        />

        {assessorSum !== BP_TOTAL && (
          <p className="am-note">
            The mix has to come to {formatBp(BP_TOTAL)} bp before the draft instrument can be published.
          </p>
        )}
      </section>

      <section className="am-card" aria-labelledby="am-cat-h">
        <div className="am-card-head">
          <div>
            <h2 id="am-cat-h">Head weights</h2>
            <p className="sub">
              What each of the four heads is worth in the overall score. Versioned with the instrument,
              so changing one is a change to draft {draft.label}.
            </p>
          </div>
          <button
            type="button"
            className="am-btn am-btn--sm"
            disabled={categorySum === BP_TOTAL}
            onClick={() => {
              const next = normalise(draft.categories.map((c) => c.weightBp));
              onChangeDraft({
                ...draft,
                categories: draft.categories.map((c, i) => ({ ...c, weightBp: next[i] })),
              });
            }}
          >
            Scale to {formatBp(BP_TOTAL)} bp
          </button>
        </div>

        {CATEGORY_ORDER.map((code) => {
          const bp = categoryBp(draft, code);
          const count = questionsIn(draft, code).length;
          return (
            <div className="am-w-row" key={code}>
              <div>
                <div className="am-w-name">{CATEGORY_LABEL[code]}</div>
                <div className="am-w-sub">{count} parameters</div>
              </div>
              <NumberField
                label={`${CATEGORY_LABEL[code]} weight in basis points`}
                hideLabel
                value={bp}
                step={100}
                min={0}
                max={BP_TOTAL}
                onChange={(v) => setCategoryBp(code, v)}
              />
              <div className="am-w-pct">{bpToPct(bp)}%</div>
              <div className="am-meter">
                <span style={{ width: `${(bp / BP_TOTAL) * 100}%` }} />
              </div>
            </div>
          );
        })}

        <AllocationBar
          noun="overall score"
          segments={draft.categories.map((c) => ({ id: c.code, label: CATEGORY_LABEL[c.code], bp: c.weightBp }))}
          onSettle={(id, deltaBp) => setCategoryBp(id as CategoryCode, categoryBp(draft, id as CategoryCode) + deltaBp)}
        />
      </section>

      <section className="am-card" aria-labelledby="am-qw-h">
        <h2 id="am-qw-h">Question weights</h2>
        <p className="sub">
          Each question carries a weight inside its own head. Effective weight is the head multiplied by
          the question, which is what a rating actually moves.
        </p>

        {CATEGORY_ORDER.map((code) => {
          const qs = questionsIn(draft, code);
          const sum = sumBp(qs.map((q) => q.weightBp));
          const catBp = categoryBp(draft, code);
          return (
            <div className="am-airport" key={code}>
              <div className="am-airport-top">
                <h3>{CATEGORY_LABEL[code]}</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={sum === BP_TOTAL ? 'am-qsum' : 'am-qsum am-qsum--bad'}>
                    {formatBp(sum)} of {formatBp(BP_TOTAL)} bp
                  </span>
                  <button
                    type="button"
                    className="am-btn am-btn--sm"
                    disabled={sum === BP_TOTAL || qs.length === 0}
                    onClick={() => normaliseCategory(code)}
                  >
                    Scale to {formatBp(BP_TOTAL)} bp
                  </button>
                </div>
              </div>

              {qs.map((q) => (
                <div className="am-share-row" key={q.id}>
                  <div>
                    <div className="am-op-name">{q.shortLabel || 'Untitled parameter'}</div>
                    <div className="am-op-sub">
                      <span className="am-code">{q.code || 'no code'}</span> · {bpToPct(effectiveBp(catBp, q.weightBp))}% of the overall score
                    </div>
                  </div>
                  <NumberField
                    label={`Weight for ${q.shortLabel || q.code} in basis points`}
                    hideLabel
                    value={q.weightBp}
                    step={50}
                    min={0}
                    max={BP_TOTAL}
                    onChange={(bp) => setQuestionBp(q.id, bp)}
                  />
                  <span className="am-bp">{bpToPct(q.weightBp)}% of head</span>
                </div>
              ))}
            </div>
          );
        })}
      </section>

      <section className="am-card" aria-labelledby="am-ms-h">
        <h2 id="am-ms-h">Market share</h2>
        <p className="sub">
          Weighting stops at the terminal. Market share is what turns several terminal ratings at one
          airport into a single airport figure, so it is entered against the operators themselves.
        </p>
        <div className="am-edit-actions">
          <button type="button" className="am-btn" onClick={onGoToOperators}>
            Open market share
          </button>
          {unsettledAirports > 0 ? (
            <span className="am-blocked">
              {unsettledAirports} airport{unsettledAirports === 1 ? '' : 's'} do not come to 100% yet
            </span>
          ) : (
            <span className="am-ok">Every airport comes to 100%.</span>
          )}
        </div>
      </section>

      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        savedAt={savedAt}
        summary={`Draft ${draft.label} has unsaved weighting.`}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </>
  );
};
