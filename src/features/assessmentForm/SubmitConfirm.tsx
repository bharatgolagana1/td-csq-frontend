import { type ReactNode } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { formatInt } from '@/lib/format';

import styles from './parts.module.css';

export type SubmitConfirmProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answered: number;
  total: number;
  loading?: boolean;
  /** A failed submit (shown with its request id; the dialog stays open). */
  error?: unknown;
  /** Flow-specific line, e.g. the confidentiality note of the public page. */
  note?: ReactNode;
};

/** The confirm sheet before a submit: count, the lock warning, the flow's note. */
export function SubmitConfirm({ open, onClose, onConfirm, answered, total, loading, error, note }: SubmitConfirmProps) {
  const requestId = error ? errorRequestId(error) : undefined;
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Submit your answers?"
      description={`${formatInt(answered)} of ${formatInt(total)} questions answered. Submitted answers are locked and cannot be changed.`}
      confirmLabel="Submit"
      cancelLabel="Keep editing"
      loading={loading}
    >
      {note ? <p className={styles.submitNote}>{note}</p> : null}
      {error ? (
        <p role="alert" className={styles.submitError}>
          {errorMessage(error)}
          {requestId ? (
            <>
              {' '}
              · Request <code>{requestId}</code>
            </>
          ) : null}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
