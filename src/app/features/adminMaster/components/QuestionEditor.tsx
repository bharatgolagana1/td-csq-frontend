import type { FC } from 'react';
import type { CategoryCode, Direction, Question, RatingKey, Scope } from '../api/adminMaster.types';
import {
  CATEGORY_LABEL,
  DIRECTION_ORDER,
  CATEGORY_ORDER,
  CATEGORY_PREFIX,
  RATING_LABEL,
  RATING_ORDER,
  RATING_VAR,
  SCOPE_DIRECTIONS,
  SHORT_LABEL_MAX,
  bpToPct,
  effectiveBp,
} from '../adminMaster.logic';
import { CheckChip, NumberField, SelectField, TextAreaField, TextField } from './Fields';

const CATEGORY_OPTIONS = CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }));

const SCOPE_OPTIONS: Array<{ scope: Scope; label: string }> = [
  { scope: 'INTERNATIONAL', label: 'International (Export and Import)' },
  { scope: 'DOMESTIC', label: 'Domestic (Inbound and Outbound)' },
];

export interface QuestionEditorProps {
  value: Question;
  categoryBp: number;
  onChange: (next: Question) => void;
  onDone: () => void;
  onRemove: () => void;
}

export const QuestionEditor: FC<QuestionEditorProps> = ({
  value, categoryBp, onChange, onDone, onRemove,
}) => {
  const set = (patch: Partial<Question>) => onChange({ ...value, ...patch });

  // directions are offered as scope pairs, not as four boxes: one question is
  // rated once per direction, so half a pair is not a thing you should be able
  // to build in the first place
  const toggleScope = (scope: Scope, on: boolean) => {
    const pair = SCOPE_DIRECTIONS[scope];
    const kept = value.directions.filter((d) => !pair.includes(d));
    const next: Direction[] = on ? [...kept, ...pair] : kept;
    // keep a canonical order so an untouched question never reads as edited
    set({ directions: DIRECTION_ORDER.filter((d) => next.includes(d)) });
  };

  const toggleFollowUp = (key: RatingKey, on: boolean) => {
    set({
      revealFollowUpOn: on
        ? RATING_ORDER.filter((k) => k === key || value.revealFollowUpOn.includes(k))
        : value.revealFollowUpOn.filter((k) => k !== key),
    });
  };

  const labelLength = value.shortLabel.trim().length;

  return (
    <div className="am-edit">
      <div className="am-edit-grid">
        <TextField
          label="Code"
          value={value.code}
          mono
          onChange={(v) => set({ code: v.toUpperCase() })}
          invalid={/\d/.test(value.code)}
          hint={`Mnemonic, no numbering. For example ${CATEGORY_PREFIX[value.category]}-DOCK.`}
        />

        <SelectField<CategoryCode>
          label="Head"
          value={value.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => set({ category: v })}
          hint="Moving a question moves its weight with it."
        />

        <TextField
          label="Short label"
          value={value.shortLabel}
          maxLength={60}
          onChange={(v) => set({ shortLabel: v })}
          invalid={labelLength > SHORT_LABEL_MAX}
          hint={`${labelLength} of ${SHORT_LABEL_MAX} characters. This is what an assessor reads on a phone.`}
        />

        <NumberField
          label="Weight inside the head (bp)"
          value={value.weightBp}
          step={50}
          min={0}
          max={10000}
          onChange={(bp) => set({ weightBp: Math.max(0, Math.round(bp)) })}
          hint={`${bpToPct(value.weightBp)}% of the head, ${bpToPct(effectiveBp(categoryBp, value.weightBp))}% of the overall score.`}
        />

        <div className="am-edit-wide">
          <TextAreaField
            label="Question text"
            value={value.text}
            rows={2}
            onChange={(v) => set({ text: v })}
            hint="What the assessor is asked. No leading numbers: the form renders position."
          />
        </div>

        <div className="am-edit-wide am-field">
          <span className="am-lbl">Applies to</span>
          <div className="am-checks">
            {SCOPE_OPTIONS.map((o) => {
              const [a, b] = SCOPE_DIRECTIONS[o.scope];
              const on = value.directions.includes(a) && value.directions.includes(b);
              return (
                <CheckChip
                  key={o.scope}
                  label={o.label}
                  checked={on}
                  onChange={(checked) => toggleScope(o.scope, checked)}
                />
              );
            })}
          </div>
          <span className="am-hint">
            Each direction is rated separately. A terminal that handles both answers this question four times.
          </span>
        </div>

        <div className="am-edit-wide am-field">
          <span className="am-lbl">Reveals the follow up comment on</span>
          <div className="am-checks">
            {RATING_ORDER.map((k) => (
              <span key={k} style={{ color: RATING_VAR[k] }}>
                <CheckChip
                  label={RATING_LABEL[k]}
                  checked={value.revealFollowUpOn.includes(k)}
                  onChange={(checked) => toggleFollowUp(k, checked)}
                />
              </span>
            ))}
          </div>
          <span className="am-hint">
            Fair and Poor by default. A low rating without a reason is hard for an operator to act on.
          </span>
        </div>
      </div>

      <div className="am-edit-actions">
        <button type="button" className="am-btn am-btn--primary" onClick={onDone}>
          Done
        </button>
        <button type="button" className="am-btn am-btn--danger" onClick={onRemove}>
          Remove from draft
        </button>
        <span className="am-hint">
          Edits live in the draft until it is saved. The published instrument is untouched.
        </span>
      </div>
    </div>
  );
};
