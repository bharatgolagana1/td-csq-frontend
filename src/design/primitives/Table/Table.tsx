import { type ReactNode } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { Checkbox } from '../Checkbox/Checkbox';
import { IconButton } from '../IconButton/IconButton';
import { Menu, type MenuItem } from '../Menu/Menu';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './Table.module.css';

export type SortDir = 'asc' | 'desc';
export type SortState = { id: string; dir: SortDir };

export type Column<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** Mono + tabular numerals (numbers, codes, dates). */
  mono?: boolean;
  /** Collapse this column below the breakpoint. */
  hideBelow?: 'sm' | 'md';
};

export type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  selectable?: boolean;
  selected?: ReadonlySet<string>;
  onSelectedChange?: (next: Set<string>) => void;
  rowActions?: (row: T) => MenuItem[];
  loading?: boolean;
  /** Rendered in place of rows when there are none (use EmptyState). */
  empty?: ReactNode;
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  caption?: string;
  dense?: boolean;
  skeletonRows?: number;
  className?: string;
};

export function toggleSort(current: SortState | undefined, id: string): SortState {
  if (current?.id === id) return { id, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  return { id, dir: 'asc' };
}

/** Sticky header, 44px rows, sortable headers, selection column, hover/keyboard row actions. */
export function Table<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  selectable,
  selected,
  onSelectedChange,
  rowActions,
  loading,
  empty,
  stickyHeader = true,
  onRowClick,
  rowClassName,
  caption,
  dense,
  skeletonRows = 6,
  className,
}: TableProps<T>) {
  const keys = rows.map(rowKey);
  const selectedCount = selected ? keys.filter((k) => selected.has(k)).length : 0;
  const allSelected = keys.length > 0 && selectedCount === keys.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  const toggleAll = () => {
    if (!onSelectedChange) return;
    const next = new Set(selected ?? []);
    if (allSelected) keys.forEach((k) => next.delete(k));
    else keys.forEach((k) => next.add(k));
    onSelectedChange(next);
  };
  const toggleOne = (key: string) => {
    if (!onSelectedChange) return;
    const next = new Set(selected ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectedChange(next);
  };

  return (
    <div className={cn(styles.wrap, className)}>
      <table className={cn(styles.table, dense && styles.dense, stickyHeader && styles.sticky)}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead>
          <tr>
            {selectable ? (
              <th scope="col" className={cn(styles.th, styles.selectCol)}>
                <Checkbox bare aria-label="Select all rows" checked={allSelected} indeterminate={someSelected} onChange={toggleAll} disabled={rows.length === 0} />
              </th>
            ) : null}
            {columns.map((col) => {
              const active = sort?.id === col.id;
              const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : col.sortable ? 'none' : undefined;
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSort}
                  style={{ width: col.width }}
                  className={cn(styles.th, col.align && styles[`align-${col.align}`], col.hideBelow && styles[`hide-${col.hideBelow}`])}
                >
                  {col.sortable && onSortChange ? (
                    <button type="button" className={cn(styles.sortButton, active && styles.sortActive)} onClick={() => onSortChange(toggleSort(sort, col.id))}>
                      <span>{col.header}</span>
                      <Icon name={active ? (sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : 'sort-none'} size={16} className={styles.sortIcon} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
            {rowActions ? (
              <th scope="col" className={cn(styles.th, styles.actionsCol)}>
                <span className="visually-hidden">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={`s${i}`} className={styles.tr} aria-hidden="true">
                  {selectable ? (
                    <td className={styles.td}>
                      <Skeleton width={20} height={20} radius={5} />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.id} className={cn(styles.td, col.hideBelow && styles[`hide-${col.hideBelow}`])}>
                      <Skeleton width={`${50 + ((i * 17 + col.id.length * 7) % 40)}%`} />
                    </td>
                  ))}
                  {rowActions ? <td className={styles.td} /> : null}
                </tr>
              ))
            : null}
          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className={styles.emptyCell}>
                {empty ?? <p className={styles.emptyText}>Nothing here yet.</p>}
              </td>
            </tr>
          ) : null}
          {!loading
            ? rows.map((row, i) => {
                const key = keys[i] ?? String(i);
                const isSelected = selected?.has(key) ?? false;
                return (
                  <tr
                    key={key}
                    className={cn(styles.tr, isSelected && styles.selected, onRowClick && styles.clickable, rowClassName?.(row))}
                    aria-selected={selectable ? isSelected : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable ? (
                      <td className={cn(styles.td, styles.selectCol)} onClick={(e) => e.stopPropagation()}>
                        <Checkbox bare aria-label={`Select row ${i + 1}`} checked={isSelected} onChange={() => toggleOne(key)} />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(styles.td, col.align && styles[`align-${col.align}`], col.mono && styles.mono, col.hideBelow && styles[`hide-${col.hideBelow}`])}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className={cn(styles.td, styles.actionsCol)} onClick={(e) => e.stopPropagation()}>
                        <Menu trigger={<IconButton label="Row actions" icon={<Icon name="more" />} size="sm" className={styles.actionsButton} />} items={rowActions(row)} />
                      </td>
                    ) : null}
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>
      {loading ? (
        <span role="status" className="visually-hidden">
          Loading
        </span>
      ) : null}
    </div>
  );
}
