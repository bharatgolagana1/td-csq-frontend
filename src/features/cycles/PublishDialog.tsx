import { Link } from 'react-router-dom';

import { Icon } from '@/design/icons';
import { Button, Dialog } from '@/design/primitives';
import { useShell } from '@/shell/ShellContext';

import { type BuilderStepId } from './builderSchema';
import styles from './cycles.module.css';
import { type PublishProblem } from './publishProblems';

export type PublishDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  code: string;
  name: string;
  airports: number;
  operators: number;
  /** 412 problems from the last attempt; empty before the first try. */
  problems: PublishProblem[];
  /** Jump to a builder step that can fix a problem (omitted on the detail page). */
  onFixStep?: (step: BuilderStepId) => void;
};

/**
 * Confirm before publishing; after a refused attempt the same dialog lists the
 * preconditions that failed, each with a link to where it is fixed.
 */
export function PublishDialog({ open, onClose, onConfirm, loading, code, name, airports, operators, problems, onFixStep }: PublishDialogProps) {
  const { href } = useShell();
  const refused = problems.length > 0;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={refused ? 'Not published yet' : `Publish ${code}?`}
      description={
        refused
          ? 'The server refused the publish. Fix the items below and try again; the draft is saved.'
          : `${name} · ${airports} airports · ${operators} operators`
      }
      dismissible={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {refused ? 'Close' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={loading} data-autofocus={!refused}>
            {refused ? 'Try again' : 'Publish'}
          </Button>
        </>
      }
    >
      {refused ? (
        <ul className={styles.problemList} aria-label="Publish problems">
          {problems.map((p, i) => (
            <li key={`${p.kind}-${i}`} className={styles.problemItem}>
              <span className={styles.problemText}>
                <Icon name="warning" size={16} />
                <span>{p.message}</span>
              </span>
              {p.fixPath ? (
                <Link to={href(p.fixPath)}>
                  <Button size="sm" variant="secondary" tabIndex={-1} iconRight={<Icon name="external" size={16} />}>
                    {p.fixLabel ?? 'Fix'}
                  </Button>
                </Link>
              ) : p.fixStep && onFixStep ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const step = p.fixStep;
                    if (step) onFixStep(step);
                  }}
                >
                  {p.fixLabel ?? 'Fix'}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 'var(--text-sm)', color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Checks the windows, every participating airport’s market shares (must total 100) and the published survey versions.</li>
          <li>Snapshots the market shares and pins the survey versions for this cycle.</li>
          <li>Creates one participant per operator and e-mails the operator admins that the cycle has commenced.</li>
          <li>Status becomes Published — or Sampling open if the sampling window has already started.</li>
        </ul>
      )}
    </Dialog>
  );
}
