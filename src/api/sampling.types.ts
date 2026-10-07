/* Hand-written mirrors of the sampling module (td-csq-backend §5 `samples`,
   `cycle_participants`; §6 "sampling"; src/modules/sampling/sampling.schemas.ts)
   and the `GET /cycles/current` strip payload (src/modules/cycles/cycles.schemas.ts). */

import { type Customer, type CustomerStatus, type CustomerSurveyType, type CustomerType } from './customers.types';

export type SurveyType = 'DOMESTIC' | 'INTERNATIONAL';
export type CycleType = CustomerSurveyType;
export type CycleStatus = 'DRAFT' | 'PUBLISHED' | 'SAMPLING_OPEN' | 'SAMPLING_CLOSED' | 'ASSESSMENT_OPEN' | 'ASSESSMENT_CLOSED' | 'SCORED' | 'ARCHIVED';
export type ParticipantSamplingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'LOCKED' | 'UNLOCKED';
export type SampleState = 'SELECTED' | 'LOCKED' | 'REMOVED';

/** Why the lock gate refuses (sampling/domain/lockGate.ts). */
export type LockReason = 'BELOW_MINIMUM' | 'SELECT_ALL_REQUIRED' | 'NOTHING_SELECTED';
/** The state payload adds the two reasons that are about the window, not the count. */
export type StateReason = LockReason | 'ALREADY_LOCKED' | 'SAMPLING_CLOSED';

export type CustomerSummary = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  type: CustomerType;
  surveyType: CustomerSurveyType;
  status: CustomerStatus;
};

/** The cycle as the sampling payload carries it (`cycleSummary` in sampling.schemas.ts). */
export type SamplingCycle = {
  id: string;
  code: string;
  name: string;
  type: CycleType;
  status: CycleStatus;
  samplingStart: string | null;
  samplingEnd: string | null;
};

export type ParticipantSampling = {
  status: ParticipantSamplingStatus;
  selectedCount: number;
  lockedAt: string | null;
  lockedBy: string | null;
  unlockedAt: string | null;
  unlockedBy: string | null;
  unlockReason: string | null;
};

export type ParticipantSummary = {
  cycleId: string;
  acoId: string;
  airportId: string | null;
  surveyTypes: SurveyType[];
  requiredSampleSize: number;
  sampling: ParticipantSampling;
};

export type SelectionItem = { customerId: string; surveyType: SurveyType };

export type SelectionRow = {
  id: string;
  customerId: string;
  /** Null only when the customer record has vanished; the row still counts. */
  customer: CustomerSummary | null;
  surveyType: SurveyType;
  state: SampleState;
  addedAt: string;
  addedBy: string | null;
};

/** GET /sampling/cycles/:cycleId — the whole sampling screen in one payload. */
export type SelectionState = {
  cycle: SamplingCycle;
  participant: ParticipantSummary;
  required: number;
  selectedCount: number;
  eligibleCount: number;
  /** True when pressing "lock" now would succeed; `reason` says why not otherwise. */
  lockable: boolean;
  reason: StateReason | null;
  shortfallRule: 'SELECT_ALL' | null;
  remaining: number;
  target: number;
  /** "37 / 50" */
  progress: string;
  progressPct: number;
  /** True while the operator may change the selection (sampling open, not locked). */
  editable: boolean;
  selection: SelectionRow[];
};

export type SelectionRejectReason = 'UNKNOWN_CUSTOMER' | 'INACTIVE_CUSTOMER' | 'WRONG_SURVEY_TYPE' | 'ALREADY_SELECTED' | 'NOT_SELECTED' | 'DUPLICATE_IN_REQUEST' | 'CONFLICTING';

export type RejectedItem = SelectionItem & { op: 'add' | 'remove'; reason: SelectionRejectReason; message: string };

/** PUT /sampling/cycles/:cycleId/selection and POST …/select-all */
export type SelectionChange = {
  added: SelectionItem[];
  removed: SelectionItem[];
  rejected: RejectedItem[];
  state: SelectionState;
};

export type SelectionInput = { acoId?: string; add: SelectionItem[]; remove: SelectionItem[] };

/** One sampleable (customer, surveyType) pair — the rows of the eligible table. */
export type EligibleEntry = { key: string; customer: Customer; surveyType: SurveyType };

/** GET /sampling/cycles/:cycleId/audit rows (audit module `auditEntryResponse`). */
export type SamplingAuditEntry = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorOrgId: string | null;
  orgId: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip: string;
  requestId: string;
  at: string;
};

export type WindowEdge = { wall: string; utc: string };
export type CycleWindow = { start: WindowEdge; end: WindowEdge };

export type DeadlineKind = 'SAMPLING_OPENS' | 'SAMPLING_CLOSES' | 'ASSESSMENT_OPENS' | 'ASSESSMENT_CLOSES';

/** `cycleSummaryResponse` (cycles module). */
export type CurrentCycleSummary = {
  id: string;
  code: string;
  name: string;
  type: CycleType;
  status: CycleStatus;
  tz: string;
  sampling: CycleWindow;
  assessment: CycleWindow;
  minSampleSize: number;
  participants?: { airports: number; operators: number };
  progress?: { locked: number; invited: number; completed: number };
  publishedAt?: string | null;
  scoredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** `participantResponse` (cycles module). */
export type CurrentCycleParticipant = {
  id?: string;
  cycleId: string;
  acoId: string;
  airportId?: string;
  operator?: { id: string; code: string; name: string };
  airport?: { id: string; iata: string; name: string };
  surveyTypes: SurveyType[];
  requiredSampleSize: number;
  sampling: ParticipantSampling;
  stats?: { invited: number; started: number; completed: number };
  selfAssessment?: { DOMESTIC: string | null; INTERNATIONAL: string | null };
  reminders?: { sent: number; lastAt: string | null };
};

/** GET /cycles/current — the cycle(s) an operator must act on now (cycles module). */
export type CurrentCycle = {
  cycle: CurrentCycleSummary;
  participant: CurrentCycleParticipant;
  nextDeadline: { kind: DeadlineKind; at: string } | null;
};
