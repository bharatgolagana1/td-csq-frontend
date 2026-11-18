import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';
import { formatInt } from '@/lib/format';

import { IconButton } from '../IconButton/IconButton';
import styles from './Pagination.module.css';
import { Select } from '../Select/Select';

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

/** "1–25 of 132" with previous/next; numbers in mono. */
export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [25, 50, 100], className }: PaginationProps) {
  const pages = pageCount(total, pageSize);
  const current = Math.min(Math.max(1, page), pages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);
  return (
    <nav className={cn(styles.root, className)} aria-label="Pagination">
      <span className={styles.range} aria-live="polite">
        {total === 0 ? 'No results' : `${formatInt(from)}–${formatInt(to)} of ${formatInt(total)}`}
      </span>
      <div className={styles.controls}>
        {onPageSizeChange ? (
          <div className={styles.size}>
            <span className={styles.sizeLabel}>Rows</span>
            <Select aria-label="Rows" size="sm" value={pageSize} options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))} onChange={(e) => onPageSizeChange(Number(e.target.value))} />
          </div>
        ) : null}
        <span className={styles.page}>
          {formatInt(current)} / {formatInt(pages)}
        </span>
        <IconButton label="Previous page" icon={<Icon name="chevron-left" />} variant="secondary" size="sm" disabled={current <= 1} onClick={() => onPageChange(current - 1)} />
        <IconButton label="Next page" icon={<Icon name="chevron-right" />} variant="secondary" size="sm" disabled={current >= pages} onClick={() => onPageChange(current + 1)} />
      </div>
    </nav>
  );
}
