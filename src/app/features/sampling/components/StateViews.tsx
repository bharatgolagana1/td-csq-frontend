import type { FC } from 'react';

export const ErrorView: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="smp-state" role="alert">
    <h2>The directory could not be loaded</h2>
    <p>
      Nothing has been changed. This is almost always a connection that dropped rather than anything wrong
      with your list.
    </p>
    <div className="acts">
      <button type="button" className="smp-btn smp-btn--primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  </div>
);

export const DeniedView: FC<{ reason: string }> = ({ reason }) => (
  <div className="smp-state">
    <h2>You do not have access to this directory</h2>
    <p>{reason}</p>
    <p style={{ fontSize: 12.5, color: 'var(--csq-muted)' }}>
      Customer contact details are the most sensitive data in the programme, so access to them is granted per
      person rather than per terminal.
    </p>
  </div>
);

interface EmptyProps {
  minimum: number;
  canEdit: boolean;
  onAdd: () => void;
  onImport: () => void;
}

export const EmptyDirectory: FC<EmptyProps> = ({ minimum, canEdit, onAdd, onImport }) => (
  <div className="smp-empty">
    <h3>No customers yet</h3>
    <p>
      Your directory is where the sample comes from: the freight forwarders and customs brokers who actually
      used this terminal during the cycle. You need at least {minimum} of them in the sample before it can be
      locked.
    </p>
    {canEdit ? (
      <div className="acts" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="smp-btn smp-btn--primary" onClick={onImport}>
          Import a list
        </button>
        <button type="button" className="smp-btn" onClick={onAdd}>
          Add one customer
        </button>
      </div>
    ) : (
      <p style={{ color: 'var(--csq-muted)' }}>Your account can view this directory but not add to it.</p>
    )}
  </div>
);
