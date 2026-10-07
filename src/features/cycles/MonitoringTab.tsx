import { useCycleMonitoring } from '@/api/cycles';
import { type CycleDetail, type MonitoringOperator } from '@/api/cycles.types';
import { Card, type Column, EmptyState, Pill, Skeleton, Stat, statusVariant, Table } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt, formatPct } from '@/lib/format';

import { pct, SAMPLING_STATUS_LABELS } from './cycleLabels';
import styles from './cycles.module.css';

/** Monitoring (REQUIREMENTS §24): sampling and assessment totals, then Airport → ACO drill-down. */
export function MonitoringTab({ cycle }: { cycle: CycleDetail }) {
  const query = useCycleMonitoring(cycle.id, cycle.status !== 'DRAFT');

  if (cycle.status === 'DRAFT') {
    return <EmptyState icon="chart" title="Nothing to monitor yet" description="Monitoring starts when the cycle is published and participants exist." />;
  }
  if (query.isError) return <QueryError error={query.error} title="Could not load monitoring" onRetry={() => void query.refetch()} />;

  const m = query.data;
  const loading = query.isPending;

  const columns: Column<MonitoringOperator>[] = [
    {
      id: 'name',
      header: 'Operator',
      cell: (o) => (
        <span className={styles.rowTitle}>
          <span className={styles.rowName}>{o.name}</span>
          <span className={styles.rowCode}>{o.code}</span>
        </span>
      ),
    },
    { id: 'sampling', header: 'Sampling', width: 140, cell: (o) => <Pill variant={statusVariant(o.sampling.status)}>{SAMPLING_STATUS_LABELS[o.sampling.status]}</Pill> },
    {
      id: 'selected',
      header: 'Selected / required',
      width: 160,
      align: 'right',
      mono: true,
      cell: (o) => `${formatInt(o.sampling.selectedCount)} / ${formatInt(o.sampling.required)}`,
    },
    { id: 'invited', header: 'Invited', width: 90, align: 'right', mono: true, hideBelow: 'sm', cell: (o) => formatInt(o.invited) },
    { id: 'started', header: 'Started', width: 90, align: 'right', mono: true, hideBelow: 'sm', cell: (o) => formatInt(o.started) },
    { id: 'completed', header: 'Completed', width: 110, align: 'right', mono: true, cell: (o) => formatInt(o.completed) },
    { id: 'rate', header: 'Completion', width: 110, align: 'right', mono: true, hideBelow: 'md', cell: (o) => (o.invited > 0 ? formatPct(pct(o.completed, o.invited)) : '—') },
  ];

  return (
    <div className={styles.detail}>
      <div className={styles.statsSplit}>
        <section className={styles.statGroup} aria-label="Sampling">
          <h3 className={styles.sectionTitle}>Sampling</h3>
          <div className={styles.stats}>
            <Stat label="Airports" value={formatInt(m?.sampling.airports)} loading={loading} />
            <Stat label="Operators" value={formatInt(m?.sampling.operators)} loading={loading} />
            <Stat label="Sample required" value={formatInt(m?.sampling.sampleRequired)} loading={loading} />
            <Stat label="Sample locked" value={formatInt(m?.sampling.sampleLocked)} loading={loading} />
            <Stat label="Operators locked" value={m ? `${formatInt(m.sampling.lockedOperators)} / ${formatInt(m.sampling.operators)}` : '—'} loading={loading} />
          </div>
        </section>
        <section className={styles.statGroup} aria-label="Assessment">
          <h3 className={styles.sectionTitle}>Assessment</h3>
          <div className={styles.stats}>
            <Stat label="Invites sent" value={formatInt(m?.assessment.invited)} loading={loading} />
            <Stat label="Started" value={formatInt(m?.assessment.started)} loading={loading} />
            <Stat label="Completed" value={formatInt(m?.assessment.completed)} loading={loading} />
            <Stat label="Pending" value={formatInt(m?.assessment.pending)} loading={loading} />
            <Stat label="Completion rate" value={m ? formatPct(m.assessment.completionRate) : '—'} loading={loading} />
          </div>
        </section>
      </div>

      <section aria-label="By airport">
        <h3 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-3)' }}>
          By airport
        </h3>
        {loading ? (
          <div className={styles.skeletonStack}>
            <Skeleton height={160} radius={10} />
            <Skeleton height={160} radius={10} />
          </div>
        ) : !m || m.byAirport.length === 0 ? (
          <EmptyState icon="plane" size="sm" title="No airports in this cycle" />
        ) : (
          m.byAirport.map((a) => (
            <Card key={a.airportId} as="article" className={styles.airportBlock} padding="none" title={`${a.iata} · ${a.name}`} subtitle={`${formatInt(a.operators.length)} ${a.operators.length === 1 ? 'operator' : 'operators'}`}>
              <Table caption={`${a.iata} operators`} columns={columns} rows={a.operators} rowKey={(o) => o.acoId} dense empty={<EmptyState size="sm" title="No operators" />} />
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
