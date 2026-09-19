import { useEffect, useId, useRef, type FC, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Portalled so the overlay cannot be trapped inside a positioned ancestor of
 * whatever layout the route is mounted in.
 */
export const Dialog: FC<DialogProps> = ({ open, title, subtitle, wide, onClose, children, footer }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="smp-overlay smp"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={wide ? 'smp-dialog smp-dialog--wide' : 'smp-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        ref={panelRef}
      >
        <header>
          <div>
            <h2 id={headingId}>{title}</h2>
            {subtitle ? (
              <p className="sub" id={subtitleId}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <button type="button" className="smp-x" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </header>
        <div className="body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
};

export default Dialog;
