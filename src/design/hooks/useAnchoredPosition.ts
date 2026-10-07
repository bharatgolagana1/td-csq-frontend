import { type CSSProperties, type RefObject, useLayoutEffect, useState } from 'react';

export type Placement = 'bottom' | 'top';

export type AnchoredPosition = {
  top: number;
  left: number;
  placement: Placement;
  /** False until the first measurement; the floating element can stay invisible meanwhile. */
  ready: boolean;
};

type Options = {
  /** Space between the anchor and the floating element. */
  gap?: number;
  /** Which anchor edge the floating element's left edge follows. */
  align?: 'start' | 'end';
  /** Minimum distance from the viewport edges. */
  margin?: number;
};

const INITIAL: AnchoredPosition = { top: 0, left: 0, placement: 'bottom', ready: false };

/**
 * Fixed-position coordinates for a floating element anchored to `anchorRef`:
 * below by default, flipped above when there is more room there, clamped to the
 * viewport. Re-measures on resize and scroll while `open`.
 */
export function useAnchoredPosition(anchorRef: RefObject<HTMLElement>, floatingRef: RefObject<HTMLElement>, open: boolean, { gap = 6, align = 'start', margin = 8 }: Options = {}): AnchoredPosition {
  const [pos, setPos] = useState<AnchoredPosition>(INITIAL);

  useLayoutEffect(() => {
    if (!open) {
      setPos(INITIAL);
      return;
    }
    const update = () => {
      const anchor = anchorRef.current;
      const floating = floatingRef.current;
      if (!anchor || !floating) return;
      const a = anchor.getBoundingClientRect();
      const fh = floating.offsetHeight;
      const fw = floating.offsetWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const below = vh - a.bottom - gap;
      const above = a.top - gap;
      const placement: Placement = below >= fh || below >= above ? 'bottom' : 'top';
      const rawTop = placement === 'bottom' ? a.bottom + gap : a.top - gap - fh;
      const rawLeft = align === 'start' ? a.left : a.right - fw;
      setPos({
        top: Math.max(margin, Math.min(rawTop, vh - fh - margin)),
        left: Math.max(margin, Math.min(rawLeft, vw - fw - margin)),
        placement,
        ready: true,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, floatingRef, gap, align, margin]);

  return pos;
}

export function anchoredStyle(pos: AnchoredPosition): CSSProperties {
  return { position: 'fixed', top: pos.top, left: pos.left, visibility: pos.ready ? 'visible' : 'hidden' };
}
