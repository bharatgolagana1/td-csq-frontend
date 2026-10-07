import { useState } from 'react';

import { useSamplingAudit } from '@/api/sampling';
import { type SamplingAuditEntry } from '@/api/sampling.types';
import { type Column, EmptyState, Pagination, Pill, Table } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatDateTime } from '@/lib/format';

import styles from './sampling.module.css';
import { describeAudit } from './samplingLabels';

export type AuditTabProps = { cycleId: string; acoId: string; tz: string };

/** `sample.*` audit entries for this participant (§6 GET /sampling/cycles/:cycleId/audit). */
export function AuditTab({ cycleId, acoId, tz }: AuditTabProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const query = useSamplingAudit(cycleId, acoId, { page, pageSize });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  const columns: Column<SamplingAuditEntry>[] = [
    { id: 'at', header: 'When', width: 170, mono: true, cell: (e) => formatDateTime(e.at, tz) },
    {
      id: 'action',
      header: 'Action',
      width: 170,
      cell: (e) => {
        const d = describeAudit(e);
        return <Pill variant={d.variant}>{d.label}</Pill>;
      },
    },
    { id: 'detail', header: 'Details', cell: (e) => <span className={styles.detail}>{describeAudit(e).detail || '—'}</span> },
    { id: 'actor', header: 'By', hideBelow: 'md', cell: (e) => <span className={styles.actor}>{e.actorEmail ?? e.actorUserId ?? 'System'}</span> },
    { id: 'requestId', header: 'Request', width: 150, mono: true, hideBelow: 'md', cell: (e) => <span className={styles.muted}>{e.requestId}</span> },
  ];

  if (query.isError) return <QueryError error={query.error} title="Could not load the audit trail" onRetry={() => void query.refetch()} />;

  return (
    <>
      <Table
        caption="Sampling audit trail"
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        loading={query.isPending}
        empty={<EmptyState icon="clock" title="No sampling activity yet" description="Selection changes, locks and unlocks for this cycle appear here." />}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />
    </>
  );
}
