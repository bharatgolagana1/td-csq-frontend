import { useState } from 'react';

import { useCycleParticipants } from '@/api/cycles';
import { type CycleDetail, type CycleParticipant, type SamplingStatus } from '@/api/cycles.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, Card, type Column, EmptyState, type MenuItem, Pagination, Pill, Select, Skeleton, statusVariant, Table, Tag, Toolbar, ToolbarCount } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { cn } from '@/lib/cn';
import { formatInt, formatRelative } from '@/lib/format';

import { CYCLE_TYPE_LABELS, pct, SAMPLING_STATUS_LABELS } from './cycleLabels';
import styles from './cycles.module.css';
import { UnlockDialog } from './UnlockDialog';

const SAMPLING_OPTIONS = [
  { value: '', label: 'All sampling statuses' },
  ...(['NOT_STARTED', 'IN_PROGRESS', 'LOCKED', 'UNLOCKED'] as SamplingStatus[]).map((s) => ({ value: s, label: SAMPLING_STATUS_LABELS[s] })),
];

function Counter({ p }: { p: CycleParticipant }) {
  const met = p.sampling.selectedCount >= p.requiredSampleSize;
  return (
    <span className={styles.counter}>
      <span className={cn(styles.counterText, met && styles.counterMet)}>
        {formatInt(p.sampling.selectedCount)} / {formatInt(p.requiredSampleSize)}
      </span>
      <span className={styles.meterTrack} role="progressbar" aria-label="Selected of required" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct(p.sampling.selectedCount, p.requiredSampleSize))}>
        <span className={styles.meterFill} style={{ width: `${pct(p.sampling.selectedCount, p.requiredSampleSize)}%` }} />
      </span>
    </span>
  );
}

