import { useEffect, useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useUnlockParticipantSample } from '@/api/cycles';
import { type CycleParticipant } from '@/api/cycles.types';
import { Button, Dialog, Textarea, useToast } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import styles from './cycles.module.css';

export type UnlockDialogProps = { participant: CycleParticipant | null; onClose: () => void };

/** ACFI-only, reasoned, audited unlock of one operator's locked sample (§7 "Sampling"). */
export function UnlockDialog({ participant, onClose }: UnlockDialogProps) {
  const toast = useToast();
  const unlock = useUnlockParticipantSample();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const open = participant !== null;

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
      unlock.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when a participant is chosen
  }, [open]);

  const submit = () => {
    if (!participant) return;
    if (reason.trim().length < 3) {
      setError('Give a reason of at least 3 characters; the operator sees it in the unlock e-mail.');
      return;
    }
    unlock.mutate(
      { cycleId: participant.cycleId, acoId: participant.acoId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`${participant.operator.name} unlocked`, { description: 'They can change their selection and lock again.' });
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={participant ? `Unlock ${participant.operator.name}?` : 'Unlock sample'}
      description={
        participant
          ? `${participant.operator.code} at ${participant.airport.iata} locked ${formatInt(participant.sampling.selectedCount)} of ${formatInt(participant.requiredSampleSize)} required. Unlocking lets them change the selection; it is audited and the operator admins are e-mailed.`
          : undefined
      }
      dismissible={!unlock.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={unlock.isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={unlock.isPending}>
            Unlock sample
          </Button>
        </>
      }
    >
      <form
        className={styles.dialogForm}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Textarea
          label="Reason"
          required
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          data-autofocus
        />
        {unlock.isError ? (
          <p className={styles.errorBox} role="alert">
            {errorMessage(unlock.error)}
            {errorRequestId(unlock.error) ? (
              <>
                {' '}
                · Request <code>{errorRequestId(unlock.error)}</code>
              </>
            ) : null}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
