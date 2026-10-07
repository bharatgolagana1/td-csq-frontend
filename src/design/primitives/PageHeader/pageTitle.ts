import { useSyncExternalStore } from 'react';

/* A tiny external store so the Topbar can mirror the current PageHeader title
   without the page and the shell knowing about each other. */

let current = '';
const listeners = new Set<() => void>();

export function setPageTitle(title: string) {
  if (title === current) return;
  current = title;
  listeners.forEach((l) => l());
}

export function usePageTitle(): string {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}
