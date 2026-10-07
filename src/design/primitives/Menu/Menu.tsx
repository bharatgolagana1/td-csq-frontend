import { cloneElement, type KeyboardEvent, type ReactElement, type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useOutsideClick } from '@/design/hooks/useOutsideClick';
import { cn } from '@/lib/cn';

import styles from './Menu.module.css';

export type MenuItem =
  | { id: string; label: ReactNode; icon?: ReactNode; danger?: boolean; disabled?: boolean; onSelect: () => void; separator?: false }
  | { id: string; separator: true };

export type MenuProps = {
  /** The trigger element; it receives aria-haspopup/expanded/controls and handlers. */
  trigger: ReactElement;
  items: MenuItem[];
  align?: 'start' | 'end';
  label?: string;
  /** Non-interactive block above the items (e.g. the signed-in user). */
  header?: ReactNode;
  className?: string;
};

type Pos = { top: number; left: number; right?: number };

/**
 * Keyboard-navigable action menu (ArrowUp/Down, Home/End, Enter/Space, Escape).
 * Positioned fixed from the trigger's rect and portalled, so it escapes table overflow.
 */
export function Menu({ trigger, items, align = 'end', label = 'Actions', header, className }: MenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0 });
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const refs = [triggerRef, listRef];

  const selectable = items.map((it, i) => (it.separator || it.disabled ? -1 : i)).filter((i) => i >= 0);

  const close = useCallback((restore = true) => {
    setOpen(false);
    if (restore) triggerRef.current?.focus();
  }, []);

  useOutsideClick(refs, () => close(false), open);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const top = r.bottom + 4;
    if (align === 'end') setPos({ top, left: 0, right: Math.max(8, window.innerWidth - r.right) });
    else setPos({ top, left: r.left });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const first = selectable[0] ?? 0;
    setActive(first);
    const raf = requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[selectable.indexOf(first) === -1 ? 0 : selectable.indexOf(first)]?.focus();
    });
    const onScroll = () => close(false);
    // Escape anywhere (including on the trigger before focus moves in) closes and restores focus.
    const onDocKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', onDocKey, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onDocKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectable is derived from items each render
  }, [open, close]);

  const focusItem = (index: number) => {
    setActive(index);
    const pos = selectable.indexOf(index);
    listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[pos]?.focus();
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const pos = selectable.indexOf(active);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(selectable[(pos + 1) % selectable.length] ?? active);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(selectable[(pos - 1 + selectable.length) % selectable.length] ?? active);
        break;
      case 'Home':
        e.preventDefault();
        focusItem(selectable[0] ?? active);
        break;
      case 'End':
        e.preventDefault();
        focusItem(selectable[selectable.length - 1] ?? active);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case 'Tab':
        close(false);
        break;
      default:
        break;
    }
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const triggerEl = cloneElement(trigger, {
    ref: triggerRef,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? id : undefined,
    onClick: (e: MouseEvent) => {
      (trigger.props as { onClick?: (ev: MouseEvent) => void }).onClick?.(e);
      setOpen((o) => !o);
    },
    onKeyDown: onTriggerKeyDown,
  } as Record<string, unknown>);

  return (
    <>
      {triggerEl}
      {open
        ? createPortal(
            <div
              ref={listRef}
              id={id}
              role="menu"
              tabIndex={-1}
              aria-label={label}
              className={cn(styles.menu, className)}
              style={{ top: pos.top, left: pos.right === undefined ? pos.left : undefined, right: pos.right }}
              onKeyDown={onListKeyDown}
            >
              {header ? <div className={styles.header}>{header}</div> : null}
              {items.map((item, i) =>
                item.separator ? (
                  <div key={item.id} role="separator" className={styles.separator} />
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    tabIndex={i === active ? 0 : -1}
                    disabled={item.disabled}
                    className={cn(styles.item, item.danger && styles.danger)}
                    onMouseEnter={() => !item.disabled && setActive(i)}
                    onClick={() => {
                      close();
                      item.onSelect();
                    }}
                  >
                    {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
                    <span className={styles.label}>{item.label}</span>
                  </button>
                ),
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
