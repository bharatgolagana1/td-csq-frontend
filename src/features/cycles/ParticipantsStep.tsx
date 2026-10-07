import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { type Airport } from '@/api/airports.types';
import { type Operator } from '@/api/operators.types';
import { Icon } from '@/design/icons';
import { Checkbox, Skeleton, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { useShell } from '@/shell/ShellContext';
import { formatInt } from '@/lib/format';

import { useBuilder } from './builderContext';
import { CYCLE_TYPE_LABELS, participantSurveyTypes } from './cycleLabels';
import styles from './cycles.module.css';

export const SHARE_TOLERANCE = 0.01;

/** Share total at an airport over every active operator there (what publish checks), and whether it is 100. */
export function airportShareTotal(operators: Operator[]): { total: number; ok: boolean; unset: number } {
  const total = operators.reduce((sum, o) => sum + (o.currentShare ?? 0), 0);
  const unset = operators.filter((o) => o.currentShare === undefined || o.currentShare === null).length;
  return { total: Math.round(total * 100) / 100, ok: Math.abs(total - 100) <= SHARE_TOLERANCE, unset };
}

function AirportGroup({ airport, operators }: { airport: Airport; operators: Operator[] }) {
  const { form } = useBuilder();
  const { href } = useShell();
  const { watch, setValue } = form;
  const type = watch('type');
  const selected = watch('participatingAcoIds');
  const share = airportShareTotal(operators);

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
          {share.ok ? (
            <>Shares {share.total} %</>
          ) : (
            <span className={styles.shareWarn}>
              <Icon name="warning" size={16} />
              Shares {share.total} % ≠ 100
              {share.unset > 0 ? ` · ${share.unset} unset` : ''}
            </span>
          )}
          {!share.ok ? (
            <>
              {' '}
              · <Link to={href('/market-share')}>Fix</Link>
            </>
          ) : null}
        </span>
      </div>
      <div className={styles.operatorRows}>
        {operators.length === 0 ? <p className={styles.sectionHint} style={{ padding: '8px 12px' }}>No active operators at this airport.</p> : null}
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

/**
 * Step 4 — airports multi-select; selecting an airport auto-lists its active
 * operators (eligible for the cycle's type) as participants, each toggleable;
 * every airport shows its market-share total with a ≠ 100 warning, because
 * publishing refuses an airport whose shares do not total 100.
 */
export function ParticipantsStep() {
  const { form, airports, operators, referenceLoading, referenceError } = useBuilder();
  const { watch, setValue, formState } = form;
  const type = watch('type');
  const airportIds = watch('participatingAirportIds');
  const acoIds = watch('participatingAcoIds');

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

  const selectedAirports = airports.filter((a) => airportIds.includes(a.id));

  if (referenceError) return <QueryError error={referenceError} title="Could not load airports and operators" />;

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
          <div className={styles.checkList} role="group" aria-label="Participating airports">
            {airports.map((a) => (
              <div key={a.id} className={styles.checkRow}>
                <Checkbox
                  label={`${a.iata} · ${a.name}`}
                  description={`${formatInt((byAirport.get(a.id) ?? []).length)} active ${(byAirport.get(a.id) ?? []).length === 1 ? 'operator' : 'operators'}`}
                  checked={airportIds.includes(a.id)}
                  onChange={(e) => toggleAirport(a, e.target.checked)}
                />
              </div>
            ))}
            {airports.length === 0 ? <p className={styles.sectionHint}>No active airports yet.</p> : null}
          </div>
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
