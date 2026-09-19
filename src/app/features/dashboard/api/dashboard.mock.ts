import type { DashboardData } from './dashboard.types';

/**
 * Sample data taken from the ACFI CSQ deck, slide 8. Every figure here is
 * illustrative and the UI labels it as such: no real operator is scored.
 *
 * Replace `fetchDashboard` with the real call when GET /v1/dashboard lands.
 * Nothing else in this feature needs to change.
 */
const MOCK: DashboardData = {
  cycle: { id: 'FY2025-26', label: 'FY 2025-26', state: 'SCORED' },
  terminal: {
    acoId: 'aco-bom-1',
    terminalName: 'Cargo Terminal',
    airportIata: 'BOM',
    airportName: 'Mumbai',
    airportFullName: 'Chhatrapati Shivaji Maharaj Intl.',
  },
  overall: {
    value: 4.3,
    suppression: 'NONE',
    rank: 3,
    rankOf: 14,
    assessmentCount: 4,
    selfCount: 2,
    customerCount: 2,
  },
  ratings: {
    overall:  { self: 4.4, customer: 4.1 },
    current:  { self: 4.5, customer: 4.3 },
    previous: { self: 4.2, customer: 3.9 },
  },
  feedback: {
    totalResponses: 218,
    distribution: [
      { key: 'EXCELLENT', label: 'Excellent', count: 62, percent: 28 },
      { key: 'VERY_GOOD', label: 'Very Good', count: 74, percent: 34 },
      { key: 'GOOD',      label: 'Good',      count: 48, percent: 22 },
      { key: 'FAIR',      label: 'Fair',      count: 24, percent: 11 },
      { key: 'POOR',      label: 'Poor',      count: 10, percent: 5  },
    ],
  },
  // Phase 1 is 23 parameters across four heads, per the deck
  categories: [
    { code: 'INFRASTRUCTURE_FACILITIES', label: 'Infrastructure / Facilities', current: 4.4, previous: 4.1, delta: 0.3, parameterCount: 8 },
    { code: 'SECURITY_SAFETY',           label: 'Security / Safety',           current: 4.5, previous: 4.3, delta: 0.2, parameterCount: 6 },
    { code: 'PROCESSES',                 label: 'Processes',                   current: 4.0, previous: 3.8, delta: 0.2, parameterCount: 5 },
    { code: 'TRADE_FACILITATION',        label: 'Trade Facilitation',          current: 3.8, previous: 3.5, delta: 0.3, parameterCount: 4 },
  ],
  rankings: {
    rows: [
      { rank: 1, airportIata: 'DEL', airportName: 'Delhi',     terminalName: 'Cargo Terminal', rating: 4.6, isSelf: false },
      { rank: 2, airportIata: 'BLR', airportName: 'Bengaluru', terminalName: 'Cargo Terminal', rating: 4.5, isSelf: false },
      { rank: 3, airportIata: 'BOM', airportName: 'Mumbai',    terminalName: 'Cargo Terminal', rating: 4.3, isSelf: true  },
      { rank: 4, airportIata: 'HYD', airportName: 'Hyderabad', terminalName: 'Cargo Terminal', rating: 4.2, isSelf: false },
      { rank: 5, airportIata: 'MAA', airportName: 'Chennai',   terminalName: 'Cargo Terminal', rating: 4.0, isSelf: false },
    ],
    totalAirports: 14,
    footnote: 'Kochi, Ahmedabad, Kolkata and 6 more airports live under Phase I',
  },
};

export async function fetchDashboard(_cycleId?: string): Promise<DashboardData> {
  await new Promise((r) => setTimeout(r, 450));
  return MOCK;
}

export const RATING_VAR: Record<string, string> = {
  EXCELLENT: 'var(--csq-r5)',
  VERY_GOOD: 'var(--csq-r4)',
  GOOD:      'var(--csq-r3)',
  FAIR:      'var(--csq-r2)',
  POOR:      'var(--csq-r1)',
};

/** Band a 1-5 score falls into, for colouring a number consistently. */
export function bandOf(score: number | null): string {
  if (score === null) return 'var(--csq-na)';
  if (score >= 4.5) return 'var(--csq-r5)';
  if (score >= 3.5) return 'var(--csq-r4)';
  if (score >= 2.5) return 'var(--csq-r3)';
  if (score >= 1.5) return 'var(--csq-r2)';
  return 'var(--csq-r1)';
}
