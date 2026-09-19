import { useMemo, useState, type FC } from 'react';
import type {
  Airport,
  ApprovalMode,
  FormScope,
  Operator,
  OperatorState,
} from '../api/adminMaster.types';
import { bpToPct, formatDate, poolForAirport } from '../adminMaster.logic';
import { ApprovalQueue } from './ApprovalQueue';
import { MarketShareBoard } from './MarketShareBoard';
import { SaveBar } from './SaveBar';
import { SelectField } from './Fields';
import { APPROVAL_MODE_LABEL, FORM_SCOPE_LABEL, ScopeDirections, StateTag } from './StateTag';

type StateFilter = 'ALL' | OperatorState;

const STATE_FILTERS: Array<{ id: StateFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PENDING_APPROVAL', label: 'Pending' },
  { id: 'REGISTERED', label: 'Registered' },
  { id: 'SUSPENDED', label: 'Suspended' },
];

const SCOPE_OPTIONS: Array<{ value: FormScope; label: string }> = [
  { value: 'INTERNATIONAL', label: FORM_SCOPE_LABEL.INTERNATIONAL },
  { value: 'DOMESTIC', label: FORM_SCOPE_LABEL.DOMESTIC },
  { value: 'BOTH', label: FORM_SCOPE_LABEL.BOTH },
];

const MODE_OPTIONS: Array<{ value: ApprovalMode; label: string }> = [
  { value: 'ACFI_REVIEW', label: APPROVAL_MODE_LABEL.ACFI_REVIEW },
  { value: 'AUTO', label: APPROVAL_MODE_LABEL.AUTO },
];

export interface OperatorsPanelProps {
  operators: Operator[];
  airports: Airport[];
  onChange: (next: Operator[]) => void;
  onDecide: (id: string, patch: Partial<Operator>) => void;
  decidingId: string | null;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

export const OperatorsPanel: FC<OperatorsPanelProps> = ({
  operators, airports, onChange, onDecide, decidingId,
  dirty, saving, error, savedAt, onSave, onDiscard,
}) => {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
  const [airportFilter, setAirportFilter] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  const airportById = useMemo(
    () => new Map(airports.map((a) => [a.id, a])),
    [airports],
  );

  const patch = (id: string, changes: Partial<Operator>) => {
    onChange(operators.map((o) => (o.id === id ? { ...o, ...changes } : o)));
  };

  const pending = operators.filter((o) => o.state === 'PENDING_APPROVAL');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return operators
      .filter((o) => {
        if (stateFilter !== 'ALL' && o.state !== stateFilter) return false;
        if (airportFilter && o.airportId !== airportFilter) return false;
        if (q === '') return true;
        const a = airportById.get(o.airportId);
        return (
          o.name.toLowerCase().includes(q) ||
          (a ? `${a.city} ${a.iata} ${a.name}`.toLowerCase().includes(q) : false) ||
          o.contact.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ca = airportById.get(a.airportId)?.city ?? '';
        const cb = airportById.get(b.airportId)?.city ?? '';
        return ca === cb ? a.name.localeCompare(b.name) : ca.localeCompare(cb);
      });
  }, [operators, query, stateFilter, airportFilter, airportById]);

  const setState = (op: Operator, next: OperatorState) => {
    // a terminal that is not being assessed cannot hold share, or it would
    // silently shrink what everyone else at the airport is measured against
    const releases = next === 'SUSPENDED' && op.marketShareBp > 0;
    patch(op.id, {
      state: next,
      ...(releases ? { marketShareBp: 0 } : {}),
    });
    const airport = airportById.get(op.airportId);
    setNotice(
      releases
        ? `${op.name} suspended. Its ${bpToPct(op.marketShareBp)}% share at ${airport?.iata ?? 'the airport'} is released and needs reallocating below.`
        : `${op.name} is now ${next === 'ACTIVE' ? 'active' : next.toLowerCase()}.`,
    );
  };

