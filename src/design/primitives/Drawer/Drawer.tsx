import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap } from '@/design/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/design/hooks/useLockBodyScroll';
import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { IconButton } from '../IconButton/IconButton';
import styles from './Drawer.module.css';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Panel width in px (480–640 per ARCHITECTURE §3). */
  width?: 480 | 520 | 560 | 600 | 640;
  side?: 'right' | 'left';
  dismissible?: boolean;
  className?: string;
};

/** Right-hand panel for create/edit forms. Same a11y contract as Dialog. */
export function Drawer({ open, onClose, title, description, children, footer, width = 520, side = 'right', dismissible = true, className }: DrawerProps) {
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
    <div className={cn(styles.layer, styles[side])}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className={styles.backdrop} onClick={dismissible ? onClose : undefined} data-testid="drawer-backdrop" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cn(styles.panel, className)}
        style={{ '--drawer-w': `${width}px` } as React.CSSProperties}
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
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
