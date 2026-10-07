import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap } from '@/design/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/design/hooks/useLockBodyScroll';
import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { IconButton } from '../IconButton/IconButton';
import styles from './Dialog.module.css';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Backdrop click and Escape close the dialog (default true). */
  dismissible?: boolean;
  className?: string;
};

/** Modal dialog: focus trap + restore, Escape, aria-labelledby/-describedby, portal. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', dismissible = true, className }: DialogProps) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles.layer}>
      {/* The backdrop is pointer-only; keyboard users close with Escape or the button. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className={styles.backdrop} onClick={dismissible ? onClose : undefined} data-testid="dialog-backdrop" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cn(styles.panel, styles[size], className)}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 id={`${id}-title`} className={styles.title}>
              {title}
            </h2>
            {description ? (
              <p id={`${id}-desc`} className={styles.description}>
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Close" icon={<Icon name="x" />} onClick={onClose} className={styles.close} />
        </header>
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