  return (
    <>
      <ApprovalQueue
        pending={pending}
        airports={airports}
        busyId={decidingId}
        onApprove={(id, p) => onDecide(id, { ...p, state: 'ACTIVE' })}
        onDecline={(id, reason) => onDecide(id, { state: 'SUSPENDED', rejectedReason: reason })}
      />

      <section className="am-card" aria-labelledby="am-ops-h">
        <div className="am-card-head">
          <div>
            <h2 id="am-ops-h">Cargo terminal operators</h2>
            <p className="sub">
              {operators.length} terminals across {airports.length} airports. Scope and customer approval
              are set here, market share below.
            </p>
          </div>
        </div>

        <div className="am-filters">
          <label className="am-sr" htmlFor="am-op-search">Search operators</label>
          <input
            id="am-op-search"
            className="am-input am-search"
            type="search"
            placeholder="Search terminal, airport or contact"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="am-seg" role="group" aria-label="Filter by state">
            {STATE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={stateFilter === f.id}
                onClick={() => setStateFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <label className="am-sr" htmlFor="am-op-airport">Filter by airport</label>
          <select
            id="am-op-airport"
            className="am-select"
            style={{ width: 'auto' }}
            value={airportFilter}
            onChange={(e) => setAirportFilter(e.target.value)}
          >
            <option value="">Every airport</option>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.city} ({a.iata})
              </option>
            ))}
          </select>
        </div>

        {notice && (
          <p className="am-note" role="status">
            {notice}
          </p>
        )}

        <div className="am-op-row am-row-head">
          <span>Operator</span>
          <span>State</span>
          <span>Form scope</span>
          <span>Customer approval</span>
          <span className="am-right">Market share</span>
          <span className="am-right">Action</span>
        </div>

        {rows.length === 0 ? (
          <div className="am-empty">
            <b>No terminal matches</b>
            Clear the filters, or search by airport code such as BOM.
          </div>
        ) : (
          rows.map((op) => {
            const airport = airportById.get(op.airportId);
            const pool = poolForAirport(operators, op.airportId);
            const counts = op.state === 'ACTIVE' || op.state === 'REGISTERED';
            return (
              <div className="am-op-row" key={op.id}>
                <div className="am-op-cell--wide">
                  <div className="am-op-name">{op.name}</div>
                  <div className="am-op-sub">
                    {airport ? `${airport.city} · ${airport.name}` : 'Airport not matched'}
                    {airport ? <span className="am-code" style={{ marginLeft: 8 }}>{airport.iata}</span> : null}
                  </div>
                  <div className="am-op-sub">
                    {op.selfRegistered ? 'Self registered' : 'Added by ACFI'} {formatDate(op.registeredOn)}
                    {op.rejectedReason ? ` · Declined: ${op.rejectedReason}` : ''}
                  </div>
                </div>

                <div>
                  <StateTag state={op.state} />
                </div>

                {op.state === 'PENDING_APPROVAL' ? (
                  <div>
                    <ScopeDirections scope={op.formScope} />
                  </div>
                ) : (
                  <SelectField<FormScope>
                    label={`Form scope for ${op.name}`}
                    hideLabel
                    value={op.formScope ?? ''}
                    placeholder="Not set"
                    options={SCOPE_OPTIONS}
                    onChange={(v) => patch(op.id, { formScope: v })}
                  />
                )}

                <SelectField<ApprovalMode>
                  label={`Customer approval for ${op.name}`}
                  hideLabel
                  value={op.approvalMode}
                  options={MODE_OPTIONS}
                  disabled={op.state === 'PENDING_APPROVAL'}
                  onChange={(v) => patch(op.id, { approvalMode: v })}
                />

                <div className="am-right">
                  {counts ? (
                    <>
                      <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {bpToPct(op.marketShareBp)}%
                      </div>
                      <div className="am-op-sub">
                        {pool.balanced ? 'airport settled' : 'airport unsettled'}
                      </div>
                    </>
                  ) : (
                    <span className="am-hint">none</span>
                  )}
                </div>

                <div className="am-right">
                  {op.state === 'ACTIVE' && (
                    <button type="button" className="am-btn am-btn--sm am-btn--danger" onClick={() => setState(op, 'SUSPENDED')}>
                      Suspend
                    </button>
                  )}
                  {op.state === 'SUSPENDED' && (
                    <button type="button" className="am-btn am-btn--sm" onClick={() => setState(op, 'ACTIVE')}>
                      Reinstate
                    </button>
                  )}
                  {op.state === 'REGISTERED' && (
                    <button
                      type="button"
                      className="am-btn am-btn--sm"
                      disabled={op.formScope === null}
                      onClick={() => setState(op, 'ACTIVE')}
                    >
                      Activate
                    </button>
                  )}
                  {op.state === 'PENDING_APPROVAL' && (
                    <button
                      type="button"
                      className="am-btn am-btn--sm am-btn--quiet"
                      onClick={() => document.getElementById('am-queue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      <MarketShareBoard operators={operators} airports={airports} onPatch={patch} />

      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        savedAt={savedAt}
        summary="Operator records have unsaved edits."
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </>
  );
};
