import { useEffect, useMemo, useState, type FC } from 'react';
import Orbis from '../../shared/orbis/Orbis';
import { fetchApprovalQueue } from './api/approvals.mock';
import type { ApprovalQueueData, QueueRow } from './api/approvals.types';
import { BatchDetail } from './components/BatchDetail';
import { QueueTable } from './components/QueueTable';
import { QueueToolbar } from './components/QueueToolbar';
import { ROLE_LABEL } from './lib/labels';
import {
  CLEARED_FILTERS,
  cycleOptions,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  filterRows,
  riskIndex,
  sortRows,
  type QueueFilters,
  type SortKey,
  type SortState,
} from './lib/queue';
import { totalFlags } from './lib/risk';
import '../../theme/tokens.css';
import './approvals.css';

/** Numeric columns read high to low first, names read A to Z first. */
const DEFAULT_DIR: Record<SortKey, SortState['dir']> = {
  RISK: 'desc',
  SLA: 'asc',
  SUBMITTED: 'desc',
  OPERATOR: 'asc',
  CONTACTS: 'asc',
  FLAGS: 'desc',
  STATUS: 'asc',
};

export const ApprovalsPage: FC = () => {
  const [queue, setQueue] = useState<ApprovalQueueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<QueueFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    fetchApprovalQueue()
      .then((d) => {
        if (live) setQueue(d);
      })
      .catch(() => {
        if (live) setError('The approval queue could not be loaded.');
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  const rows = useMemo(() => queue?.rows ?? [], [queue]);
  const risks = useMemo(() => riskIndex(rows), [rows]);
  const visible = useMemo(
    () => sortRows(filterRows(rows, filters), sort, risks),
    [rows, filters, sort, risks],
  );

  const awaiting = rows.filter((r) => r.status === 'AWAITING_REVIEW');
  const overdue = awaiting.filter((r) => new Date(r.slaDueAt).getTime() < Date.now());

  const onRowChanged = (row: QueueRow) =>
    setQueue((q) =>
      q ? { ...q, rows: q.rows.map((r) => (r.batchId === row.batchId ? row : r)) } : q,
    );

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: DEFAULT_DIR[key] }));

  if (error) {
    return (
      <div className="csq-ap">
        <div className="csq-ap-card">
          <div className="csq-ap-empty">
            <b>{error}</b>
            Nothing has been changed. Try again, and if it keeps failing the sampling service is
            probably down.
            <div style={{ marginTop: 16 }}>
              <button type="button" className="csq-ap-btn" onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="csq-ap csq-ap-center">
        <Orbis label="Loading the approval queue" />
      </div>
    );
  }

  if (queue.viewer.role !== 'SUPER_ADMIN') {
    return (
      <div className="csq-ap">
        <div className="csq-ap-card">
          <div className="csq-ap-empty">
            <b>This console is for ACFI Super Admins</b>
            You are signed in as {queue.viewer.name}, {ROLE_LABEL[queue.viewer.role].toLowerCase()}.
            Approving a customer sample decides who grades an operator, so the permission is held
            narrowly. Ask ACFI to change your role if you need it.
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="csq-ap">
        <BatchDetail
          batchId={selected}
          viewer={queue.viewer}
          onBack={() => setSelected(null)}
          onRowChanged={onRowChanged}
        />
        <p className="csq-ap-conf">
          Confidential by design. Sampling decisions, reasons and scores are shared with each cargo
          handling agency individually and are not made public at any stage of the exercise.
        </p>
      </div>
    );
  }

  return (
    <div className="csq-ap">
      <header className="csq-ap-head">
        <div>
          <div className="csq-ap-eyebrow">Cargo Service Quality · Super Admin</div>
          <h1>Sampling approvals</h1>
          <p className="csq-ap-sub">
            The operator being assessed chooses its own customer assessors. This queue is where that
            choice is checked before a sample is locked into a cycle.
          </p>
        </div>
        <div className="csq-ap-headside">
          <span className="csq-ap-sample">Illustrative · sample data</span>
          <div className="csq-ap-viewer">
            <b>{queue.viewer.name}</b>
            {ROLE_LABEL[queue.viewer.role]}
          </div>
        </div>
      </header>

      <div className="csq-ap-stats">
        <div className="csq-ap-stat">
          <div className="k">Awaiting review</div>
          <div className="v">{awaiting.length}</div>
          <div className="n">Locked samples with no decision yet</div>
        </div>
        <div className="csq-ap-stat">
          <div className="k">Past deadline</div>
          <div className="v" style={{ color: overdue.length > 0 ? 'var(--csq-r1)' : 'var(--csq-ink)' }}>
            {overdue.length}
          </div>
          <div className="n">Operators waiting longer than the SLA</div>
        </div>
        <div className="csq-ap-stat">
          <div className="k">Below minimum</div>
          <div className="v">
            {awaiting.filter((r) => r.contactCount < r.minimumContacts).length}
          </div>
          <div className="n">Cannot be approved as submitted</div>
        </div>
        <div className="csq-ap-stat">
          <div className="k">On automatic</div>
          <div className="v" style={{ color: 'var(--csq-r2)' }}>
            {new Set(rows.filter((r) => r.approvalMode === 'AUTOMATIC').map((r) => r.operatorId)).size}
          </div>
          <div className="n">Operators whose samples skip this queue</div>
        </div>
      </div>

      <div className="csq-ap-card">
        <QueueToolbar
          filters={filters}
          cycles={cycleOptions(rows)}
          showing={visible.length}
          total={rows.length}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      <div className="csq-ap-card">
        {rows.length === 0 ? (
          <div className="csq-ap-empty">
            <b>Nothing has been submitted yet</b>
            Locked customer samples appear here as operators finish their sampling windows.
          </div>
        ) : visible.length === 0 ? (
          <div className="csq-ap-empty">
            <b>No batch matches these filters</b>
            {rows.filter((r) => totalFlags(r.flags) > 0).length} of {rows.length} batches carry an
            integrity signal. Widen the filters to find them.
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="csq-ap-btn"
                onClick={() => setFilters(CLEARED_FILTERS)}
              >
                Show every batch
              </button>
            </div>
          </div>
        ) : (
          <QueueTable
            rows={visible}
            risks={risks}
            sort={sort}
            onSort={onSort}
            onOpen={setSelected}
          />
        )}
      </div>

      <p className="csq-ap-conf">
        Confidential by design. Sampling decisions, reasons and scores are shared with each cargo
        handling agency individually and are not made public at any stage of the exercise.
      </p>
    </div>
  );
};

export default ApprovalsPage;
