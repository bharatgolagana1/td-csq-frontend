import { useState } from 'react';

import { type CurrentCycle, type SelectionState } from '@/api/sampling.types';
import { Button, Dialog, KeyValue, Textarea } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { formatDateTime, formatInt } from '@/lib/format';

import styles from './sampling.module.css';

export type LockDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  state: SelectionState;
  current: CurrentCycle | null;
  tz: string;
};

/** "Lock the sample?" — what happens next, then the one irreversible button. */
export function LockDialog({ open, onClose, onConfirm, loading, state, current, tz }: LockDialogProps) {
  const assessmentStart = current?.cycle.assessment.start.utc ?? null;
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      title="Lock the sample?"
      description={
        assessmentStart
          ? `${formatInt(state.selectedCount)} customers will be invited when the assessment opens on ${formatDateTime(assessmentStart, tz)}. After locking, only ACFI can change the selection.`
          : `${formatInt(state.selectedCount)} customers will be invited when the assessment opens. After locking, only ACFI can change the selection.`
      }
      confirmLabel="Lock sample"
    >
      <KeyValue
        layout="rows"
        items={[
          { key: 'Cycle', value: `${state.cycle.name} · ${state.cycle.code}` },
          { key: 'Selected', value: formatInt(state.selectedCount), mono: true },
          { key: 'Required', value: formatInt(state.required), mono: true },
          { key: 'Eligible', value: formatInt(state.eligibleCount), mono: true },
        ]}
      />
    </ConfirmDialog>
  );
}

const REASON_MIN = 3;
const REASON_MAX = 500;

export type UnlockDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
  state: SelectionState;
};

/** PLATFORM only: unlock with a reason that is audited and mailed to the operator. */
export function UnlockDialog({ open, onClose, onConfirm, loading, state }: UnlockDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const trimmed = reason.trim();
  const error = trimmed.length < REASON_MIN ? `Give a reason of at least ${REASON_MIN} characters.` : trimmed.length > REASON_MAX ? `Keep the reason under ${REASON_MAX} characters.` : null;

  const submit = () => {
    setTouched(true);
    if (error) return;
    onConfirm(trimmed);
  };
  const close = () => {
    if (loading) return;
    setReason('');
    setTouched(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Unlock the sample?"
      description={`${state.cycle.name}: pending invitations are revoked and the operator can change the selection again. The reason is recorded in the audit trail and sent to the operator.`}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={loading}>
            Unlock sample
          </Button>
        </>
      }
    >
      <form
        className={styles.dialogBody}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Textarea
          label="Reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched ? error : undefined}
          hint="For example: operator asked to replace two customers who closed down."
          data-autofocus
        />
      </form>
    </Dialog>
  );
}
