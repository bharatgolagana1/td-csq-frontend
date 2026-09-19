import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import Orbis from '../../shared/orbis/Orbis';
import type { Customer, CustomerDraft, ImportRow, SamplingData } from './api/sampling.types';
import type { SamplingScenario } from './api/sampling.mock';
import {
  SCENARIOS,
  addCustomer,
  commitImport,
  fetchSampling,
  lockNeedsApproval,
  lockSample,
  removeCustomers,
} from './api/sampling.mock';
import { evaluateLockGate, findIntegritySignals, plural } from './api/sampling.logic';
import {
  EMPTY_FILTERS,
  filterCustomers,
  hasActiveFilters,
  sortCustomers,
  type DirectoryFilters,
  type SortKey,
  type SortState,
} from './directory';
import CycleStrip from './components/CycleStrip';
import DirectoryToolbar from './components/DirectoryToolbar';
import DirectoryTable from './components/DirectoryTable';
import SelectionBar from './components/SelectionBar';
import LockGate from './components/LockGate';
import LockedBanner from './components/LockedBanner';
import IntegrityPanel from './components/IntegrityPanel';
import AddCustomerDialog from './components/AddCustomerDialog';
import ImportDialog from './components/ImportDialog';
import Dialog from './components/Dialog';
import { DeniedView, EmptyDirectory, ErrorView } from './components/StateViews';
import '../../theme/tokens.css';
import './sampling.css';

/** Preview scenarios travel in the URL because the states that matter here
    (empty, locked, awaiting approval, denied) cannot be produced by clicking
    until the API exists. Drop this with the mock. */
function readScenario(): SamplingScenario {
  if (typeof window === 'undefined') return 'default';
  const requested = new URLSearchParams(window.location.search).get('scenario');
  return SCENARIOS.includes(requested as SamplingScenario) ? (requested as SamplingScenario) : 'default';
}

