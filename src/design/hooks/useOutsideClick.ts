import { type RefObject, useEffect } from 'react';

/** Calls `onOutside` on pointerdown outside every ref in `refs` while `active`. */
export function useOutsideClick(refs: RefObject<HTMLElement>[], onOutside: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const inside = refs.some((r) => r.current?.contains(target));
      if (!inside) onOutside();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [refs, onOutside, active]);
}
