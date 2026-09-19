import type { FC } from 'react';
import type { Airport, Operator } from '../api/adminMaster.types';
import { BP_TOTAL, bpToPct, formatBp, pctToBp, poolForAirport } from '../adminMaster.logic';
import { AllocationBar } from './AllocationBar';
import { NumberField } from './Fields';

export interface MarketShareBoardProps {
  operators: Operator[];
  airports: Airport[];
  onPatch: (id: string, patch: Partial<Operator>) => void;
}

/**
 * Market share is entered per airport because that is where it has to come to
 * 100. Suspended and pending terminals hold none: they are not assessed this
 * cycle, so holding share would quietly shrink everyone else's.
 */
export const MarketShareBoard: FC<MarketShareBoardProps> = ({ operators, airports, onPatch }) => {
  const boards = airports
    .map((airport) => ({ airport, pool: poolForAirport(operators, airport.id) }))
    .filter((b) => b.pool.members.length > 0 || b.pool.excluded.length > 0);

  const unbalanced = boards.filter((b) => b.pool.members.length > 0 && !b.pool.balanced).length;

  return (
    <section className="am-card" aria-labelledby="am-share-h">
      <div className="am-card-head">
        <div>
          <h2 id="am-share-h">Market share</h2>
          <p className="sub">
            Share of the airport's cargo tonnage, used to roll terminal ratings up to an airport figure.
            Each airport comes to 100%.
          </p>
        </div>
        {unbalanced > 0 && (
          <span className="am-tag am-tag--pending">
            <i />
            {unbalanced} airport{unbalanced === 1 ? '' : 's'} to settle
          </span>
        )}
      </div>

      {boards.map(({ airport, pool }) => (
        <div className="am-airport" key={airport.id}>
          <div className="am-airport-top">
            <h3>
              {airport.city}
              <span>{airport.iata}</span>
            </h3>
            <button
              type="button"
              className="am-btn am-btn--sm"
              disabled={pool.members.length === 0}
              onClick={() => {
                const each = Math.floor(BP_TOTAL / pool.members.length);
                // the rounding remainder goes to the first row so the pool still lands on exactly 100
                const first = BP_TOTAL - each * (pool.members.length - 1);
                pool.members.forEach((m, i) =>
                  onPatch(m.id, { marketShareBp: i === 0 ? first : each }),
                );
              }}
            >
              Split evenly
            </button>
          </div>

          {pool.members.length === 0 ? (
            <p className="am-excluded">
              No terminal at this airport currently holds share.
            </p>
          ) : (
            <>
              {pool.members.map((op) => (
                <div className="am-share-row" key={op.id}>
                  <div>
                    <div className="am-op-name">{op.name}</div>
                    <div className="am-op-sub">{op.state === 'REGISTERED' ? 'Registered, not yet active' : 'Active'}</div>
                  </div>
                  <NumberField
                    label={`Market share for ${op.name}, percent`}
                    hideLabel
                    value={op.marketShareBp}
                    format={(bp) => bpToPct(bp)}
                    parse={(raw) => pctToBp(Number(raw))}
                    step={0.5}
                    min={0}
                    max={100}
                    onChange={(bp) => onPatch(op.id, { marketShareBp: Math.max(0, Math.round(bp)) })}
                  />
                  <span className="am-bp">{formatBp(op.marketShareBp)} bp</span>
                </div>
              ))}

              <AllocationBar
                noun={`${airport.iata} tonnage`}
                segments={pool.members.map((m) => ({ id: m.id, label: m.name, bp: m.marketShareBp }))}
                onSettle={(id, deltaBp) => {
                  const op = pool.members.find((m) => m.id === id);
                  if (!op) return;
                  onPatch(id, { marketShareBp: Math.max(0, op.marketShareBp + deltaBp) });
                }}
              />
            </>
          )}

          {pool.excluded.length > 0 && (
            <p className="am-excluded">
              Holding no share: {pool.excluded.map((e) => `${e.name} (${e.state === 'SUSPENDED' ? 'suspended' : 'pending approval'})`).join(', ')}.
            </p>
          )}
        </div>
      ))}
    </section>
  );
};
