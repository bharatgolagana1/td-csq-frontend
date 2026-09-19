import type { FC, ReactNode } from 'react';
import type { Issue, IssueSeverity } from '../lib/cycleRules';

export interface FieldRenderArgs {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FieldProps {
  id: string;
  label: string;
  help?: string;
  issues: Issue[];
  /** why this field is frozen, shown when the cycle state locks it */
  lockNote?: string;
  children: (args: FieldRenderArgs) => ReactNode;
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { ERROR: 0, WARNING: 1, INFO: 2 };

export const FieldMessages: FC<{ id?: string; issues: Issue[] }> = ({ id, issues }) => {
  if (issues.length === 0) return null;
  const ordered = [...issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return (
    <ul className="cb-msgs" id={id}>
      {ordered.map((issue) => (
        <li key={issue.id} className={`cb-msg is-${issue.severity.toLowerCase()}`}>
          <span className="cb-msg-tag" aria-hidden="true" />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * Wires the label, the help text and the messages to the control by id. A
 * render prop rather than a wrapper so the aria attributes cannot drift from
 * the element they describe.
 */
export const Field: FC<FieldProps> = ({ id, label, help, issues, lockNote, children }) => {
  const helpId = help ? `${id}-help` : undefined;
  const msgId = issues.length > 0 ? `${id}-msg` : undefined;
  const describedBy = [helpId, msgId].filter((v): v is string => Boolean(v)).join(' ') || undefined;
  const invalid = issues.some((i) => i.severity === 'ERROR');

  return (
    <div className="cb-field">
      <label className="cb-label" htmlFor={id}>{label}</label>
      {help ? <p className="cb-help" id={helpId}>{help}</p> : null}
      {children({ id, describedBy, invalid })}
      <FieldMessages id={msgId} issues={issues} />
      {lockNote ? <p className="cb-lock">{lockNote}</p> : null}
    </div>
  );
};
