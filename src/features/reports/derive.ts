import { deltaOf } from '@/api/reports';
import {
  type AirportLevel,
  type AirportOperatorRow,
  type AirportReport,
  type ComparisonReport,
  type ComparisonRow,
  type ComparisonValue,
  type NationalReport,
  type Participation,
} from '@/api/reports.types';
import { type HorizontalBarRow, type RankRow } from '@/design/charts';
import { formatInt, formatPct } from '@/lib/format';

/* Pure shaping of the airport, national and comparison payloads. */

// --- airport ---------------------------------------------------------------

/** "Market share applied · 100 % of the airport covered" / "Equal weights — no market-share snapshot · 55 % of operators covered". */
export function coverageCaption(level: AirportLevel): string {
  const covered = formatPct(level.coveredSharePct);
  return level.marketShareApplied ? `Market share applied · ${covered} of the airport’s share covered` : `Equal weights — no market-share snapshot · ${covered} of operators covered`;
}

/** Operators behind an airport score, ranked by mean (suppressed ones unranked, after the rest). */
export function airportOperatorRows(operators: readonly AirportOperatorRow[]): RankRow[] {
  const ranked = operators.filter((o) => o.mean !== null && !o.suppressed);
  let rank = 0;
  return operators.map((o) => {
    const scored = o.mean !== null && !o.suppressed;
    if (scored) rank += 1;
    return {
      id: o.acoId,
      label: o.name,
      sublabel: o.suppressed ? `${o.code} · suppressed` : o.code,
      rating: scored ? o.mean : null,
      rank: scored ? rank : null,
      rankOf: ranked.length,
      extra: o.sharePct === null ? '—' : formatPct(o.sharePct),
    };
  });
}

export function airportCategoryBars(categories: AirportReport['categories']): HorizontalBarRow[] {
  return categories.map((c) => ({ id: c.id, label: c.name, value: c.mean, sublabel: coverageCaption(c) }));
}

// --- national --------------------------------------------------------------

export function nationalAirportRows(airports: NationalReport['airports']): RankRow[] {
  return airports.map((a) => ({ id: a.id, label: a.name, sublabel: a.iata, rating: a.rating, rank: a.rank, rankOf: a.rankOf, extra: formatPct(a.coveredSharePct) }));
}

export function nationalAirportBars(airports: NationalReport['airports']): HorizontalBarRow[] {
  return airports.filter((a) => a.rating !== null).map((a) => ({ id: a.id, label: a.iata, value: a.rating, sublabel: a.name }));
}

export function nationalOperatorRows(operators: NationalReport['operators']): RankRow[] {
  return operators.map((o) => ({
    id: o.acoId,
    label: o.name,
    sublabel: o.airport ? `${o.code} · ${o.airport.iata}` : o.code,
    rating: o.suppressed ? null : o.rating,
    rank: o.rank,
    rankOf: o.rankOf,
    extra: o.suppressed ? `${formatInt(o.n)} · suppressed` : formatInt(o.n),
  }));
}

export function nationalCategoryBars(categories: NationalReport['categories']): HorizontalBarRow[] {
  return categories.map((c) => ({ id: c.id, label: c.name, value: c.mean, sublabel: `${formatInt(c.n)} operators` }));
}

/** Invited → started → completed, one unit (customers), for the funnel bar. */
export function participationFunnel(p: Participation): HorizontalBarRow[] {
  return [
    { id: 'invited', label: 'Invited', value: p.invited },
    { id: 'started', label: 'Started', value: p.started },
    { id: 'completed', label: 'Completed', value: p.completed },
  ];
}

// --- comparison ------------------------------------------------------------

export type ComparedCycle = ComparisonReport['cycles'][number];
export type ComparisonLevel = 'categories' | 'subcategories' | 'questions';

function cycleTime(c: ComparedCycle): number {
  const at = c.scoredAt ?? c.assessment?.start;
  return at ? Date.parse(at) : 0;
}

/** Earliest first, so "change" always reads later − earlier whatever order was requested. */
export function orderedCycles(report: ComparisonReport): ComparedCycle[] {
  return [...report.cycles].sort((a, b) => cycleTime(a) - cycleTime(b));
}

/** A row's values in the given cycle order (the API aligns `values` with its own `cycles`). */
export function valuesInOrder(values: readonly ComparisonValue[], order: readonly ComparedCycle[]): (ComparisonValue | undefined)[] {
  return order.map((c) => values.find((v) => v.cycleId === c.id));
}

/** Later customer mean − earlier customer mean (the first and last cycle in order), 2 dp. */
export function comparisonDelta(values: readonly (ComparisonValue | undefined)[]): number | null {
  const first = values[0];
  const last = values[values.length - 1];
  if (!first || !last || values.length < 2) return null;
  return deltaOf(last.customer.mean, first.customer.mean);
}

export function comparisonRowsAt(report: ComparisonReport, level: ComparisonLevel): ComparisonRow[] {
  return report[level];
}

/** Which cycle (first = earlier) takes the de-emphasis grey and which the accent in the grouped bars. */
export function comparisonBarKey(index: number, count: number): 'customer' | 'self' {
  return index === count - 1 ? 'customer' : 'self';
}
