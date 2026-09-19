/**
 * The dashboard contract. These shapes mirror what the API will return, so
 * swapping the mock for a real fetch is a change of one module, not of every
 * component.
 */

export type RatingKey = 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR' | 'POOR';

export interface Suppressible {
  /** null when the score is withheld rather than absent. */
  value: number | null;
  suppression: 'NONE' | 'BELOW_MIN_RESPONSES' | 'BELOW_MIN_COVERAGE' | 'NOT_YET_SCORED';
}

export interface CycleRatings {
  /** the operator's own assessment: reported back, never in the published score */
  self: number | null;
  /** the locked customer sample: what the rating is actually built from */
  customer: number | null;
}

export interface CategoryRating {
  code: string;
  label: string;
  current: number | null;
  previous: number | null;
  /** current minus previous; null when there is no comparable prior cycle */
  delta: number | null;
  parameterCount: number;
}

export interface RankingRow {
  rank: number;
  airportIata: string;
  airportName: string;
  terminalName: string;
  rating: number | null;
  /** the operator viewing the dashboard, highlighted in place */
  isSelf: boolean;
}

export interface DashboardData {
  cycle: { id: string; label: string; state: 'OPEN' | 'CLOSED' | 'SCORED' };
  terminal: {
    acoId: string;
    terminalName: string;
    airportIata: string;
    airportName: string;
    airportFullName: string;
  };
  overall: Suppressible & {
    rank: number | null;
    rankOf: number;
    assessmentCount: number;
    selfCount: number;
    customerCount: number;
  };
  ratings: {
    overall: CycleRatings;
    current: CycleRatings;
    previous: CycleRatings;
  };
  feedback: {
    totalResponses: number;
    distribution: Array<{ key: RatingKey; label: string; count: number; percent: number }>;
  };
  categories: CategoryRating[];
  rankings: {
    rows: RankingRow[];
    totalAirports: number;
    footnote: string;
  };
}