/** Participants: per-operator sampling status + counter, invited / started / completed, unlock with reason. */
export function ParticipantsTab({ cycle }: { cycle: CycleDetail }) {
  const { hasTask } = useSession();
  const canUnlock = hasTask('sampling.unlock');
  const [samplingStatus, setSamplingStatus] = useState<SamplingStatus | ''>('');
  const [airportId, setAirportId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [unlocking, setUnlocking] = useState<CycleParticipant | null>(null);

  const query = useCycleParticipants(cycle.id, { page, pageSize, samplingStatus: samplingStatus || undefined, airportId: airportId || undefined, sort: 'operator.name' }, cycle.status !== 'DRAFT');
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  if (cycle.status === 'DRAFT') {
    return (
      <EmptyState
        icon="users"
        title="Participants are created when the cycle is published"
        description={`${formatInt(cycle.participatingAirportIds.length)} airports and ${formatInt(cycle.participatingAcoIds.length)} operators are listed on the draft.`}
      />
    );
  }

  const airportOptions = [
    { value: '', label: 'All airports' },
    ...Array.from(new Map(cycle.participantList.map((p) => [p.airport.id, p.airport])).values())
      .sort((a, b) => a.iata.localeCompare(b.iata))
      .map((a) => ({ value: a.id, label: `${a.iata} · ${a.name}` })),
  ];

  const columns: Column<CycleParticipant>[] = [
    {
      id: 'operator.name',
      header: 'Operator',
      cell: (p) => (
        <span className={styles.rowTitle}>
          <span className={styles.rowName}>{p.operator.name}</span>
          <span className={styles.rowCode}>
            {p.operator.code} · {p.airport.iata}
          </span>
        </span>
      ),
    },
    {
      id: 'surveyTypes',
      header: 'Surveys',
      width: 210,
      hideBelow: 'md',
      cell: (p) => (
        <span className={styles.pills} style={{ flexWrap: 'nowrap' }}>
          {p.surveyTypes.map((t) => (
            <Tag key={t} tone="outline">
              {CYCLE_TYPE_LABELS[t]}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      id: 'sampling',
      header: 'Sampling',
      width: 150,
      cell: (p) => (
        <Pill variant={statusVariant(p.sampling.status)} title={p.sampling.lockedAt ? `Locked ${formatRelative(p.sampling.lockedAt)}` : undefined}>
          {SAMPLING_STATUS_LABELS[p.sampling.status]}
        </Pill>
      ),
    },
    { id: 'counter', header: 'Selected / required', width: 150, cell: (p) => <Counter p={p} /> },
    { id: 'invited', header: 'Invited', width: 90, align: 'right', mono: true, hideBelow: 'sm', cell: (p) => formatInt(p.stats.invited) },
    { id: 'started', header: 'Started', width: 90, align: 'right', mono: true, hideBelow: 'sm', cell: (p) => formatInt(p.stats.started) },
    { id: 'completed', header: 'Completed', width: 110, align: 'right', mono: true, cell: (p) => formatInt(p.stats.completed) },
    { id: 'reminders', header: 'Reminders', width: 110, align: 'right', mono: true, hideBelow: 'md', cell: (p) => (p.reminders.sent > 0 ? `${formatInt(p.reminders.sent)}` : '—') },
  ];

  const rowActions = canUnlock
    ? (p: CycleParticipant): MenuItem[] =>
        p.sampling.status === 'LOCKED'
          ? [{ id: 'unlock', label: 'Unlock sample…', icon: <Icon name="unlock" size={16} />, danger: true, onSelect: () => setUnlocking(p) }]
          : [{ id: 'none', label: 'Nothing to unlock', disabled: true, onSelect: () => undefined }]
    : undefined;

  return (
    <>
      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'participant' : 'participants'}`}</ToolbarCount>}>
        <div className={styles.filters}>
          <Select
            aria-label="Sampling status"
            size="sm"
            options={SAMPLING_OPTIONS}
            value={samplingStatus}
            onChange={(e) => {
              setSamplingStatus(e.target.value as SamplingStatus | '');
              setPage(1);
            }}
          />
          <Select
            aria-label="Airport"
            size="sm"
            options={airportOptions}
            value={airportId}
            onChange={(e) => {
              setAirportId(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Toolbar>
      {query.isError ? (
        <QueryError error={query.error} title="Could not load participants" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table
              caption="Participants"
              columns={columns}
              rows={rows}
              rowKey={(p) => p.id}
              loading={query.isPending}
              rowActions={rowActions}
              empty={<EmptyState icon="users" title="No participants match" description="Try another sampling status or airport." />}
            />
          </div>
          <div className={styles.cards} aria-label="Participants">
            {query.isPending ? (
              <div className={styles.skeletonStack}>
                <Skeleton height={140} radius={10} />
                <Skeleton height={140} radius={10} />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState icon="users" title="No participants match" description="Try another sampling status or airport." />
            ) : (
              rows.map((p) => (
                <Card key={p.id} as="article" padding="sm">
                  <div className={styles.cardHead}>
                    <span className={styles.rowTitle}>
                      <span className={styles.rowName}>{p.operator.name}</span>
                      <span className={styles.rowCode}>
                        {p.operator.code} · {p.airport.iata}
                      </span>
                    </span>
                    <Pill variant={statusVariant(p.sampling.status)} size="sm">
                      {SAMPLING_STATUS_LABELS[p.sampling.status]}
                    </Pill>
                  </div>
                  <dl className={styles.cardRows}>
                    <dt>Selected</dt>
                    <dd>
                      <Counter p={p} />
                    </dd>
                    <dt>Surveys</dt>
                    <dd>{p.surveyTypes.map((t) => CYCLE_TYPE_LABELS[t]).join(' · ')}</dd>
                    <dt>Invited</dt>
                    <dd className={styles.counts}>
                      {formatInt(p.stats.invited)} · started {formatInt(p.stats.started)} · completed {formatInt(p.stats.completed)}
                    </dd>
                    <dt>Reminders</dt>
                    <dd className={styles.counts}>{p.reminders.sent > 0 ? formatInt(p.reminders.sent) : '—'}</dd>
                  </dl>
                  {canUnlock && p.sampling.status === 'LOCKED' ? (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <Button size="sm" variant="secondary" icon={<Icon name="unlock" size={16} />} onClick={() => setUnlocking(p)}>
                        Unlock sample…
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))
            )}
          </div>
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
      )}
      <UnlockDialog participant={unlocking} onClose={() => setUnlocking(null)} />
    </>
  );
}
