import { useCallback } from 'react';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useCreateVersion } from '@/api/surveys';
import { useToast } from '@/design/primitives';

/* "Create draft" / "Edit as new draft": POST /surveys/:ref/versions. The API
   allows one draft per type (409 with `details.draftId`), so a conflict is
   not an error for the user — we open the draft that already exists. */

export function existingDraftId(error: unknown): string | null {
  if (!isApiError(error, 'CONFLICT')) return null;
  const details = error.details as { draftId?: unknown } | undefined;
  return typeof details?.draftId === 'string' ? details.draftId : null;
}

export function useNewDraft(onReady: (draftId: string) => void) {
  const toast = useToast();
  const create = useCreateVersion();

  const start = useCallback(
    (ref: string) => {
      create.mutate(
        { ref },
        {
          onSuccess: (tree) => {
            toast.success(`Draft v${tree.survey.version} created`);
            onReady(tree.survey.id);
          },
          onError: (e) => {
            const draftId = existingDraftId(e);
            if (draftId) {
              toast.info('A draft already exists — opening it');
              onReady(draftId);
              return;
            }
            toast.error(errorMessage(e), { requestId: errorRequestId(e) });
          },
        },
      );
    },
    [create, onReady, toast],
  );

  return { start, pending: create.isPending };
}
