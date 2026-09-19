import type {
  AudienceOption,
  CycleBuilderBootstrap,
  CycleDraft,
  FormScopeOption,
  ProgrammeOption,
  ScheduleResult,
  TimeZoneOption,
  Viewer,
  ZonedDateTime,
} from './cycleBuilder.types';

/**
 * Stand in for GET /v1/cycles/bootstrap, POST /v1/cycles and
 * POST /v1/cycles/{id}/schedule. Every figure here is illustrative and the UI
 * says so: no real operator, customer list or send volume is represented.
 *
 * Replace the three exported functions when the endpoints land. Nothing else
 * in this feature needs to change.
 */

const IST = 'Asia/Kolkata';

function ist(date: string, time: string): ZonedDateTime {
  return { date, time, timeZone: IST };
}

export const SUPER_ADMIN: Viewer = {
  name: 'ACFI Secretariat',
  role: 'Super Admin',
  canManageCycles: true,
};

/**
 * Authorisation is the server's answer. Point DEFAULT_VIEWER at this to
 * exercise the permission denied branch while the endpoint is still a mock.
 */
export const ACO_ADMIN: Viewer = {
  name: 'Mumbai Cargo Terminal',
  role: 'Terminal Operator Admin',
  canManageCycles: false,
};

const DEFAULT_VIEWER = SUPER_ADMIN;

const PROGRAMMES: ProgrammeOption[] = [
  {
    id: 'prog-p1-2627',
    label: 'CSQ Phase I, FY 2026-27',
    note: 'All Phase I terminals. Runs twice a year.',
    minSamplingSize: 10,
    terminalCount: 14,
  },
  {
    id: 'prog-p1-pilot',
    label: 'CSQ Phase I pilot, four metros',
    note: 'Delhi, Mumbai, Bengaluru and Chennai only. Used to rehearse an instrument change before it goes pan India.',
    minSamplingSize: 5,
    terminalCount: 4,
  },
];

const PHASE_1_HEADS = [
  { code: 'INFRASTRUCTURE_FACILITIES', label: 'Infrastructure / Facilities', parameterCount: 8 },
  { code: 'SECURITY_SAFETY', label: 'Security / Safety', parameterCount: 6 },
  { code: 'PROCESSES', label: 'Processes', parameterCount: 5 },
  { code: 'TRADE_FACILITATION', label: 'Trade Facilitation', parameterCount: 4 },
];

const FORM_SCOPES: FormScopeOption[] = [
  {
    id: 'form-p1-all',
    label: 'Phase I instrument, all terminals',
    version: 'v1.0',
    terminalClass: 'BOTH',
    parameterCount: 23,
    heads: PHASE_1_HEADS,
  },
  {
    id: 'form-p1-intl',
    label: 'Phase I instrument, international terminals only',
    version: 'v1.0',
    terminalClass: 'INTERNATIONAL',
    parameterCount: 23,
    heads: PHASE_1_HEADS,
  },
  {
    id: 'form-p1-dom',
    label: 'Phase I instrument, domestic terminals only',
    version: 'v1.0',
    terminalClass: 'DOMESTIC',
    parameterCount: 23,
    heads: PHASE_1_HEADS,
  },
];

/**
 * A short list rather than the full tz database. An admin picking from 400
 * zones is an admin who picks the wrong one, and every ACFI cycle so far has
 * run on India Standard Time. The others are here because assessors and
 * auditors are not always in the country.
 */
const TIME_ZONES: TimeZoneOption[] = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata, India Standard Time' },
  { id: 'Asia/Dubai', label: 'Asia/Dubai, Gulf Standard Time' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore' },
  { id: 'Europe/London', label: 'Europe/London, observes daylight saving' },
  { id: 'UTC', label: 'UTC' },
];

const AUDIENCES: AudienceOption[] = [
  {
    kind: 'SELF',
    label: 'Operators, self assessment',
    description: 'One nominated user per cargo terminal. Reported back to the operator and excluded from the published score.',
    recipients: 14,
    countsTowardScore: false,
  },
  {
    kind: 'CUSTOMER',
    label: 'Sampled customers',
    description: 'Freight forwarders and customs brokers from the locked sample. The primary weight in the score.',
    recipients: 168,
    countsTowardScore: true,
  },
  {
    kind: 'EXTERNAL',
    label: 'External assessors',
    description: 'Independent auditors appointed by ACFI.',
    recipients: 6,
    countsTowardScore: true,
  },
];

/**
 * A new cycle is seeded from the one before it. An admin building the fourth
 * cycle of a programme is not designing a cycle, they are moving one forward.
 */
