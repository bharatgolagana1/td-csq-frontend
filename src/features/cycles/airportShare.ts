import { type Operator } from '@/api/operators.types';

/* Whether an airport's market shares let a cycle there publish (the server
   refuses unless the current shares total 100 ± 0.01, cycles.service). */

export const SHARE_TOLERANCE = 0.01;

export type AirportShare = { total: number; ok: boolean };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The airport's current share total: the server's (GET /market-share/totals,
 * what publishing checks) when known, else the sum over its active operators.
 */
export function airportShare(airportId: string, operators: readonly Operator[], totals: ReadonlyMap<string, number> | null): AirportShare {
  const total = totals?.get(airportId) ?? round2(operators.reduce((sum, o) => sum + (o.currentShare ?? 0), 0));
  return { total, ok: Math.abs(round2(total - 100)) <= SHARE_TOLERANCE };
}

/** Where to fix an airport's shares. */
export function marketSharePath(airportId: string): string {
  return `/market-share?airportId=${encodeURIComponent(airportId)}`;
}
