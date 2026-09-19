/**
 * The Super Admin approval contract. These shapes mirror what the API will
 * return, so swapping the mock for a real fetch is a change of one module.
 *
 * The thing this screen exists to control: the operator being graded chooses
 * its own graders. Every shape here is built to make that choice inspectable.
 */

export type ViewerRole = 'SUPER_ADMIN' | 'ACFI_STAFF' | 'OPERATOR' | 'ASSESSOR';

export interface Viewer {
  id: string;
  name: string;
  role: ViewerRole;
}

/** International terminals rate EXPORT and IMPORT, domestic ones INBOUND and OUTBOUND. */
export type TerminalScope = 'INTERNATIONAL' | 'DOMESTIC';

export type ApprovalStatus = 'AWAITING_REVIEW' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';

/** Set per operator. AUTOMATIC means a locked batch goes live without a human ever seeing it. */
export type ApprovalMode = 'AUTOMATIC' | 'REQUIRES_REVIEW';

export type CompanyType = 'FREIGHT_FORWARDER' | 'CUSTOMS_BROKER' | 'SHIPPER' | 'AIRLINE';

/**
 * Integrity signals. The API decides these because it can see the operator's
 * registered domains and the whole tenant; the client explains them.
 */
export type IntegrityCode =
  | 'OWN_DOMAIN_EMAIL'
  | 'DUPLICATE_PHONE'
  | 'DUPLICATE_EMAIL'
  | 'FREE_MAIL'
  | 'ADDED_LATE';

export type FlagTally = Partial<Record<IntegrityCode, number>>;

export interface DateWindow {
  opensAt: string;
  closesAt: string;
}

export interface QueueRow {
  batchId: string;
  operatorId: string;
  /** the cargo handling agency whose sample this is */
  operatorName: string;
  terminalName: string;
  airportIata: string;
  airportName: string;
  scope: TerminalScope;
  cycleId: string;
  cycleLabel: string;
  submittedAt: string;
  submittedBy: string;
  contactCount: number;
  /** the floor a sample has to clear before it can be approved */
  minimumContacts: number;
  flags: FlagTally;
  slaDueAt: string;
  status: ApprovalStatus;
  approvalMode: ApprovalMode;
  /** set once a decision has been recorded */
  decidedAt?: string;
  decidedBy?: string;
}

export interface SampledContact {
  id: string;
  name: string;
  designation: string;
  company: string;
  companyType: CompanyType;
  email: string;
  phone: string;
  addedAt: string;
  addedBy: string;
  /** what the API flagged. Recomputed locally after a reviewer edit so a
      correction visibly clears the signal it fixed. */
  flags: IntegrityCode[];
  /** OPERATOR came in the submitted batch, REVIEWER was added during review */
  origin: 'OPERATOR' | 'REVIEWER';
  /** the other contact a duplicate signal points at, so the row can name it */
  duplicateOf?: string;
}

/** Every reviewer change carries one of these. Free text alone is not auditable. */
export type ChangeReason =
  | 'OWN_STAFF'
  | 'DUPLICATE'
  | 'NOT_A_CUSTOMER'
  | 'INVALID_CONTACT'
  | 'OPERATOR_REQUEST'
  | 'COVERAGE_SHORTFALL'
  | 'BROADEN_SAMPLE'
  | 'TYPO_CORRECTION'
  | 'VERIFIED_UPDATE'
  | 'OTHER';

export type ChangeKind = 'ADD' | 'REMOVE' | 'EDIT';

export interface FieldChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

export interface ContactChange {
  id: string;
  kind: ChangeKind;
  contactId: string;
  /** the contact as it reads after the change, so the diff renders without a lookup */
  contact: SampledContact;
  reason: ChangeReason;
  note: string;
  /** EDIT only, always diffed against what the operator submitted */
  fields?: FieldChange[];
  at: string;
  by: string;
}

export type AuditActorRole = 'OPERATOR' | 'SUPER_ADMIN' | 'SYSTEM';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: AuditActorRole;
  action: string;
  detail?: string;
  reason?: ChangeReason;
  /** made in this session and not yet submitted */
  pending?: boolean;
}

export interface BatchDetailData {
  row: QueueRow;
  /** sampling and assessment may overlap: a customer added late is still sampleable */
  samplingWindow: DateWindow;
  assessmentWindow: DateWindow;
  /** the operator's registered mail domains, the basis of the own-domain signal */
  operatorDomains: string[];
  contacts: SampledContact[];
  /** how many the operator locked and submitted, before any reviewer change */
  submittedCount: number;
  /** changes already recorded against this batch, empty while it awaits review */
  recordedChanges: ContactChange[];
  audit: AuditEntry[];
}

export interface ApprovalQueueData {
  viewer: Viewer;
  rows: QueueRow[];
  generatedAt: string;
}

export type RejectCode =
  | 'BELOW_MINIMUM'
  | 'OWN_STAFF_PRESENT'
  | 'UNVERIFIABLE_CONTACTS'
  | 'DUPLICATE_CONTACTS'
  | 'SAMPLE_NOT_REPRESENTATIVE'
  | 'OTHER';

export interface DecisionInput {
  batchId: string;
  decision: 'APPROVE' | 'REJECT';
  changes: ContactChange[];
  finalContactIds: string[];
  rejectCode?: RejectCode;
  /** the operator reads this verbatim */
  messageToOperator?: string;
  citedContactIds?: string[];
}

export interface DecisionResult {
  batchId: string;
  status: ApprovalStatus;
  recordedAt: string;
  decidedBy: string;
  audit: AuditEntry[];
}

export interface ApprovalModeResult {
  operatorId: string;
  mode: ApprovalMode;
  audit: AuditEntry;
}
