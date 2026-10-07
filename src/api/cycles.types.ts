import { type ListQuery, type ReminderPlan } from './types';

/* Hand-written mirrors of the cycles contract (td-csq-backend/docs/ARCHITECTURE.md §5–§7
   and src/modules/cycles/cycles.schemas.ts). Wall-clock values are 'YYYY-MM-DDTHH:mm'
   in the cycle's time zone; `utc` is the ISO instant the server computed.
   The strip payload of `GET /cycles/current` lives in ./sampling.types (CurrentCycle). */

export type SurveyType = 'DOMESTIC' | 'INTERNATIONAL';
export type CycleType = SurveyType | 'BOTH';
export const CYCLE_TYPES: readonly CycleType[] = ['DOMESTIC', 'INTERNATIONAL', 'BOTH'];

export type CycleStatus = 'DRAFT' | 'PUBLISHED' | 'SAMPLING_OPEN' | 'SAMPLING_CLOSED' | 'ASSESSMENT_OPEN' | 'ASSESSMENT_CLOSED' | 'SCORED' | 'ARCHIVED';
export const CYCLE_STATUSES: readonly CycleStatus[] = ['DRAFT', 'PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN', 'ASSESSMENT_CLOSED', 'SCORED', 'ARCHIVED'];

/** Targets of `POST /cycles/:id/transition` (DRAFT leaves only through publish). */
export type ManualTarget = Exclude<CycleStatus, 'DRAFT' | 'PUBLISHED'>;

export type SamplingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'LOCKED' | 'UNLOCKED';
export type SelfAssessmentStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';

export type WindowEdge = { wall: string; utc: string };
export type CycleWindow = { start: WindowEdge; end: WindowEdge };
export type CycleReminders = { sampling: ReminderPlan; assessment: ReminderPlan };

/** GET /cycles rows */
export type CycleSummary = {
  id: string;
  code: string;
  name: string;
  type: CycleType;
  status: CycleStatus;
  tz: string;
  sampling: CycleWindow;
  assessment: CycleWindow;
  minSampleSize: number;
  participants: { airports: number; operators: number };
  /** Over the participants the caller may see: operators locked, invitations sent, assessments completed. */
  progress: { locked: number; invited: number; completed: number };
  publishedAt: string | null;
  scoredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `cycle_participants` joined with operator + airport */
export type CycleParticipant = {
  id: string;
  cycleId: string;
  acoId: string;
  airportId: string;
  operator: { id: string; code: string; name: string };
  airport: { id: string; iata: string; name: string };
  surveyTypes: SurveyType[];
  requiredSampleSize: number;
  sampling: {
    status: SamplingStatus;
    selectedCount: number;
    lockedAt: string | null;
    lockedBy: string | null;
    unlockedAt: string | null;
    unlockedBy: string | null;
    unlockReason: string | null;
  };
  stats: { invited: number; started: number; completed: number };
  selfAssessment: { DOMESTIC: SelfAssessmentStatus | null; INTERNATIONAL: SelfAssessmentStatus | null };
  reminders: { sent: number; lastAt: string | null };
  createdAt: string;
  updatedAt: string;
};

/** GET /cycles/:id */
export type CycleDetail = CycleSummary & {
  reminders: CycleReminders;
  participatingAirportIds: string[];
  participatingAcoIds: string[];
  surveyVersions: { DOMESTIC: string | null; INTERNATIONAL: string | null };
  marketShareFrozen: boolean;
  publishedBy: string | null;
  createdBy: string | null;
  participantList: CycleParticipant[];
};

export type DeadlineKind = 'SAMPLING_OPENS' | 'SAMPLING_CLOSES' | 'ASSESSMENT_OPENS' | 'ASSESSMENT_CLOSES';

/** GET /cycles/:id/monitoring */
export type CycleMonitoring = {
  cycleId: string;
  status: CycleStatus;
  sampling: { airports: number; operators: number; sampleRequired: number; sampleLocked: number; lockedOperators: number };
  assessment: { invited: number; started: number; completed: number; pending: number; completionRate: number };
  byAirport: MonitoringAirport[];
};

export type MonitoringAirport = {
  airportId: string;
  iata: string;
  name: string;
  operators: MonitoringOperator[];
};

export type MonitoringOperator = {
  acoId: string;
  code: string;
  name: string;
  sampling: { status: SamplingStatus; selectedCount: number; required: number };
  invited: number;
  started: number;
  completed: number;
};

/** POST /cycles/:id/reminders/send */
export type ReminderRun = { kind: 'SAMPLING' | 'ASSESSMENT'; sent: number; recipients: { acoId: string; to: string[] }[] };

export type CycleListQuery = ListQuery & { status?: CycleStatus; type?: CycleType; airportId?: string; acoId?: string };
export type ParticipantListQuery = ListQuery & { airportId?: string; samplingStatus?: SamplingStatus };

export type WindowInput = { start: string; end: string };

/** POST /cycles — with `initiationDate` and no windows the server derives them from settings. */
export type CreateCycleInput = {
  name: string;
  code: string;
  type: CycleType;
  tz?: string;
  initiationDate?: string;
  sampling?: WindowInput;
  assessment?: WindowInput;
  minSampleSize: number;
  reminders?: CycleReminders;
  participatingAirportIds: string[];
  participatingAcoIds: string[];
  surveyVersions?: { DOMESTIC?: string | null; INTERNATIONAL?: string | null };
};

/** PATCH /cycles/:id (DRAFT: anything; after publishing only end dates and reminders) */
export type PatchCycleInput = Partial<Omit<CreateCycleInput, 'sampling' | 'assessment'>> & {
  sampling?: Partial<WindowInput>;
  assessment?: Partial<WindowInput>;
};

export type TransitionInput = { to: ManualTarget; reason: string };
export type SendRemindersInput = { kind: 'SAMPLING' | 'ASSESSMENT'; acoId?: string };
/** POST /sampling/cycles/:cycleId/unlock — PLATFORM names the operator. */
export type UnlockSampleInput = { cycleId: string; acoId: string; reason: string };
