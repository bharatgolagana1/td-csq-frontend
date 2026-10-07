import { cn } from '@/lib/cn';
import { formatStamp } from '@/lib/stamp';

import styles from './Stamp.module.css';

export type StampProps = {
  /** ISO instant; `null` renders a dash. */
  iso: string | null | undefined;
  /** IANA zone the instant is shown in (default: the platform zone). */
  tz?: string;
  className?: string;
};

/**
 * A zoned timestamp for log tables: "7 Oct 2026, 14:30 IST" on wide screens,
 * "7 Oct, 14:30" under 760px (the full form stays in the accessible name).
 */
export function Stamp({ iso, tz, className }: StampProps) {
  const s = formatStamp(iso, tz);
  return (
    <time dateTime={iso ?? undefined} className={cn(styles.root, className)} aria-label={s.full}>
      <span className={styles.full} aria-hidden="true">
        {s.full}
      </span>
      <span className={styles.short} aria-hidden="true">
        {s.short}
      </span>
    </time>
  );
}
