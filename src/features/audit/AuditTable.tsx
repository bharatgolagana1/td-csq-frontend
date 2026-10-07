import { type ReactNode } from 'react';

import { type AuditEntry } from '@/api/audit.types';
import { type Column, EmptyState, Pill, type PillVariant, type SortState, Stamp, Table } from '@/design/primitives';
import { humanise } from '@/lib/format';

import styles from './audit.module.css';

export type AuditTableProps = {
  rows: AuditEntry[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  onOpen: (e: AuditEntry) => void;
  orgName: (id: string | null) => string | undefined;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
};

/** The verb of `entity.verb` decides the pill tone: creations and approvals succeed, removals warn, failures danger. */
export function actionVariant(action: string): PillVariant {
  const verb = action.split('.').pop() ?? '';
  if (/^(created|approved|published|locked|submitted|imported|sent|saved|run)$/.test(verb)) return 'success';
  if (/^(updated|transitioned|changed|resent|unlocked)$/.test(verb)) return 'info';
  if (/^(deactivated|rejected|revoked|deleted|removed)$/.test(verb)) return 'warn';
  if (/^(failed)$/.test(verb)) return 'danger';
  return 'neutral';
}

export function shortId(id: string): string {
  return id.length > 10 ? `…${id.slice(-6)}` : id;
}

/** At · actor · organisation · action · entity + id · request id. */
export function AuditTable({ rows, loading, sort, onSortChange, onOpen, orgName, emptyTitle, emptyDescription, emptyAction }: AuditTableProps) {
  const columns: Column<AuditEntry>[] = [
    { id: 'at', header: 'At', mono: true, sortable: true, cell: (e) => <Stamp iso={e.at} /> },
    {
      id: 'actor',
      header: 'Actor',
      hideBelow: 'sm',
      cell: (e) => (
        <span className={styles.actor}>
          <span className={e.actorEmail ? styles.actorEmail : styles.actorSystem}>{e.actorEmail ?? 'System'}</span>
          {e.orgId ? <span className={styles.actorOrg}>{orgName(e.orgId) ?? shortId(e.orgId)}</span> : null}
        </span>
      ),
    },
    { id: 'organisation', header: 'Organisation', hideBelow: 'md', cell: (e) => (e.orgId ? (orgName(e.orgId) ?? <code className={styles.id}>{shortId(e.orgId)}</code>) : <span className={styles.muted}>—</span>) },
    {
      id: 'action',
      header: 'Action',
      sortable: true,
      cell: (e) => (
        <span className={styles.actionCell}>
          <Pill variant={actionVariant(e.action)}>{humanise(e.action.replace(/\./g, ' '))}</Pill>
          {/* Phone width: the Actor column is hidden, so the actor moves in here. */}
          <span className={styles.actionActor}>{e.actorEmail ?? 'System'}</span>
        </span>
      ),
    },
    {
      id: 'entity',
      header: 'Entity',
      sortable: true,
      hideBelow: 'sm',
      cell: (e) => (
        <span className={styles.entity}>
          <span>{humanise(e.entity.replace(/[._]/g, ' '))}</span>
          <code className={styles.id} title={e.entityId}>
            {shortId(e.entityId)}
          </code>
        </span>
      ),
    },
    { id: 'requestId', header: 'Request', width: 150, mono: true, hideBelow: 'md', cell: (e) => (e.requestId ? <span title={e.requestId}>{e.requestId.length > 14 ? `${e.requestId.slice(0, 12)}…` : e.requestId}</span> : <span className={styles.muted}>—</span>) },
  ];

  return (
    <Table
      caption="Audit log"
      columns={columns}
      rows={rows}
      rowKey={(e) => e.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={onOpen}
      empty={<EmptyState icon="shield" title={emptyTitle ?? 'No audit entries match'} description={emptyDescription ?? 'Try another entity, action, organisation, actor or date range.'} action={emptyAction} />}
    />
  );
}
