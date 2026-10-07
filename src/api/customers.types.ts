/* Hand-written mirrors of the customers module (td-csq-backend §5 `customers`,
   `customer_imports`; §6 "customers"; src/modules/customers/customers.schemas.ts). */

import { type ListQuery } from './types';

export type CustomerType = 'FF' | 'CB';
export type CustomerSurveyType = 'DOMESTIC' | 'INTERNATIONAL' | 'BOTH';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

/** GET /customers rows and GET /customers/:id. */
export type Customer = {
  id: string;
  acoId: string;
  airportId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  type: CustomerType;
  surveyType: CustomerSurveyType;
  status: CustomerStatus;
  tags: string[];
  lastSampledCycleId: string | null;
  /** Optional denormalised cycle (requested from the backend; the id alone is shown otherwise). */
  lastSampledCycle?: { id: string; code: string; name: string } | null;
  importBatchId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListQuery = ListQuery & {
  /** PLATFORM only: one operator's directory. */
  acoId?: string;
  type?: CustomerType;
  surveyType?: CustomerSurveyType;
  status?: CustomerStatus;
  tag?: string;
};

/** POST /customers */
export type CreateCustomerInput = {
  acoId?: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  type: CustomerType;
  surveyType: CustomerSurveyType;
  tags?: string[];
};

/** PATCH /customers/:id */
export type PatchCustomerInput = Partial<Omit<CreateCustomerInput, 'acoId'>>;

export type ImportError = { row: number; field: string; message: string };

export type ImportPreviewRow = {
  row: number;
  action: 'CREATE' | 'UPDATE' | 'REJECT';
  /** Normalised values where they validated; raw text otherwise. */
  data: Record<string, string | string[]>;
  errors: ImportError[];
};

/** POST /customers/import/validate */
export type ImportValidation = {
  importId: string;
  acoId: string;
  fileName: string;
  status: 'VALIDATED' | 'COMMITTED';
  /** Data rows in the file (blank lines excluded). */
  rows: number;
  accepted: number;
  rejected: number;
  errors: ImportError[];
  preview: ImportPreviewRow[];
  headers: { matched: Record<string, string>; ignored: string[]; missing: string[] };
};

/** POST /customers/import/:importId/commit */
export type ImportCommit = {
  importId: string;
  acoId: string;
  fileName: string;
  status: 'VALIDATED' | 'COMMITTED';
  rows: number;
  accepted: number;
  rejected: number;
  created: number;
  updated: number;
  committedAt: string | null;
};

export type ParticipationRow = {
  cycleId: string;
  /** Null when the cycle is no longer visible to the caller. */
  cycle: { id: string; code: string; name: string; type: CustomerSurveyType; status: string } | null;
  surveyType: 'DOMESTIC' | 'INTERNATIONAL';
  state: 'SELECTED' | 'LOCKED' | 'REMOVED';
  addedAt: string;
  /** Null until the assessments module can answer. */
  submitted: boolean | null;
};

/** GET /customers/:id/participation */
export type Participation = {
  customer: Pick<Customer, 'id' | 'name' | 'contactPerson' | 'email' | 'phone' | 'type' | 'surveyType' | 'status'>;
  cycles: ParticipationRow[];
};
