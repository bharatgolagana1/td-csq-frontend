/**
 * The assessment history contract. These shapes mirror what the API will
 * return, so swapping the mock for a real fetch is a change of one module and
 * not of every component.
 *
 * Two product rules are carried by the types rather than left to the UI to
 * remember: a parameter always holds one answer per direction, and a respondent
 * reaches an operator as a reference with no field that could name them.
 */

export type RatingValue = 1 | 2 | 3 | 4 | 5;

/** NA is a real answer. It is excluded from scoring entirely, never read as a zero. */
export type RatingChoice = RatingValue | 'NA';

export type AssessorKind = 'SELF' | 'CUSTOMER' | 'EXTERNAL';

export type AssessorType =
  | 'CTO'
  | 'FREIGHT_FORWARDER'
  | 'CUSTOMS_BROKER'
  | 'INDEPENDENT_AUDITOR';

/** International terminals rate EXPORT and IMPORT, domestic INBOUND and OUTBOUND. */
export type DirectionKey = 'EXPORT' | 'IMPORT' | 'INBOUND' | 'OUTBOUND';

export type TerminalScope = 'INTERNATIONAL' | 'DOMESTIC';

export type CategoryCode =
  | 'INFRASTRUCTURE_FACILITIES'
  | 'SECURITY_SAFETY'
  | 'PROCESSES'
  | 'TRADE_FACILITATION';

export type SubmissionStatus = 'SUBMITTED' | 'IN_PROGRESS';

export type CycleState = 'SAMPLING' | 'ASSESSMENT_OPEN' | 'CLOSED' | 'SCORED';

/** The five bands a 1 to 5 score falls into, matching the rating ramp in tokens.css. */
export type ScoreBand = 'R5' | 'R4' | 'R3' | 'R2' | 'R1';

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'CRITICAL' | 'UNRATED';

export interface Respondent {
  /**
   * A stable reference such as "Freight forwarder F-07". The API must never
   * send a name, company or contact to an operator token: the boundary is
   * enforced server side and the UI only explains it.
   */
  reference: string;
  type: AssessorType;
}

export interface DateWindow {
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD, inclusive */
  end: string;
}

export interface CycleSummary {
  id: string;
  label: string;
  state: CycleState;
  /** sampling and assessment may overlap: customers added late are still sampled */
  samplingWindow: DateWindow;
  assessmentWindow: DateWindow;
  /** assessors invited against this terminal: the locked sample plus self and external */
  invitedCount: number;
  submittedCount: number;
  inProgressCount: number;
}

export interface SubmissionRow {
  id: string;
  cycleId: string;
  cycleLabel: string;
  assessorKind: AssessorKind;
  respondent: Respondent;
  status: SubmissionStatus;
  /** null while a response is still open */
  submittedAt: string | null;
  /** mean of the answered ratings across both directions, null until submitted */
  score: number | null;
  /** ratings given, out of parameterCount x directions */
  answeredCount: number;
  naCount: number;
  commentCount: number;
  /** SELF is reported back to the operator but never counts toward the published score */
  countsTowardScore: boolean;
}

export interface DirectionAnswer {
  direction: DirectionKey;
  rating: RatingChoice;
  comment: string | null;
}

export interface ParameterAnswer {
  /** 1 to 23 in the Phase 1 instrument */
  parameterNo: number;
  category: CategoryCode;
  question: string;
  /** one entry per direction. One question, two ratings, not two questions. */
  answers: DirectionAnswer[];
}

export interface CategoryScore {
  code: CategoryCode;
  score: number | null;
  parameterCount: number;
}

export interface SubmissionDetail {
  id: string;
  cycleLabel: string;
  assessorKind: AssessorKind;
  respondent: Respondent;
  status: SubmissionStatus;
  submittedAt: string | null;
  score: number | null;
  directions: DirectionKey[];
  directionScores: Array<{ direction: DirectionKey; score: number | null }>;
  categoryScores: CategoryScore[];
  /** empty while the response is still open: a half finished answer is not review material */
  parameters: ParameterAnswer[];
  totalAnswerSlots: number;
}

export interface CommentEntry {
  id: string;
  submissionId: string;
  assessorKind: AssessorKind;
  respondent: Respondent;
  category: CategoryCode;
  parameterNo: number;
  question: string;
  direction: DirectionKey;
  rating: RatingChoice;
  /** derived from the rating, so it is never a guess about what the words mean */
  sentiment: Sentiment;
  text: string;
  submittedAt: string;
}

export interface Viewer {
  /** what this session may see here is decided by the API, not by the UI */
  canViewHistory: boolean;
  canExport: boolean;
  /** false for every operator. ACFI holds the map from reference to respondent. */
  canSeeRespondentIdentity: boolean;
  organisationName: string;
}

export interface TerminalRef {
  acoId: string;
  terminalName: string;
  airportIata: string;
  airportName: string;
  scope: TerminalScope;
}

export interface AssessmentHistoryData {
  viewer: Viewer;
  terminal: TerminalRef;
  cycles: CycleSummary[];
  cycle: CycleSummary;
  directions: DirectionKey[];
  submissions: SubmissionRow[];
  comments: CommentEntry[];
  /** the instrument size this cycle was run with, 23 in Phase 1 */
  parameterCount: number;
}
