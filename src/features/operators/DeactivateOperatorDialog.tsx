import { errorMessage, errorRequestId } from '@/api/client';
import { type Operator } from '@/api/operators.types';
import { useDeactivateOperator } from '@/api/organisations';
import { useToast } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';

export type DeactivateOperatorDialogProps = {
  operator: Operator | null;
  onClose: () => void;
  onDone?: (operator: Operator) => void;
};

/** POST /operators/:id/deactivate behind a confirmation (members lose access; data is kept). */
export function DeactivateOperatorDialog({ operator, onClose, onDone }: DeactivateOperatorDialogProps) {
  const toast = useToast();
  const deactivate = useDeactivateOperator();
  const confirm = () => {
    if (!operator) return;
    deactivate.mutate(operator.id, {
      onSuccess: (op) => {
        toast.success(`${op.name} deactivated`);
        onClose();
        onDone?.(op);
      },
      onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
    });
  };
  return (
    <ConfirmDialog
      open={operator !== null}
      onClose={onClose}
      onConfirm={confirm}
      danger
      loading={deactivate.isPending}
      title={operator ? `Deactivate ${operator.name}?` : 'Deactivate operator?'}
      description="Its members lose access and it drops out of new cycles. Customers, assessments and past results are kept."
      confirmLabel="Deactivate"
    />
  );
}
