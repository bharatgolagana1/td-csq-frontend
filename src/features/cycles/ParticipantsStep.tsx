import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { type Airport } from '@/api/airports.types';
import { type Operator } from '@/api/operators.types';
import { Icon } from '@/design/icons';
import { Checkbox, Skeleton, Switch, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { useShell } from '@/shell/ShellContext';
import { formatInt } from '@/lib/format';

import { airportShare, marketSharePath } from './airportShare';
import { useBuilder } from './builderContext';
import { CYCLE_TYPE_LABELS, participantSurveyTypes } from './cycleLabels';
import styles from './cycles.module.css';

/** "Shares total 85 % — fix market shares", linking to that airport's shares. */
function ShareFlag({ airport, total, className }: { airport: Airport; total: number; className: string | undefined }) {
  const { href } = useShell();
  return (
    <span className={className}>
      <Icon name="warning" size={16} />
      Shares total {total} % —{' '}
      <Link to={href(marketSharePath(airport.id))} aria-label={`Fix market shares at ${airport.iata}`}>
        fix market shares
      </Link>
    </span>
  );
}

function AirportGroup({ airport, operators }: { airport: Airport; operators: Operator[] }) {
  const { form, shareTotals } = useBuilder();
  const { watch, setValue } = form;
  const type = watch('type');
  const selected = watch('participatingAcoIds');
  const share = airportShare(airport.id, operators, shareTotals);

  const toggle = (id: string, on: boolean) => {
    const next = on ? [...new Set([...selected, id])] : selected.filter((x) => x !== id);
    setValue('participatingAcoIds', next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <section className={styles.airportGroup} aria-label={`${airport.iata} operators`}>
      <div className={styles.airportHead}>
        <span className={styles.airportTitle}>
          {airport.iata}
          <small>{airport.name}</small>
        </span>
        <span className={styles.shareTotal}>
          {operators.length === 0 ? (
            <span className={styles.shareWarn}>
              <Icon name="warning" size={16} />
              No active operators
            </span>
          ) : share.ok ? (
            <>Shares {share.total} %</>
          ) : (
            <ShareFlag airport={airport} total={share.total} className={styles.shareWarn} />
          )}
        </span>
      </div>
      <div className={styles.operatorRows}>
        {operators.length === 0 ? (
          <p className={styles.sectionHint} style={{ padding: '8px 12px' }}>
            No active operators at this airport, so its shares total 0 % and publishing would be refused. Remove it from the cycle.
          </p>
        ) : null}
        {operators.map((o) => {
          const types = participantSurveyTypes(type, o.operations);
          const eligible = types.length > 0;
          return (
            <div key={o.id} className={styles.operatorRow}>
              <Checkbox
                label={
                  <span>
                    <span className={styles.operatorName}>{o.name}</span>
                    <span className={styles.operatorCode}>{o.code}</span>
                  </span>
                }
                description={eligible ? undefined : `Does not operate ${CYCLE_TYPE_LABELS[type].toLowerCase()} cargo; not eligible for this cycle.`}
                checked={selected.includes(o.id)}
                disabled={!eligible}
                onChange={(e) => toggle(o.id, e.target.checked)}
              />
              <span className={styles.pills}>
                {types.map((t) => (
                  <Tag key={t} tone="outline">
                    {CYCLE_TYPE_LABELS[t]}
                  </Tag>
                ))}
              </span>
              <span className={styles.operatorShare}>{o.currentShare === undefined || o.currentShare === null ? '—' : `${o.currentShare} %`}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** One airport in the picker: its operators, and the share total publishing would check. */
function AirportOption({ airport, operators, checked, onToggle }: { airport: Airport; operators: Operator[]; checked: boolean; onToggle: (on: boolean) => void }) {
  const { shareTotals } = useBuilder();
  const count = airport.operatorCount;
  const share = airportShare(airport.id, operators, shareTotals);
  return (
    <div className={styles.checkRow}>
      <Checkbox
        label={`${airport.iata} · ${airport.name}`}
        description={
          count === 0
            ? checked
              ? 'No active operators — remove it; publishing would be refused'
              : 'No active operators — cannot take part'
            : `${formatInt(count)} active ${count === 1 ? 'operator' : 'operators'}`
        }
        checked={checked}
        disabled={count === 0 && !checked}
        onChange={(e) => onToggle(e.target.checked)}
      />
      {count > 0 && !share.ok ? <ShareFlag airport={airport} total={share.total} className={styles.checkRowFlag} /> : null}
    </div>
  );
}

/**
 * Step 4 — airports multi-select; selecting an airport auto-lists its active
 * operators (eligible for the cycle's type) as participants, each toggleable.
 * Airports without an active operator cannot take part (their shares total 0,
 * so publishing would be refused): they sit behind a switch, disabled. Every
 * airport whose current shares do not total 100 is flagged with a link to fix
 * them, because publishing refuses it.
 */
export function ParticipantsStep() {
  const { form, airports, operators, referenceLoading, referenceError } = useBuilder();
  const { watch, setValue, formState } = form;
  const type = watch('type');
  const airportIds = watch('participatingAirportIds');
  const acoIds = watch('participatingAcoIds');
  const [showEmpty, setShowEmpty] = useState(false);

  const byAirport = useMemo(() => {
    const map = new Map<string, Operator[]>();
    operators.forEach((o) => {
      const list = map.get(o.airport.id) ?? [];
      list.push(o);
      map.set(o.airport.id, list);
    });
    return map;
  }, [operators]);

  const toggleAirport = (airport: Airport, on: boolean) => {
    const ops = byAirport.get(airport.id) ?? [];
    const nextAirports = on ? [...new Set([...airportIds, airport.id])] : airportIds.filter((x) => x !== airport.id);
    const eligibleIds = ops.filter((o) => participantSurveyTypes(type, o.operations).length > 0).map((o) => o.id);
    const nextAcos = on ? [...new Set([...acoIds, ...eligibleIds])] : acoIds.filter((id) => !ops.some((o) => o.id === id));
    setValue('participatingAirportIds', nextAirports, { shouldDirty: true, shouldValidate: true });
    setValue('participatingAcoIds', nextAcos, { shouldDirty: true, shouldValidate: true });
  };

  // A selected airport stays in the main list (so it can be removed) even when it has lost its operators.
  const listed = airports.filter((a) => a.operatorCount > 0 || airportIds.includes(a.id));
  const empty = airports.filter((a) => a.operatorCount === 0 && !airportIds.includes(a.id));
  const selectedAirports = airports.filter((a) => airportIds.includes(a.id));

  if (referenceError) return <QueryError error={referenceError} title="Could not load airports and operators" />;

  const option = (a: Airport) => <AirportOption key={a.id} airport={a} operators={byAirport.get(a.id) ?? []} checked={airportIds.includes(a.id)} onToggle={(on) => toggleAirport(a, on)} />;

  return (
    <div className={styles.participants}>
      <div className={styles.form}>
        <div>
          <h3 className={styles.sectionTitle}>Airports</h3>
          <p className={styles.sectionHint}>
            {formatInt(airportIds.length)} selected · {formatInt(acoIds.length)} operators
          </p>
        </div>
        {referenceLoading ? (
          <Skeleton lines={6} />
        ) : (
          <>
            <div className={styles.checkList} role="group" aria-label="Participating airports">
              {listed.map(option)}
              {listed.length === 0 ? <p className={styles.sectionHint}>{airports.length === 0 ? 'No active airports yet.' : 'No airport has an active operator yet.'}</p> : null}
              {showEmpty && empty.length > 0 ? (
                <div className={styles.emptyAirports} aria-label="Airports without operators">
                  {empty.map(option)}
                </div>
              ) : null}
            </div>
            {empty.length > 0 ? (
              <Switch
                size="sm"
                checked={showEmpty}
                onChange={setShowEmpty}
                label={`Show ${formatInt(empty.length)} ${empty.length === 1 ? 'airport' : 'airports'} without operators`}
                description="Listed for reference; an airport needs an active operator to take part."
              />
            ) : null}
          </>
        )}
        {formState.errors.participatingAirportIds?.message ? <p className={styles.errorBox}>{formState.errors.participatingAirportIds.message}</p> : null}
        {formState.errors.participatingAcoIds?.message ? <p className={styles.errorBox}>{formState.errors.participatingAcoIds.message}</p> : null}
      </div>
      <div>
        <h3 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-3)' }}>
          Operators
        </h3>
        {selectedAirports.length === 0 ? (
          <p className={styles.tlEmpty}>Select an airport to list its operators.</p>
        ) : (
          selectedAirports.map((a) => <AirportGroup key={a.id} airport={a} operators={byAirport.get(a.id) ?? []} />)
        )}
      </div>
    </div>
  );
}
