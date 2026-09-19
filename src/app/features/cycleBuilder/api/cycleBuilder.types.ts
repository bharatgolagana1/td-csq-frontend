/**
 * The cycle builder contract. These shapes mirror what the API will return and
 * accept, so swapping the mock for a real fetch is a change of one module, not
 * of every component.
 */

export type CycleState = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'CLOSED';

/** SELF is reported back to the operator but never counts toward the score. */
export type AssessorKind = 'SELF' | 'CUSTOMER' | 'EXTERNAL';

export type SendChannel = 'WHATSAPP_AND_EMAIL' | 'WHATSAPP' | 'EMAIL';

export type TerminalClass = 'INTERNATIONAL' | 'DOMESTIC' | 'BOTH';

/**
 * A wall clock reading together with the zone it was read in, never a bare
 * instant. An admin who types 00:00 on the 12th means midnight where the cycle
 * runs, and 00:00 Asia/Kolkata is not 00:00 Asia/Dubai. A cycle that opens
 * early cannot be taken back, so the zone travels with each boundary instead of
 * being assumed at the edge of the system.
 */
export interface ZonedDateTime {
  /** YYYY-MM-DD, exactly as typed */
  date: string;
  /** HH:mm on a 24 hour clock, exactly as typed */
  time: string;
  /** IANA zone id, for example Asia/Kolkata */
  timeZone: string;
}

export interface ScopeHead {
  code: string;
  label: string;
  parameterCount: number;
}

export interface FormScopeOption {
  id: string;
  label: string;
  version: string;
  terminalClass: TerminalClass;
  parameterCount: number;
  heads: ScopeHead[];
}

export interface ProgrammeOption {
  id: string;
  label: string;
  note: string;
  /** the floor the programme sets: a cycle may ask for more, never for less */
  minSamplingSize: number;
  terminalCount: number;
}

export interface TimeZoneOption {
  id: string;
  label: string;
}

export interface AudienceOption {
  kind: AssessorKind;
  label: string;
  description: string;
  /** illustrative until the sample is locked */
  recipients: number;
  countsTowardScore: boolean;
}

export interface ReminderDraft {
  id: string;
  at: ZonedDateTime;
  audiences: AssessorKind[];
  channel: SendChannel;
  /** a reminder that has already gone out cannot be edited or withdrawn */
  alreadySent: boolean;
}

export interface CycleDraft {
  id: string | null;
  state: CycleState;
  name: string;
  programmeId: string;
  formScopeId: string;
  minSamplingSize: number | null;
  /** the zone every boundary below is read in */
  timeZone: string;
  samplingOpens: ZonedDateTime;
  samplingCloses: ZonedDateTime;
  assessmentOpens: ZonedDateTime;
  assessmentCloses: ZonedDateTime;
  reminders: ReminderDraft[];
}

export interface Viewer {
  name: string;
  role: string;
  /** authorisation is the server's answer, never the client's guess */
  canManageCycles: boolean;
}

export interface CycleBuilderBootstrap {
  viewer: Viewer;
  programmes: ProgrammeOption[];
  formScopes: FormScopeOption[];
  timeZones: TimeZoneOption[];
  audiences: AudienceOption[];
  draft: CycleDraft;
  /** set when a new draft was seeded from the cycle before it */
  prefilledFrom: string | null;
}

export interface ScheduleResult {
  cycleId: string;
  state: CycleState;
  sendCount: number;
}
