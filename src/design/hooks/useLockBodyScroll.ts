import { useEffect } from 'react';

let locks = 0;

/** Prevents the page behind a dialog/drawer from scrolling; ref-counted. */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      locks -= 1;
      if (locks === 0) document.body.style.overflow = previous;
    };
  }, [active]);
}
