/**
 * The customer directory and sampling contract. These shapes mirror what the
 * API will return, so swapping the mock for a real fetch is a change of one
 * module rather than of every component.
 */

/** Phase 1 samples the two customer populations ACFI names: forwarders and brokers. */
export type CustomerType = 'FREIGHT_FORWARDER' | 'CUSTOMS_BROKER';

/**
 * Which instrument a contact is asked to answer. Every question is rated twice,
 * once per direction: international contacts rate EXPORT and IMPORT, domestic
 * contacts rate INBOUND and OUTBOUND. A contact handling both gets both.
 */
export type FormScope = 'INTERNATIONAL' | 'DOMESTIC' | 'BOTH';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: CustomerType;
  scope: FormScope;
  /** ISO date. null when this contact has never been part of a locked sample. */
  lastSampledAt: string | null;
  addedAt: string;
  addedBy: string;
}

export type CustomerDraft = Omit<Customer, 'id' | 'lastSampledAt' | 'addedAt' | 'addedBy'>;

export interface SamplingCycle {
  id: string;
  label: string;
  /** Sampling and assessment windows may overlap by design: a customer added
      late can still be sampled after assessors have started answering. */
  samplingOpensAt: string;
  samplingClosesAt: string;
  assessmentOpensAt: string;
  assessmentClosesAt: string;
  minimumSampleSize: number;
}

export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface SampleApproval {
  status: ApprovalStatus;
  reviewer: string | null;
  decidedAt: string | null;
  note: string | null;
}

export interface SampleLock {
  lockedAt: string;
  lockedBy: string;
  memberIds: string[];
  /** Minimum minus directory size at the moment of locking. 0 when the
      minimum was met. Recorded rather than hidden, so the score carries its
      own caveat. */
  shortfall: number;
  approval: SampleApproval;
}

export interface SamplingPermissions {
  canViewDirectory: boolean;
  canEditDirectory: boolean;
  canLockSample: boolean;
  /** Shown verbatim when a capability is withheld, so the operator knows who to ask. */
  deniedReason: string | null;
}

export interface Operator {
  acoId: string;
  terminalName: string;
  airportIata: string;
  airportName: string;
  /** Used to flag contacts that share the operator's own mail domain. */
  emailDomain: string;
  terminalScope: FormScope;
}

export interface SamplingData {
  operator: Operator;
  cycle: SamplingCycle;
  customers: Customer[];
  lock: SampleLock | null;
  permissions: SamplingPermissions;
  /** Server clock. "Added just before locking" must not be decided by a device clock. */
  serverNow: string;
}

/* ---- bulk import ---- */

export type ImportField = 'name' | 'company' | 'email' | 'phone' | 'type' | 'scope';

export type ImportValues = Record<ImportField, string>;

export interface ImportRowError {
  field: ImportField;
  message: string;
}

export interface ImportRow {
  /** 1-based line in the uploaded file, so a row can be found in the operator's own spreadsheet. */
  lineNumber: number;
  values: ImportValues;
  errors: ImportRowError[];
}

export interface ImportReport {
  fileName: string;
  rows: ImportRow[];
  /** Set when the file itself could not be read, in which case rows is empty. */
  fileError: string | null;
}

export interface CommitResult {
  imported: Customer[];
  rejected: Array<{ lineNumber: number; reason: string }>;
}
