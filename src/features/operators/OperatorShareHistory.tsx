import { type ShareHistoryRow, useMarketShareCycles, useOperatorShareHistory } from '@/api/marketshare';
import { type Operator } from '@/api/operators.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, Pill, Skeleton, statusVariant, Table } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatPct, humanise } from '@/lib/format';

import styles from './operators.module.css';

type Row = { id: string; label: string; code: string; status: string | null; share: number | null; total: number | null; frozen: boolean; pending: boolean; error: boolean };

function toRow(r: ShareHistoryRow): Row {
  return { id: r.cycle.id, label: r.cycle.name, code: r.cycle.code, status: r.cycle.status, share: r.sharePct, total: r.total, frozen: r.frozen, pending: r.status === 'pending', error: r.status === 'error' };
}

/** Market share history tab: the current default plus this operator's share in every cycle snapshot. */
export function OperatorShareHistory({ operator }: { operator: Operator }) {
  const { hasTask } = useSession();
  const canSee = hasTask('marketshare.view');
  const cycles = useMarketShareCycles(canSee && hasTask('cycles.view'));
  const history = useOperatorShareHistory(canSee ? operator.airport.id : undefined, operator.id, cycles.data ?? []);

  if (!canSee) {
    return <EmptyState icon="lock" title="Market shares are not visible to you" description="Ask an ACFI administrator for the market share permission." />;
  }
  if (cycles.isError) return <QueryError error={cycles.error} title="Could not load cycles" onRetry={() => void cycles.refetch()} />;

  const rows: Row[] = [
    { id: 'current', label: 'Current default', code: '—', status: null, share: operator.currentShare, total: null, frozen: false, pending: false, error: false },
    ...history.map(toRow),
  ];

  const columns: Column<Row>[] = [
    {
      id: 'cycle',
      header: 'Cycle',
      cell: (r) => (
        <span className={styles.nameCell}>
          <span className={styles.nameLink}>{r.label}</span>
          {r.status ? <span className={styles.nameSub}>{r.code}</span> : <span className={styles.nameSub}>Copied into the next cycle at publish</span>}
        </span>
      ),
    },
    { id: 'status', header: 'Cycle status', width: 150, hideBelow: 'sm', cell: (r) => (r.status ? <Pill variant={statusVariant(r.status)}>{humanise(r.status)}</Pill> : <span className={styles.muted}>—</span>) },
    { id: 'share', header: 'Share', width: 100, align: 'right', mono: true, cell: (r) => (r.pending ? <Skeleton width={48} /> : r.error ? <span className={styles.muted}>—</span> : formatPct(r.share)) },
    { id: 'total', header: 'Airport total', width: 120, align: 'right', mono: true, hideBelow: 'md', cell: (r) => (r.pending ? <Skeleton width={48} /> : formatPct(r.total)) },
    {
      id: 'frozen',
      header: 'Snapshot',
      width: 110,
      cell: (r) =>
        r.frozen ? (
          <span className={styles.frozen}>
            <Icon name="lock" size={16} /> Frozen
          </span>
        ) : r.status ? (
          <span className={styles.muted}>Editable</span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
  ];

  return (
    <>
      <p className={styles.muted} style={{ marginBottom: 16 }}>
        Shares at {operator.airport.iata} weight the airport score. A cycle's snapshot freezes once it moves past publishing.
      </p>
      <Table caption="Market share history" columns={columns} rows={rows} rowKey={(r) => r.id} loading={cycles.isPending} />
    </>
  );
}
