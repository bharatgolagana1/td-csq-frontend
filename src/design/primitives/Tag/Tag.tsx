import { type HTMLAttributes, type ReactNode } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './Tag.module.css';

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'outline';
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
};

/** Small label (categories, "Illustrative", filter chips). */
export function Tag({ tone = 'neutral', onRemove, removeLabel = 'Remove', className, children, ...rest }: TagProps) {
  return (
    <span className={cn(styles.root, styles[tone], className)} {...rest}>
      <span className={styles.text}>{children}</span>
      {onRemove ? (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`${removeLabel} ${typeof children === 'string' ? children : ''}`.trim()}>
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </span>
  );
}

/** Marks sample/illustrative content, per ARCHITECTURE §3. */
export function IllustrativeTag({ className }: { className?: string }) {
  return (
    <Tag tone="outline" className={className}>
      Illustrative
    </Tag>
  );
}