export const SamplingPage: FC = () => {
  const [scenario] = useState<SamplingScenario>(readScenario);
  const [data, setData] = useState<SamplingData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Customer[] | null>(null);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const load = useCallback(() => {
    setData(null);
    setLoadFailed(false);
    fetchSampling(scenario)
      .then((loaded) => {
        setData(loaded);
        // A locked sample shows its own membership, so the table reads the same
        // way before and after the lock.
        setSelected(new Set(loaded.lock ? loaded.lock.memberIds : []));
      })
      .catch(() => setLoadFailed(true));
  }, [scenario]);

  useEffect(load, [load]);

  const customers = useMemo(() => data?.customers ?? [], [data]);
  const locked = data?.lock != null;

  const findings = useMemo(
    () => (data ? findIntegritySignals(customers, data.operator.emailDomain, data.serverNow) : []),
    [customers, data],
  );

  const flags = useMemo(() => {
    const map = new Map<string, string[]>();
    findings.forEach((finding) => {
      finding.customerIds.forEach((id) => {
        const reasons = map.get(id);
        if (reasons) reasons.push(finding.headline);
        else map.set(id, [finding.headline]);
      });
    });
    return map;
  }, [findings]);

  const visible = useMemo(
    () => sortCustomers(filterCustomers(customers, filters, selected), sort),
    [customers, filters, selected, sort],
  );

  const gate = useMemo(
    () => evaluateLockGate(customers.length, selected.size, data?.cycle.minimumSampleSize ?? 0),
    [customers.length, selected.size, data],
  );

  const onSort = (key: SortKey) =>
    setSort((current) => ({ key, dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc' }));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleVisible = (checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach((row) => (checked ? next.add(row.id) : next.delete(row.id)));
      return next;
    });

  const onAdd = async (draft: CustomerDraft) => {
    setSaving(true);
    try {
      const created = await addCustomer(draft);
      setData((current) => (current ? { ...current, customers: [...current.customers, created] } : current));
      setAnnouncement(`${created.name} was added to the directory.`);
    } finally {
      setSaving(false);
    }
  };

  const onImported = (imported: Customer[]) => {
    if (imported.length === 0) return;
    setData((current) => (current ? { ...current, customers: [...current.customers, ...imported] } : current));
    setAnnouncement(`${imported.length} ${plural(imported.length, 'contact was', 'contacts were')} imported.`);
  };

  const onCommitImport = (rows: ImportRow[]) => commitImport(rows);

  const confirmRemoval = async () => {
    if (!pendingRemoval) return;
    const ids = pendingRemoval.map((customer) => customer.id);
    setRemoving(true);
    try {
      await removeCustomers(ids);
      const doomed = new Set(ids);
      setData((current) =>
        current ? { ...current, customers: current.customers.filter((c) => !doomed.has(c.id)) } : current,
      );
      setSelected((current) => new Set([...current].filter((id) => !doomed.has(id))));
      setAnnouncement(`${ids.length} ${plural(ids.length, 'contact was', 'contacts were')} removed.`);
      setPendingRemoval(null);
    } finally {
      setRemoving(false);
    }
  };

  const onLock = async () => {
    if (!data || !gate.canLock) return;
    setLocking(true);
    setLockError(null);
    try {
      const created = await lockSample([...selected], gate.shortfall, lockNeedsApproval(scenario));
      setData((current) => (current ? { ...current, lock: created } : current));
      setAnnouncement('The sample is locked.');
    } catch {
      setLockError('The sample could not be locked. Nothing was changed, so you can try again.');
    } finally {
      setLocking(false);
    }
  };

  if (loadFailed) {
    return (
      <div className="smp">
        <ErrorView onRetry={load} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="smp smp-center">
        <Orbis label="Loading your customer directory" />
      </div>
    );
  }

  if (!data.permissions.canViewDirectory) {
    return (
      <div className="smp">
        <DeniedView reason={data.permissions.deniedReason ?? 'This directory is restricted.'} />
      </div>
    );
  }

  const canEdit = data.permissions.canEditDirectory && !locked;
  const canSelect = data.permissions.canLockSample && !locked;
  const visibleSelected = visible.filter((row) => selected.has(row.id)).length;

  return (
    <div className="smp">
      <p className="smp-sr" role="status" aria-live="polite">
        {announcement}
      </p>

      <header className="smp-head">
        <div>
          <div className="smp-eyebrow">
            Cargo Service Quality · {data.operator.airportName} ({data.operator.airportIata}) ·{' '}
            {data.operator.terminalName}
          </div>
          <h1>Customer directory and sampling</h1>
        </div>
        <div className="smp-headside">
          <span className="smp-chip">Illustrative · sample data</span>
          {canEdit ? (
            <>
              <button type="button" className="smp-btn" onClick={() => setImportOpen(true)}>
                Import customers
              </button>
              <button type="button" className="smp-btn smp-btn--primary" onClick={() => setAddOpen(true)}>
                Add a customer
              </button>
            </>
          ) : null}
        </div>
      </header>

      <CycleStrip cycle={data.cycle} serverNow={data.serverNow} directorySize={customers.length} />

      {!locked && !data.permissions.canEditDirectory && data.permissions.deniedReason ? (
        <p className="smp-note" style={{ marginBottom: 16 }}>
          {data.permissions.deniedReason}
        </p>
      ) : null}

      <div className="smp-layout">
        <section className="smp-card" aria-label="Customer directory">
          {customers.length === 0 ? (
            <EmptyDirectory
              minimum={data.cycle.minimumSampleSize}
              canEdit={canEdit}
              onAdd={() => setAddOpen(true)}
              onImport={() => setImportOpen(true)}
            />
          ) : (
            <>
              <DirectoryToolbar
                filters={filters}
                onChange={setFilters}
                visibleCount={visible.length}
                totalCount={customers.length}
                locked={!canSelect}
              />

              {filters.restrictToIds ? (
                <div className="smp-selbar">
                  <span className="n">Showing {filters.restrictToIds.length} flagged contacts</span>
                  <button
                    type="button"
                    className="smp-btn smp-btn--ghost"
                    onClick={() => setFilters({ ...filters, restrictToIds: null })}
                  >
                    Show the whole directory
                  </button>
                </div>
              ) : null}

              {canSelect ? (
                <SelectionBar
                  selectedCount={selected.size}
                  visibleCount={visible.length}
                  visibleSelectedCount={visibleSelected}
                  minimum={data.cycle.minimumSampleSize}
                  onSelectAllVisible={() => toggleVisible(true)}
                  onClear={() => setSelected(new Set())}
                  onRemoveSelected={() =>
                    setPendingRemoval(customers.filter((customer) => selected.has(customer.id)))
                  }
                  canRemove={canEdit}
                  busy={removing}
                />
              ) : null}

              {visible.length === 0 ? (
                <p className="smp-nomatch">
                  No contact matches these filters.{' '}
                  {hasActiveFilters(filters) ? (
                    <button type="button" className="smp-btn smp-btn--ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
                      Clear filters
                    </button>
                  ) : null}
                </p>
              ) : (
                <DirectoryTable
                  rows={visible}
                  selected={selected}
                  flags={flags}
                  sort={sort}
                  onSort={onSort}
                  onToggle={toggle}
                  onToggleVisible={toggleVisible}
                  onRemove={(customer) => setPendingRemoval([customer])}
                  selectable={canSelect}
                  removable={canEdit}
                />
              )}
            </>
          )}
        </section>

        <aside className="smp-side">
          {data.lock ? (
            <LockedBanner lock={data.lock} cycle={data.cycle} directorySize={customers.length} />
          ) : (
            <LockGate
              gate={gate}
              selectedCount={selected.size}
              directorySize={customers.length}
              minimum={data.cycle.minimumSampleSize}
              canLock={data.permissions.canLockSample}
              deniedReason={data.permissions.deniedReason}
              requiresApproval={lockNeedsApproval(scenario)}
              flaggedCount={flags.size}
              busy={locking}
              error={lockError}
              onLock={onLock}
            />
          )}

          {customers.length > 0 ? (
            <IntegrityPanel
              findings={findings}
              locked={locked}
              restrictedIds={filters.restrictToIds}
              onShow={(ids) => setFilters({ ...filters, restrictToIds: ids, onlySelected: false })}
              onShowAll={() => setFilters({ ...filters, restrictToIds: null })}
            />
          ) : null}
        </aside>
      </div>

      <p className="smp-foot">
        Confidential by design. These contact details are held for this assessment cycle only, are visible to
        ACFI and to this terminal, and are never published. Results are shared with each cargo handling agency
        individually and are not made public at any stage of the exercise.
      </p>

      <AddCustomerDialog
        open={addOpen}
        existing={customers}
        operatorDomain={data.operator.emailDomain}
        busy={saving}
        onClose={() => setAddOpen(false)}
        onAdd={onAdd}
      />

      <ImportDialog
        open={importOpen}
        existing={customers}
        onClose={() => setImportOpen(false)}
        onCommit={onCommitImport}
        onImported={onImported}
      />

      <Dialog
        open={pendingRemoval !== null}
        title={
          pendingRemoval && pendingRemoval.length === 1
            ? `Remove ${pendingRemoval[0].name}?`
            : `Remove ${pendingRemoval?.length ?? 0} contacts?`
        }
        subtitle="Removing a contact takes them out of your directory for this cycle. Anything they have already answered is kept."
        onClose={() => setPendingRemoval(null)}
        footer={
          <>
            <button type="button" className="smp-btn" onClick={() => setPendingRemoval(null)} disabled={removing}>
              Keep them
            </button>
            <button
              type="button"
              className="smp-btn smp-btn--danger"
              onClick={() => void confirmRemoval()}
              disabled={removing}
            >
              {removing ? 'Removing...' : 'Remove'}
            </button>
          </>
        }
      >
        <ul className="smp-rejects">
          {(pendingRemoval ?? []).slice(0, 8).map((customer) => (
            <li key={customer.id}>
              <b>{customer.name}</b> · {customer.company} · {customer.email}
            </li>
          ))}
          {pendingRemoval && pendingRemoval.length > 8 ? (
            <li>and {pendingRemoval.length - 8} more</li>
          ) : null}
        </ul>
      </Dialog>
    </div>
  );
};

export default SamplingPage;
