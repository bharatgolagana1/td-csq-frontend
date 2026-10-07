import { useEffect, useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useTransitionCycle } from '@/api/cycles';
import { type CycleDetail, type ManualTarget } from '@/api/cycles.types';
import { Button, Dialog, Select, Textarea, useToast } from '@/design/primitives';

import { allowedTransitions, CYCLE_STATUS_LABELS, TRANSITION_HINTS } from './cycleLabels';
import styles from './cycles.module.css';

export type TransitionDialogProps = { open: boolean; onClose: () => void; cycle: CycleDetail };

/** Manual, reasoned override of the cycle clock (`POST /cycles/:id/transition`). */
export function TransitionDialog({ open, onClose, cycle }: TransitionDialogProps) {
  const toast = useToast();
  const transition = useTransitionCycle();
  const targets = allowedTransitions(cycle.status);
  const [to, setTo] = useState<ManualTarget | ''>(targets[0] ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTo(allowedTransitions(cycle.status)[0] ?? '');
      setReason('');
      setError(null);
      transition.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset the form only when the dialog opens
  }, [open, cycle.status]);

  const submit = () => {
    if (!to) return;
    if (reason.trim().length < 3) {
      setError('Give a reason of at least 3 characters; it is recorded in the audit log.');
      return;
    }
    transition.mutate(
      { id: cycle.id, to, reason: reason.trim() },
      {
        onSuccess: (data) => {
          toast.success(`${data.code} is now ${CYCLE_STATUS_LABELS[data.status].toLowerCase()}`);
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Transition cycle"
      description={`${cycle.code} is ${CYCLE_STATUS_LABELS[cycle.status].toLowerCase()}. The scheduler does these moves at the window instants; use this to move early, re-open or archive.`}
      dismissible={!transition.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={transition.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={transition.isPending} disabled={!to}>
            Move cycle
          </Button>
        </>
      }
    >
      <form
        id="transition-form"
        className={styles.dialogForm}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Select
          label="Move to"
          required
          options={targets.map((t) => ({ value: t, label: CYCLE_STATUS_LABELS[t] }))}
          value={to}
          onChange={(e) => setTo(e.target.value as ManualTarget)}
          hint={to ? TRANSITION_HINTS[to] : 'No manual move is possible from this status.'}
          disabled={targets.length === 0}
          data-autofocus
        />
        <Textarea
          label="Reason"
          required
          rows={3}
          value={reason}
          maxLength={500}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          hint="Recorded in the audit log with your name."
        />
        {transition.isError ? (
          <p className={styles.errorBox} role="alert">
            {errorMessage(transition.error)}
            {errorRequestId(transition.error) ? (
              <>
                {' '}
                · Request <code>{errorRequestId(transition.error)}</code>
              </>
            ) : null}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
