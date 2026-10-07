import { cloneElement, type ReactElement, type ReactNode, useId, useState } from 'react';

import { cn } from '@/lib/cn';

import styles from './Tooltip.module.css';

export type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'bottom';
  className?: string;
};

/**
 * Hover/focus tooltip. The child must accept `aria-describedby`, `onMouseEnter`,
 * `onMouseLeave`, `onFocus`, `onBlur` and `onKeyDown` (every primitive does).
 * Escape on the child dismisses it.
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const childProps = children.props as Record<string, unknown>;

  const chain = (name: string, after: (e: unknown) => void) => (e: unknown) => {
    const fn = childProps[name];
    if (typeof fn === 'function') (fn as (ev: unknown) => void)(e);
    after(e);
  };

  return (
    <span className={cn(styles.root, className)}>
      {cloneElement(children, {
        'aria-describedby': open ? id : undefined,
        onMouseEnter: chain('onMouseEnter', () => setOpen(true)),
        onMouseLeave: chain('onMouseLeave', () => setOpen(false)),
        onFocus: chain('onFocus', () => setOpen(true)),
        onBlur: chain('onBlur', () => setOpen(false)),
        onKeyDown: chain('onKeyDown', (e) => {
          if ((e as { key?: string }).key === 'Escape') setOpen(false);
        }),
      } as Record<string, unknown>)}
      <span role="tooltip" id={id} className={cn(styles.bubble, styles[side], open && styles.open)}>
        {content}
      </span>
    </span>
  );
}
