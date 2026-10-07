import { type MarketShare } from './marketshare.types';
import { type Operator } from './operators.types';

/* airports module (td-csq-backend/src/modules/airports/airports.schemas.ts). */

export const REGIONS = ['North', 'South', 'East', 'West', 'North-East'] as const;
export type Region = (typeof REGIONS)[number];

/** GET /airports rows and POST/PATCH responses. */
export type Airport = {
  id: string;
  iata: string;
  icao: string | null;
  name: string;
  city: string;
  state: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/** GET /airports/:id — the airport with its operators and current (cycle-less) market shares. */
export type AirportDetail = Airport & {
  operators: Operator[];
  /** Null when the caller may not see this airport's shares. */
  marketShare: MarketShare | null;
};

export type CreateAirportInput = {
  iata: string;
  icao?: string | null;
  name: string;
  city: string;
  state: string;
  /** Derived from the state when omitted. */
  region?: Region;
  lat: number;
  lng: number;
  active?: boolean;
};

export type PatchAirportInput = Partial<Omit<CreateAirportInput, 'iata'>>;

export type AirportImportError = { row: number; field: string; message: string };

/** POST /airports/import */
export type AirportImportResult = {
  rows: number;
  inserted: number;
  updated: number;
  rejected: number;
  errors: AirportImportError[];
};
