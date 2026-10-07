import { type OperatorSummary } from './types';

/* organisations module — operators (td-csq-backend/src/modules/organisations/organisations.schemas.ts).
   `OperatorSummary` (the list row) lives in ./types because the Users area
   already consumes it; the full row from the backend extends it. */

export type OrgStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

export type AirportRef = { id: string; iata: string; name: string };

export type Address = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type Contact = { name: string; email: string; phone: string };

export type Operations = { domestic: boolean; international: boolean };

/** Every operator row the backend returns (GET /operators, GET /operators/:id, airport detail). */
export type Operator = Omit<OperatorSummary, 'currentShare'> & {
  legalName: string | null;
  address: Address | null;
  contact: Contact | null;
  createdVia: 'ADMIN' | 'LINK';
  /** The current (cycle-less) share at its airport; null when not set. */
  currentShare: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateOperatorInput = {
  code: string;
  name: string;
  legalName?: string;
  airportId: string;
  operations: Operations;
  address: Address;
  contact: Contact;
  admin: Contact;
  marketSharePct?: number;
};

export type PatchOperatorInput = Partial<{
  name: string;
  legalName: string | null;
  airportId: string;
  operations: Operations;
  address: Address | null;
  contact: Contact | null;
}>;
