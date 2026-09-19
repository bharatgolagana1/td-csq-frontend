/**
 * Master data contract for the Super Admin console. These shapes mirror what
 * the API will return, so swapping the mock for a real fetch is a change of one
 * module, not of every component.
 */

export type Scope = 'INTERNATIONAL' | 'DOMESTIC';

/** One question is rated once per direction, so directions always come in pairs. */
export type Direction = 'EXPORT' | 'IMPORT' | 'INBOUND' | 'OUTBOUND';

/** A terminal that handles both runs the international and the domestic pair. */
export type FormScope = Scope | 'BOTH';

export type OperatorState = 'REGISTERED' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED';

/** Whether customers this operator nominates go live at once or wait for ACFI. */
export type ApprovalMode = 'AUTO' | 'ACFI_REVIEW';

export type RatingKey = 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR' | 'POOR';

export type CategoryCode =
  | 'INFRASTRUCTURE_FACILITIES'
  | 'SECURITY_SAFETY'
  | 'PROCESSES'
  | 'TRADE_FACILITATION';

export type AssessorKind = 'SELF' | 'CUSTOMER' | 'EXTERNAL';

export interface Airport {
  id: string;
  iata: string;
  city: string;
  name: string;
  scope: Scope;
}

export interface Operator {
  id: string;
  name: string;
  airportId: string;
  state: OperatorState;
  /** null until an approver sets it: a self registered operator cannot pick its own instrument */
  formScope: FormScope | null;
  approvalMode: ApprovalMode;
  /** share of the airport's cargo tonnage, in basis points of that airport */
  marketShareBp: number;
  selfRegistered: boolean;
  registeredOn: string;
  contact: { name: string; email: string; phone: string };
  /** set when a registration was turned down, so the decision is auditable */
  rejectedReason?: string;
}

export interface Category {
  code: CategoryCode;
  label: string;
  /** share of the overall score, in basis points. The four heads sum to 10000. */
  weightBp: number;
}

export interface Question {
  id: string;
  code: string;
  category: CategoryCode;
  text: string;
  /** what the assessor sees on a phone, so it has to survive a narrow column */
  shortLabel: string;
  directions: Direction[];
  /** weight inside its own head, in basis points. Effective weight is head times question. */
  weightBp: number;
  /** ratings that open the follow up comment box. Fair and Poor by default. */
  revealFollowUpOn: RatingKey[];
}

export interface InstrumentVersion {
  id: string;
  label: string;
  state: 'DRAFT' | 'PUBLISHED';
  publishedOn: string | null;
  updatedOn: string;
  updatedBy: string;
  categories: Category[];
  questions: Question[];
}

export interface AssessorWeight {
  kind: AssessorKind;
  weightBp: number;
  /** SELF is pinned at zero: the operator's own rating is reported back, never scored */
  locked: boolean;
  note: string;
}

export interface AdminMasterData {
  airports: Airport[];
  operators: Operator[];
  live: InstrumentVersion;
  draft: InstrumentVersion;
  assessorWeights: AssessorWeight[];
  openCycle: { id: string; label: string; assessmentStarted: boolean };
}

export type AdminRole = 'SUPER_ADMIN' | 'ACO_ADMIN' | 'ASSESSOR';

export interface AdminSession {
  userName: string;
  role: AdminRole;
}

export type IssueSeverity = 'BLOCKING' | 'ADVISORY';

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  questionId?: string;
  categoryCode?: CategoryCode;
}

export interface ChangedField {
  label: string;
  before: string;
  after: string;
}

export interface VersionDiff {
  added: Question[];
  removed: Question[];
  changed: Array<{ before: Question; after: Question; fields: ChangedField[] }>;
  categoryChanges: Array<{ code: CategoryCode; label: string; beforeBp: number; afterBp: number }>;
}
