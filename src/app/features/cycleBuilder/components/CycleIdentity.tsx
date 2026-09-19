import type { FC } from 'react';
import type { CycleDraft, FormScopeOption, ProgrammeOption } from '../api/cycleBuilder.types';
import type { EditPolicy, Issue } from '../lib/cycleRules';
import { directionLabel, issuesFor } from '../lib/cycleRules';
import { Field } from './Field';

export interface CycleIdentityProps {
  draft: CycleDraft;
  programmes: ProgrammeOption[];
  formScopes: FormScopeOption[];
  programme: ProgrammeOption | undefined;
  scope: FormScopeOption | undefined;
  policy: EditPolicy;
  issues: Issue[];
  onChange: (patch: Partial<CycleDraft>) => void;
}

const LOCK_NOTE = 'Fixed when the cycle was scheduled.';

export const CycleIdentity: FC<CycleIdentityProps> = ({
  draft,
  programmes,
  formScopes,
  programme,
  scope,
  policy,
  issues,
  onChange,
}) => {
  const scopeLocked = !policy.scope;

  return (
    <section className="cb-card" aria-labelledby="cb-identity-h">
      <h2 id="cb-identity-h">Cycle identity</h2>
      <p className="sub">What this cycle is, who it covers and how much of a sample it needs.</p>

      <div className="cb-two">
        <Field
          id="cb-name"
          label="Cycle name"
          help="Assessors see this in the invitation."
          issues={issuesFor(issues, 'name')}
          lockNote={policy.identity ? undefined : LOCK_NOTE}
        >
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              className="cb-input"
              type="text"
              value={draft.name}
              disabled={!policy.identity}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          )}
        </Field>

        <Field
          id="cb-programme"
          label="Programme"
          help={programme?.note}
          issues={issuesFor(issues, 'programmeId')}
          lockNote={scopeLocked ? LOCK_NOTE : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              className="cb-select"
              value={draft.programmeId}
              disabled={scopeLocked}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => onChange({ programmeId: e.target.value })}
            >
              <option value="">Choose a programme</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          )}
        </Field>

        <Field
          id="cb-scope"
          label="Form scope"
          help="Which instrument runs, and which terminals answer it."
          issues={issuesFor(issues, 'formScopeId')}
          lockNote={scopeLocked ? LOCK_NOTE : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              className="cb-select"
              value={draft.formScopeId}
              disabled={scopeLocked}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => onChange({ formScopeId: e.target.value })}
            >
              <option value="">Choose a form</option>
              {formScopes.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          )}
        </Field>

        <Field
          id="cb-minsample"
          label="Minimum sampling size"
          help={
            programme
              ? `Customers each terminal must nominate. ${programme.label} sets a floor of ${programme.minSamplingSize}.`
              : 'Customers each terminal must nominate.'
          }
          issues={issuesFor(issues, 'minSamplingSize')}
          lockNote={scopeLocked ? LOCK_NOTE : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              className="cb-input cb-input--num"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={draft.minSamplingSize ?? ''}
              disabled={scopeLocked}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const parsed = Number(raw);
                onChange({ minSamplingSize: raw === '' || Number.isNaN(parsed) ? null : Math.trunc(parsed) });
              }}
            />
          )}
        </Field>
      </div>

      {scope ? (
        <div className="cb-scope-note">
          <div className="cb-scope-heads">
            {scope.heads.map((head) => (
              <span key={head.code} className="cb-head-pill">
                {head.label} <b>{head.parameterCount}</b>
              </span>
            ))}
            <span className="cb-head-pill is-total">
              Total <b>{scope.parameterCount}</b>
            </span>
          </div>
          <p>
            Each parameter is answered twice, once per direction: {directionLabel(scope.terminalClass)}.
            One question, two ratings.
          </p>
          <p>
            Rated Excellent 5, Very Good 4, Good 3, Fair 2, Poor 1. NA is excluded from scoring
            entirely rather than counted as a middle value.
          </p>
        </div>
      ) : null}
    </section>
  );
};
