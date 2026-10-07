import { useState } from 'react';

import { useAudit } from '@/api/audit';
import { type AuditEntry } from '@/api/audit.types';
import { Button, EmptyState, Pill, Skeleton } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatDateTime, humanise } from '@/lib/format';

import styles from './cycles.module.css';

const PAGE = 50;

function Entry({ entry, tz }: { entry: AuditEntry; tz: string }) {
  const hasDetail = entry.before !== undefined || entry.after !== undefined;
  return (
    <li className={styles.auditItem}>
      <span className={styles.auditWhen}>{formatDateTime(entry.at, tz)}</span>
      <span className={styles.auditBody}>
        <Pill variant="neutral" size="sm">
          {humanise(entry.action.replace(/^cycle\./, ''))}
        </Pill>
        <span className={styles.auditActor}>{entry.actorEmail ?? (entry.actorUserId ? `user ${entry.actorUserId}` : 'system')}</span>
        <span className={styles.auditReq}>req {entry.requestId}</span>
        {hasDetail ? (
          <details className={styles.auditDetail}>
            <summary>Before / after</summary>
            <pre>{JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}</pre>
          </details>
        ) : null}
      </span>
    </li>
  );
}

/** Audit entries for the cycle entity (`GET /audit?entity=cycle&entityId=`). */
export function AuditTab({ cycleId, tz }: { cycleId: string; tz: string }) {
  const [pageSize, setPageSize] = useState(PAGE);
  const query = useAudit({ entity: 'cycle', entityId: cycleId, pageSize, sort: '-at' });

  if (query.isError) return <QueryError error={query.error} title="Could not load the audit log" onRetry={() => void query.refetch()} />;
  if (query.isPending) return <Skeleton lines={6} />;
  const rows = query.data.data;
  const total = query.data.meta.total;
  if (rows.length === 0) return <EmptyState icon="shield" title="No audit entries" description="Creation, edits, publish and transitions are recorded here." />;
  return (
    <>
      <ul className={styles.auditList} aria-label="Audit log">
        {rows.map((e) => (
          <Entry key={e.id} entry={e} tz={tz} />
        ))}
      </ul>
      {total > rows.length ? (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="secondary" size="sm" onClick={() => setPageSize((n) => Math.min(200, n + PAGE))} loading={query.isFetching}>
            Show more ({rows.length} of {total})
          </Button>
        </div>
      ) : null}
    </>
  );
}
