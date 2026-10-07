import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';

/* Dirty-state guard for the settings page. Each section registers whether its
   form has unsaved edits; the page blocks in-app navigation and the browser's
   unload while any section is dirty (WAVE1 brief §2: confirm before discarding). */

type DirtyApi = {
  dirty: ReadonlySet<string>;
  setDirty: (section: string, isDirty: boolean) => void;
};

const DirtyContext = createContext<DirtyApi | null>(null);

export function SettingsDirtyProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirtySet] = useState<ReadonlySet<string>>(() => new Set());
  const setDirty = useCallback((section: string, isDirty: boolean) => {
    setDirtySet((prev) => {
      if (prev.has(section) === isDirty) return prev;
      const next = new Set(prev);
      if (isDirty) next.add(section);
      else next.delete(section);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ dirty, setDirty }), [dirty, setDirty]);
  return <DirtyContext.Provider value={value}>{children}</DirtyContext.Provider>;
}

function useDirtyApi(): DirtyApi {
  const ctx = useContext(DirtyContext);
  if (!ctx) throw new Error('Settings sections must render inside <SettingsDirtyProvider>');
  return ctx;
}

/** Called by every section with its form's `isDirty`; unregisters on unmount. */
export function useRegisterDirty(section: string, isDirty: boolean): void {
  const { setDirty } = useDirtyApi();
  useEffect(() => {
    setDirty(section, isDirty);
    return () => setDirty(section, false);
  }, [section, isDirty, setDirty]);
}

export function useDirtySections(): ReadonlySet<string> {
  return useDirtyApi().dirty;
}

/** Blocks navigation away from the page while a section is dirty and asks before leaving. */
export function DirtyNavigationGuard({ labels }: { labels: Record<string, string> }) {
  const dirty = useDirtySections();
  const isDirty = dirty.size > 0;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname);

  useBeforeUnload(
    useCallback(
      (e: BeforeUnloadEvent) => {
        if (!isDirty) return;
        e.preventDefault();
        e.returnValue = '';
      },
      [isDirty],
    ),
  );

  // A save that lands while the prompt is open removes the reason to block.
  useEffect(() => {
    if (blocker.state === 'blocked' && !isDirty) blocker.reset();
  }, [blocker, isDirty]);

  const names = Array.from(dirty).map((s) => labels[s] ?? s);
  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
      title="Leave without saving?"
      description={names.length > 0 ? `${names.join(', ')} ${names.length === 1 ? 'has' : 'have'} unsaved changes. They are lost if you leave now.` : undefined}
      confirmLabel="Discard and leave"
      cancelLabel="Stay"
      danger
    />
  );
}
