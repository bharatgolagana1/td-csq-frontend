import { type ReactNode } from 'react';

import { Icon } from '@/design/icons';
import { IconButton } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './surveys.module.css';
import { type DragRowProps } from './useDragOrder';

export type TreeRowProps = {
  as?: 'li' | 'div';
  variant: 'category' | 'subcategory' | 'question';
  code: string;
  label: string;
  /** Right-hand mono meta (weight, count). */
  meta?: ReactNode;
  /** Leading control (the category collapse toggle). */
  prefix?: ReactNode;
  selected: boolean;
  inactive?: boolean;
  /** Position within its sibling group, for the move buttons. */
  index: number;
  count: number;
  canEdit: boolean;
  onSelect: () => void;
  onMove: (delta: -1 | 1) => void;
  drag?: DragRowProps;
  className?: string;
};

/** One node of the tree: select button, drag handle and keyboard move buttons. */
export function TreeRow({ as: Tag = 'li', variant, code, label, meta, prefix, selected, inactive, index, count, canEdit, onSelect, onMove, drag, className }: TreeRowProps) {
  const what = variant === 'question' ? `question ${code}` : `${variant} ${code}`;
  return (
    <Tag className={cn(styles.row, className)} data-selected={selected || undefined} data-inactive={inactive || undefined} {...(drag ?? {})}>
      {prefix}
      {canEdit ? (
        <span className={styles.handle} aria-hidden="true">
          <Icon name="menu" size={16} />
        </span>
      ) : null}
      <button type="button" className={styles.rowBtn} aria-current={selected ? 'true' : undefined} onClick={onSelect} title={label}>
        <span className={styles.rowCode}>{code}</span>
        <span className={variant === 'question' ? styles.rowText : styles.rowTitle}>{label}</span>
        {meta ? <span className={styles.rowMeta}>{meta}</span> : null}
      </button>
      {canEdit ? (
        <span className={styles.rowMoves}>
          <IconButton size="sm" label={`Move ${what} up`} icon={<Icon name="arrow-up" size={16} />} disabled={index === 0} onClick={() => onMove(-1)} />
          <IconButton size="sm" label={`Move ${what} down`} icon={<Icon name="arrow-down" size={16} />} disabled={index >= count - 1} onClick={() => onMove(1)} />
        </span>
      ) : null}
    </Tag>
  );
}
