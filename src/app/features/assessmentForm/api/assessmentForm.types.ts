/**
 * The assessment form contract. These shapes mirror what the API will return,
 * so swapping the mock for a real fetch is a change of one module, not of every
 * component.
 */

export type HeadCode =
  | 'INFRASTRUCTURE_FACILITIES'
  | 'SECURITY_SAFETY'
  | 'PROCESSES'
  | 'TRADE_FACILITATION';

/** International terminals rate EXPORT and IMPORT, domestic ones INBOUND and OUTBOUND. */
export type DirectionCode = 'EXPORT' | 'IMPORT' | 'INBOUND' | 'OUTBOUND';

export type TerminalScope = 'INTERNATIONAL' | 'DOMESTIC';

/** SELF is reported back but excluded from the published score. */
export type AssessorKind = 'SELF' | 'CUSTOMER' | 'EXTERNAL';

/** NA is a real answer: it counts as answered and is excluded from scoring. */
export type RatingValue = 1 | 2 | 3 | 4 | 5 | 'NA';

export interface Head {
  code: HeadCode;
  label: string;
  /** fits a tab strip on a 375px screen */
  shortLabel: string;
  /** offered as chips when a rating of Fair or Poor opens the follow-up */
  reasons: string[];
}

export interface Parameter {
  id: string;
  head: HeadCode;
  /** used in tabs, the missing list and the review sheet, where the full wording will not fit */
  shortLabel: string;
  /** the instrument wording, which is long and deliberately precise */
  text: string;
}

export interface Instrument {
  version: string;
  cycleId: string;
  cycleLabel: string;
  heads: Head[];
  parameters: Parameter[];
}

export interface Terminal {
  acoId: string;
  terminalName: string;
  airportIata: string;
  airportName: string;
  airportFullName: string;
  scope: TerminalScope;
}

export interface Invite {
  token: string;
  assessorName: string;
  organisation: string;
  assessorKind: AssessorKind;
  terminal: Terminal;
  /** exactly two, in the order they should be presented */
  directions: DirectionCode[];
  assessmentWindow: { opensAt: string; closesAt: string };
  linkExpiresAt: string;
}

export interface FollowUp {
  reasons: string[];
  note: string;
}

export interface DraftAnswers {
  /** keyed `${parameterId}|${direction}` */
  ratings: Record<string, RatingValue>;
  /** keyed `${parameterId}|${direction}`, kept when a rating moves back above Fair */
  followUps: Record<string, FollowUp>;
  /** keyed by parameterId */
  comments: Record<string, string>;
  /** last server acknowledgement, null while the draft has only ever lived on the device */
  savedAt: string | null;
}

export interface Submission {
  reference: string;
  submittedAt: string;
}

export type BlockReason =
  | 'LINK_INVALID'
  | 'LINK_EXPIRED'
  | 'WINDOW_NOT_OPEN'
  | 'WINDOW_CLOSED'
  | 'ALREADY_SUBMITTED'
  | 'NOT_SAMPLED';

/** what can still be shown about a link that resolved but cannot be opened */
export interface BlockContext {
  organisation: string;
  terminalLabel: string;
  cycleLabel: string;
}

export interface SessionBlock {
  reason: BlockReason;
  context: BlockContext | null;
  submission: Submission | null;
  /** the date this reason turns on, ISO, when the reason has one */
  effectiveAt: string | null;
  supportEmail: string;
}

export type AssessmentSession =
  | { status: 'OPEN'; invite: Invite; instrument: Instrument; draft: DraftAnswers | null }
  | { status: 'BLOCKED'; block: SessionBlock };

/** one unanswered direction of one parameter, resolvable to a jump target */
export interface MissingItem {
  parameterId: string;
  parameterNumber: number;
  shortLabel: string;
  head: HeadCode;
  direction: DirectionCode;
}

export interface Progress {
  answered: number;
  total: number;
}
