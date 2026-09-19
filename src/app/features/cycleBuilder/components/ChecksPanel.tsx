import type { FC } from 'react';
import type { Issue, IssueSeverity } from '../lib/cycleRules';
import { FieldMessages } from './Field';

const GROUPS: Array<{ severity: IssueSeverity; heading: string; note: string }> = [
  { severity: 'ERROR', heading: 'Must be fixed', note: 'The cycle cannot be scheduled while any of these stand.' },
  { severity: 'WARNING', heading: 'Worth a second look', note: 'None of these block scheduling.' },
  { severity: 'INFO', heading: 'Deliberate, not a problem', note: '' },
];

export const ChecksPanel: FC<{ issues: Issue[] }> = ({ issues }) => {
  const errorCount = issues.filter((i) => i.severity === 'ERROR').length;

  return (
    <section className="cb-card" aria-labelledby="cb-checks-h">
      <h2 id="cb-checks-h">Checks</h2>
      <p className="sub">Run on every keystroke, so nothing is discovered at the moment you press schedule.</p>

      <div aria-live="polite" className="cb-checks">
        {issues.length === 0 ? (
          <p className="cb-allclear">Everything checks out. Nothing is blocking this cycle.</p>
        ) : (
          GROUPS.map((group) => {
            const matched = issues.filter((i) => i.severity === group.severity);
            if (matched.length === 0) return null;
            return (
              <div className="cb-check-group" key={group.severity}>
                <h3 className={`cb-check-h is-${group.severity.toLowerCase()}`}>
                  {group.heading}
                  <span className="cb-count">{matched.length}</span>
                </h3>
                {group.note ? <p className="cb-check-note">{group.note}</p> : null}
                <FieldMessages issues={matched} />
              </div>
            );
          })
        )}
      </div>

      {errorCount === 0 ? null : (
        <p className="cb-check-foot">
          {errorCount === 1 ? '1 thing' : `${errorCount} things`} to settle before this cycle can be
          scheduled.
        </p>
      )}
    </section>
  );
};
