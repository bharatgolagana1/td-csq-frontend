import { type RefObject, useEffect, useRef } from 'react';

/**
 * Moves focus to the screen's heading so screen readers announce each state
 * change. Runs when `ready` turns true (pass false while the heading is not
 * yet rendered, e.g. behind a loading skeleton).
 */
export function useFocusHeading<T extends HTMLElement>(ready = true): RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    const id = window.requestAnimationFrame(() => el.focus({ preventScroll: false }));
    return () => window.cancelAnimationFrame(id);
  }, [ready]);
  return ref;
}
