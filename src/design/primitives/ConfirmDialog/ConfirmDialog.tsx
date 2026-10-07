import { type ReactNode } from 'react';

import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive confirmations use the danger button. */
  danger?: boolean;
  /** Pending state of the confirm button; the dialog cannot be dismissed meanwhile. */
  loading?: boolean;
  children?: ReactNode;
};

/** A Dialog with the standard cancel/confirm footer (deactivate, delete, discard…). */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, loading, children }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
