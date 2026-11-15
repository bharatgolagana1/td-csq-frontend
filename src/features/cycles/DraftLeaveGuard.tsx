import { useCallback, useEffect } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';

import { type DraftAutosave } from './useDraftAutosave';

function reasonOf({ draftId, state, unsaved }: DraftAutosave): string {
  if (state.kind === 'saving') return 'Your latest changes are being saved. Wait a moment, or leave now and lose them.';
  if (draftId === null) return 'This cycle has not been saved yet: a draft is created once Basics has a name, a code and a time zone. What you entered is lost if you leave now.';
  if (state.kind === 'error') return `Your latest changes could not be saved (${state.message}). They are lost if you leave now.`;
  if (unsaved.blocked) return 'Some changes cannot be saved until the highlighted fields are fixed. They are lost if you leave now.';
  return 'Some changes are not saved yet. They are lost if you leave now.';
}

/**
 * Asks before leaving the builder (in-app navigation and the browser's
 * unload) while something on the page is not on the server. Pending edits
 * are pushed out when the user tries to leave; once they land, the
 * navigation goes ahead on its own.
 */
export function DraftLeaveGuard({ autosave }: { autosave: DraftAutosave }) {
  const { isUnsaved, flush } = autosave;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && isUnsaved());
  const blocked = blocker.state === 'blocked';

  useBeforeUnload(
    useCallback(
      (e: BeforeUnloadEvent) => {
        if (!isUnsaved()) return;
        e.preventDefault();
        e.returnValue = '';
      },
      [isUnsaved],
    ),
  );

  useEffect(() => {
    if (blocked) void flush();
  }, [blocked, flush]);

  // A save that lands while the prompt is open removes the reason to stay.
  useEffect(() => {
    if (blocked && !isUnsaved()) blocker.proceed();
  }, [blocked, blocker, isUnsaved, autosave.state, autosave.unsaved]);

  return (
    <ConfirmDialog
      open={blocked}
      onClose={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
      title="Leave without saving?"
      description={reasonOf(autosave)}
      confirmLabel="Leave without saving"
      cancelLabel="Stay"
      danger
    />
  );
}
