import { type KeyboardEvent, type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { anchoredStyle, useAnchoredPosition } from '@/design/hooks/useAnchoredPosition';
import { focusableIn } from '@/design/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/design/hooks/useLockBodyScroll';
import { useOutsideClick } from '@/design/hooks/useOutsideClick';
import { cn } from '@/lib/cn';

import { Button } from '../Button/Button';
import styles from './DatePicker.module.css';

export type CloseReason = 'apply' | 'cancel' | 'escape' | 'outside';

export type DatePopoverProps = {
  open: boolean;
  id: string;
  label: string;
  anchorRef: RefObject<HTMLElement>;
  /** Phone presentation: a bottom sheet instead of an anchored popover. */
  sheet: boolean;
  onCancel: (reason: Exclude<CloseReason, 'apply'>) => void;
  onApply: () => void;
  applyDisabled?: boolean;
  applyLabel?: string;
  /** Small mono line in the footer ("Dates in Asia/Kolkata"). */
  caption?: ReactNode;
  /** Desktop column beside the calendar (presets); supply a styled element. */
  aside?: ReactNode;
  /** Sheet row above the calendar (preset chips); supply a styled element. */
  chips?: ReactNode;
  children: ReactNode;
};

/**
 * The surface both pickers open: anchored popover (flips at the viewport edge)
 * or bottom sheet under 760px. Holds focus (Tab cycles), closes on Escape and
 * outside pointer-down, and carries the Cancel/Apply footer. Focus restoration
 * is the opener's job, so an outside click never steals focus back.
 */
export function DatePopover({ open, id, label, anchorRef, sheet, onCancel, onApply, applyDisabled, applyLabel = 'Apply', caption, aside, chips, children }: DatePopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useAnchoredPosition(anchorRef, panelRef, open && !sheet);
  useLockBodyScroll(open && sheet);
  useOutsideClick([panelRef, anchorRef], () => onCancel('outside'), open && !sheet);

  useEffect(() => {
    if (!open) return;
    const root = panelRef.current;
    if (!root) return;
    const initial = root.querySelector<HTMLElement>('[data-autofocus]') ?? focusableIn(root)[0] ?? root;
    const raf = requestAnimationFrame(() => initial.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancel('escape');
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = focusableIn(panelRef.current);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      e.preventDefault();
      panelRef.current.focus();
      return;
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const panel = (
    // Escape and Tab-cycling are scoped to the panel so a Dialog underneath keeps its own Escape.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-label={label}
      aria-modal={sheet ? 'true' : undefined}
      tabIndex={-1}
      className={cn(sheet ? styles.sheet : styles.popover)}
      style={sheet ? undefined : anchoredStyle(pos)}
      data-placement={sheet ? undefined : pos.placement}
      onKeyDown={onKeyDown}
    >
      {sheet ? <div className={styles.grabber} aria-hidden="true" /> : null}
      {sheet ? chips : null}
      <div className={styles.body}>
        {sheet ? null : aside}
        <div className={styles.calendar}>{children}</div>
      </div>
      <footer className={styles.footer}>
        {caption ? <span className={styles.caption}>{caption}</span> : null}
        <div className={styles.actions}>
          <Button variant="ghost" className={styles.pill} onClick={() => onCancel('cancel')}>
            Cancel
          </Button>
          <Button variant="primary" className={styles.pill} onClick={onApply} disabled={applyDisabled}>
            {applyLabel}
          </Button>
        </div>
      </footer>
    </div>
  );

  return createPortal(
    sheet ? (
      <div className={styles.sheetLayer}>
        {/* Pointer-only; keyboard users close with Escape or Cancel. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div className={styles.backdrop} data-testid="date-sheet-backdrop" onClick={() => onCancel('outside')} />
        {panel}
      </div>
    ) : (
      panel
    ),
    document.body,
  );
}
