import { useEffect, useSyncExternalStore } from 'react';

/* Which cycle the page on screen is showing, so the operator strip under the
   top bar follows it (Sampling, Dashboard, Self-assessment) instead of always
   naming the default current cycle. A tiny external store, like the page
   title: pages publish with `useStripCycle`, the strip reads `useShownCycle`,
   and neither knows about the other. */

export type ShownCycle = { id: string; name: string; code: string; status: string; tz?: string | undefined };

let shown: ShownCycle | null = null;
const listeners = new Set<() => void>();

function publish(next: ShownCycle | null) {
  if (next === shown) return;
  shown = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** While the calling page is mounted, the strip follows `cycle` (null / undefined: the page shows none, the strip keeps its default). */
export function useStripCycle(cycle: ShownCycle | null | undefined): void {
  const id = cycle?.id;
  const name = cycle?.name ?? '';
  const code = cycle?.code ?? '';
  const status = cycle?.status ?? '';
  const tz = cycle?.tz;
  useEffect(() => {
    if (!id) return undefined;
    const mine: ShownCycle = { id, name, code, status, tz };
    publish(mine);
    return () => {
      if (shown === mine) publish(null);
    };
  }, [id, name, code, status, tz]);
}

/** The cycle the page on screen shows, if it named one. */
export function useShownCycle(): ShownCycle | null {
  return useSyncExternalStore(subscribe, () => shown, () => shown);
}
