import { type NotificationRefs } from '@/api/notifications.types';
import { Tag } from '@/design/primitives';

import styles from './notifications.module.css';

/** Resolves ids to names where the page has them; falls back to a short id. */
export type RefNames = {
  cycle: (id: string) => string | undefined;
  operator: (id: string) => string | undefined;
};

export function shortId(id: string): string {
  return id.length > 8 ? `…${id.slice(-6)}` : id;
}

export type RefChipsProps = {
  refs: NotificationRefs;
  names: RefNames;
  /** Table cells: quieter tone, cycle and operator only, so rows stay one line. */
  compact?: boolean;
  className?: string;
};

/** Cycle / operator / customer chips for a notification's refs. */
export function RefChips({ refs, names, compact, className }: RefChipsProps) {
  const chips: { kind: string; label: string; mono: boolean }[] = [];
  if (refs.cycleId) {
    const name = names.cycle(refs.cycleId);
    chips.push({ kind: 'Cycle', label: name ?? shortId(refs.cycleId), mono: !name });
  }
  if (refs.acoId) {
    const name = names.operator(refs.acoId);
    chips.push({ kind: 'Operator', label: name ?? shortId(refs.acoId), mono: !name });
  }
  if (refs.customerId && !compact) chips.push({ kind: 'Customer', label: shortId(refs.customerId), mono: true });
  if (chips.length === 0) return <span style={{ color: 'var(--muted)' }}>—</span>;
  return (
    <span className={className ?? (compact ? styles.chipsCompact : styles.chips)}>
      {chips.map((c) => (
        <Tag key={c.kind} tone={compact ? 'neutral' : 'outline'} title={`${c.kind}: ${c.label}`} className={compact ? styles.chipCompact : undefined}>
          {compact ? null : <span className={styles.chipKind}>{c.kind}</span>}
          <span className={c.mono ? styles.chipId : undefined}>{c.label}</span>
        </Tag>
      ))}
    </span>
  );
}