const NEW_DRAFT: CycleDraft = {
  id: null,
  state: 'DRAFT',
  name: 'FY 2026-27 H2',
  programmeId: 'prog-p1-2627',
  formScopeId: 'form-p1-all',
  minSamplingSize: 12,
  timeZone: IST,
  samplingOpens: ist('2026-10-05', '09:00'),
  samplingCloses: ist('2026-10-26', '18:00'),
  assessmentOpens: ist('2026-10-19', '09:00'),
  assessmentCloses: ist('2026-11-16', '18:00'),
  reminders: [
    { id: 'r1', at: ist('2026-10-26', '09:00'), audiences: ['CUSTOMER', 'EXTERNAL'], channel: 'WHATSAPP_AND_EMAIL', alreadySent: false },
    { id: 'r2', at: ist('2026-11-06', '09:00'), audiences: ['CUSTOMER'], channel: 'WHATSAPP_AND_EMAIL', alreadySent: false },
    { id: 'r3', at: ist('2026-11-13', '09:00'), audiences: ['SELF', 'CUSTOMER', 'EXTERNAL'], channel: 'WHATSAPP', alreadySent: false },
  ],
};

const EXISTING: Record<string, CycleDraft> = {
  'cyc-2627-q4': {
    id: 'cyc-2627-q4',
    state: 'SCHEDULED',
    name: 'FY 2026-27 Q4 supplementary',
    programmeId: 'prog-p1-pilot',
    formScopeId: 'form-p1-intl',
    minSamplingSize: 8,
    timeZone: IST,
    samplingOpens: ist('2026-11-02', '09:00'),
    samplingCloses: ist('2026-11-23', '18:00'),
    assessmentOpens: ist('2026-11-16', '09:00'),
    assessmentCloses: ist('2026-12-14', '18:00'),
    reminders: [
      { id: 'r1', at: ist('2026-11-23', '09:00'), audiences: ['CUSTOMER'], channel: 'WHATSAPP_AND_EMAIL', alreadySent: false },
      { id: 'r2', at: ist('2026-12-11', '09:00'), audiences: ['CUSTOMER', 'EXTERNAL'], channel: 'WHATSAPP', alreadySent: false },
    ],
  },
  'cyc-2627-h1': {
    id: 'cyc-2627-h1',
    state: 'RUNNING',
    name: 'FY 2026-27 H1',
    programmeId: 'prog-p1-2627',
    formScopeId: 'form-p1-all',
    minSamplingSize: 10,
    timeZone: IST,
    samplingOpens: ist('2026-08-03', '09:00'),
    samplingCloses: ist('2026-08-24', '18:00'),
    assessmentOpens: ist('2026-08-17', '09:00'),
    assessmentCloses: ist('2026-09-30', '18:00'),
    reminders: [
      { id: 'r1', at: ist('2026-08-24', '09:00'), audiences: ['CUSTOMER', 'EXTERNAL'], channel: 'WHATSAPP_AND_EMAIL', alreadySent: true },
      { id: 'r2', at: ist('2026-09-07', '09:00'), audiences: ['CUSTOMER'], channel: 'WHATSAPP_AND_EMAIL', alreadySent: true },
      { id: 'r3', at: ist('2026-09-25', '09:00'), audiences: ['SELF', 'CUSTOMER', 'EXTERNAL'], channel: 'WHATSAPP', alreadySent: false },
    ],
  },
  'cyc-2526-h2': {
    id: 'cyc-2526-h2',
    state: 'CLOSED',
    name: 'FY 2025-26 H2',
    programmeId: 'prog-p1-2627',
    formScopeId: 'form-p1-all',
    minSamplingSize: 10,
    timeZone: IST,
    samplingOpens: ist('2026-01-12', '09:00'),
    samplingCloses: ist('2026-02-02', '18:00'),
    assessmentOpens: ist('2026-01-26', '09:00'),
    assessmentCloses: ist('2026-02-23', '18:00'),
    reminders: [
      { id: 'r1', at: ist('2026-02-02', '09:00'), audiences: ['CUSTOMER'], channel: 'WHATSAPP_AND_EMAIL', alreadySent: true },
      { id: 'r2', at: ist('2026-02-19', '09:00'), audiences: ['CUSTOMER', 'EXTERNAL'], channel: 'WHATSAPP', alreadySent: true },
    ],
  },
};

export const CYCLE_NOT_FOUND = 'CYCLE_NOT_FOUND';

function clone(draft: CycleDraft): CycleDraft {
  return {
    ...draft,
    reminders: draft.reminders.map((r) => ({ ...r, at: { ...r.at }, audiences: [...r.audiences] })),
  };
}

export async function fetchCycleBuilder(cycleId?: string): Promise<CycleBuilderBootstrap> {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const existing = cycleId ? EXISTING[cycleId] : undefined;
  if (cycleId && !existing) throw new Error(CYCLE_NOT_FOUND);

  return {
    viewer: DEFAULT_VIEWER,
    programmes: PROGRAMMES,
    formScopes: FORM_SCOPES,
    timeZones: TIME_ZONES,
    audiences: AUDIENCES,
    draft: clone(existing ?? NEW_DRAFT),
    prefilledFrom: existing ? null : 'FY 2026-27 H1',
  };
}

export async function saveCycleDraft(draft: CycleDraft): Promise<CycleDraft> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ...clone(draft), id: draft.id ?? 'cyc-draft-local' };
}

export async function scheduleCycle(draft: CycleDraft, sendCount: number): Promise<ScheduleResult> {
  await new Promise((resolve) => setTimeout(resolve, 750));
  return { cycleId: draft.id ?? 'cyc-2627-h2', state: 'SCHEDULED', sendCount };
}
