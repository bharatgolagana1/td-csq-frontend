import { useCallback } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useSelectAll, useUpdateSelection } from '@/api/sampling';
import { type RejectedItem, type SelectionItem } from '@/api/sampling.types';
import { useToast } from '@/design/primitives';
import { formatInt } from '@/lib/format';

/** "2 changes were not applied — … (+1 more)" */
export function rejectedSummary(rejected: readonly RejectedItem[], nameOf: (customerId: string) => string | undefined = () => undefined): string {
  const first = rejected[0];
  if (!first) return '';
  const name = nameOf(first.customerId);
  const head = rejected.length === 1 ? '1 change was not applied' : `${formatInt(rejected.length)} changes were not applied`;
  const detail = name ? `${name}: ${first.message}` : first.message;
  const more = rejected.length > 1 ? ` (+${formatInt(rejected.length - 1)} more)` : '';
  return `${head} — ${detail}${more}`;
}

/**
 * The selection mutations with their toasts: the PUT is optimistic (api/sampling),
 * rejected items come back in the response and are reported, errors roll back.
 */
export function useSelectionActions(cycleId: string, acoId: string, nameOf?: (customerId: string) => string | undefined) {
  const toast = useToast();
  const update = useUpdateSelection();
  const selectAll = useSelectAll();

  const change = useCallback(
    (add: SelectionItem[], remove: SelectionItem[]) => {
      if (add.length === 0 && remove.length === 0) return;
      update.mutate(
        { cycleId, acoId, add, remove },
        {
          onSuccess: (res) => {
            if (res.rejected.length > 0) toast.error(rejectedSummary(res.rejected, nameOf));
          },
          onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
        },
      );
    },
    [update, cycleId, acoId, toast, nameOf],
  );

  const selectAllEligible = useCallback(() => {
    selectAll.mutate(
      { cycleId, acoId },
      {
        onSuccess: (res) => {
          const state = 'state' in res ? res.state : res;
          toast.success(`All ${formatInt(state.selectedCount)} eligible customers selected`);
          if ('rejected' in res && res.rejected.length > 0) toast.error(rejectedSummary(res.rejected, nameOf));
        },
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  }, [selectAll, cycleId, acoId, toast, nameOf]);

  return { change, selectAllEligible, changePending: update.isPending, selectAllPending: selectAll.isPending };
}
