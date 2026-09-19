import type {
  AssessmentHistoryData,
  AssessorKind,
  AssessorType,
  CategoryCode,
  CategoryScore,
  CommentEntry,
  CycleSummary,
  DirectionAnswer,
  DirectionKey,
  ParameterAnswer,
  RatingChoice,
  RatingValue,
  Respondent,
  SubmissionDetail,
  SubmissionRow,
  SubmissionStatus,
  TerminalRef,
  TerminalScope,
  Viewer,
} from './history.types';
import type { Tone } from './history.seeds';
import { COMMENT_POOL, NOT_APPLICABLE_COMMENTS, PARAMETERS, SEEDS } from './history.seeds';
import { meanRating, sentimentOf } from '../lib/scoring';
import { CATEGORY_ORDER } from '../lib/labels';

/**
 * Illustrative sample data for the assessment history screen. No real operator
 * is scored here, and the page says so on screen.
 *
 * Replace the two fetch functions at the foot of this file when the real
 * endpoints land. Nothing else in the feature needs to change.
 */

const TERMINAL: TerminalRef = {
  acoId: 'aco-bom-1',
  terminalName: 'Cargo Terminal',
  airportIata: 'BOM',
  airportName: 'Mumbai',
  scope: 'INTERNATIONAL',
};

/**
 * Set canViewHistory or canExport to false to see the refused states. In
 * production these are read off the token, and the API withholds the payload
 * as well: a flag in the client is not an access control.
 */
const VIEWER: Viewer = {
  canViewHistory: true,
  canExport: true,
  canSeeRespondentIdentity: false,
  organisationName: 'Mumbai Cargo Terminal',
};

const CYCLES: CycleSummary[] = [
  {
    id: 'CY-2026-H2',
    label: 'Oct 2026 to Mar 2027',
    state: 'SAMPLING',
    samplingWindow: { start: '2026-09-01', end: '2026-11-30' },
    assessmentWindow: { start: '2026-11-01', end: '2026-12-31' },
    invitedCount: 21,
    submittedCount: 0,
    inProgressCount: 0,
  },
  {
    id: 'CY-2026-H1',
    label: 'Apr 2026 to Sep 2026',
    state: 'ASSESSMENT_OPEN',
    // the windows overlap by design: customers added in August are still sampled
    samplingWindow: { start: '2026-04-10', end: '2026-09-30' },
    assessmentWindow: { start: '2026-07-01', end: '2026-10-31' },
    invitedCount: 26,
    submittedCount: 18,
    inProgressCount: 5,
  },
  {
    id: 'CY-2025-H2',
    label: 'Oct 2025 to Mar 2026',
    state: 'SCORED',
    samplingWindow: { start: '2025-10-05', end: '2026-01-31' },
    assessmentWindow: { start: '2026-01-05', end: '2026-03-31' },
    invitedCount: 24,
    submittedCount: 21,
    inProgressCount: 0,
  },
];

const DEFAULT_CYCLE_ID = 'CY-2026-H1';

export const PARAMETER_COUNT = PARAMETERS.length;

/** International terminals rate export and import, domestic inbound and outbound. */
export function directionsFor(scope: TerminalScope): DirectionKey[] {
  return scope === 'INTERNATIONAL' ? ['EXPORT', 'IMPORT'] : ['INBOUND', 'OUTBOUND'];
}

/**
 * FNV-1a. A deterministic seed keeps the sample identical across refetches: a
 * mock that reshuffles on every load cannot be reviewed against a screenshot.
 */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function kindFor(type: AssessorType): AssessorKind {
  if (type === 'CTO') return 'SELF';
  if (type === 'INDEPENDENT_AUDITOR') return 'EXTERNAL';
  return 'CUSTOMER';
}

function referenceFor(type: AssessorType, seq: number): string {
  const n = String(seq).padStart(2, '0');
  switch (type) {
    case 'CTO':
      return 'Your own assessment';
    case 'FREIGHT_FORWARDER':
      return `Freight forwarder F-${n}`;
    case 'CUSTOMS_BROKER':
      return `Customs broker B-${n}`;
    case 'INDEPENDENT_AUDITOR':
      return `Independent auditor A-${seq}`;
  }
}

function ratingFor(key: string, centre: number, naGate: number): RatingChoice {
  const h = hash(key);
  if (h % naGate === 0) return 'NA';
  const drift = ((h >>> 7) % 3) - 1;
  return Math.min(5, Math.max(1, centre + drift)) as RatingValue;
}

const TONES: Tone[] = ['critical', 'neutral', 'positive'];

function toneOf(rating: RatingChoice): Tone | null {
  if (rating === 'NA') return null;
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'critical';
}

function submittedInstant(windowStart: string, offsetDays: number, seed: string): string {
  const d = new Date(`${windowStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  // a plausible working hour, so the column is not a wall of 00:00
  d.setUTCHours(4 + (hash(seed) % 11), (hash(`${seed}:m`) % 12) * 5, 0, 0);
  return d.toISOString();
}

function buildAnswers(
  submissionId: string,
  centre: number,
  directions: DirectionKey[],
): ParameterAnswer[] {
  return PARAMETERS.map((p) => ({
    parameterNo: p.no,
    category: p.category,
    question: p.question,
    answers: directions.map((direction) => ({
      direction,
      rating: ratingFor(`${submissionId}:${p.no}:${direction}`, centre, p.naProne ? 6 : 41),
      comment: null,
    })),
  }));
}

interface Slot {
  answer: DirectionAnswer;
  parameterNo: number;
  category: CategoryCode;
}

/**
 * Free text is handed out one text at a time rather than drawn per answer. Each
 * piece is used at most once in a cycle, on a parameter it actually speaks to
 * and under a rating whose tone it matches. Drawing the other way round gives a
 * reading surface where three different forwarders say the same sentence.
 */
function assignComments(slots: Slot[], salt: string): void {
  const taken = new Set<DirectionAnswer>();

  const place = (text: string, candidates: Slot[]): void => {
    const free = candidates.filter((s) => !taken.has(s.answer));
    if (free.length === 0) return;
    const pick = free[hash(`${salt}:${text}`) % free.length];
    pick.answer.comment = text;
    taken.add(pick.answer);
  };

  CATEGORY_ORDER.forEach((category) => {
    TONES.forEach((tone) => {
      COMMENT_POOL[category][tone].forEach((entry) => {
        place(
          entry.text,
          slots.filter(
            (s) =>
              s.category === category &&
              entry.params.includes(s.parameterNo) &&
              toneOf(s.answer.rating) === tone,
          ),
        );
      });
    });
  });

  NOT_APPLICABLE_COMMENTS.forEach((text) => {
    place(text, slots.filter((s) => s.answer.rating === 'NA'));
  });
}

function categoryScores(parameters: ParameterAnswer[]): CategoryScore[] {
  return CATEGORY_ORDER.map((code) => {
    const inHead = parameters.filter((p) => p.category === code);
    return {
      code,
      score: meanRating(inHead.flatMap((p) => p.answers.map((a) => a.rating))),
      parameterCount: inHead.length,
    };
  });
}

interface BuiltCycle {
  rows: SubmissionRow[];
  details: Map<string, SubmissionDetail>;
  comments: CommentEntry[];
}

const BUILT = new Map<string, BuiltCycle>();

function buildCycle(cycle: CycleSummary): BuiltCycle {
  const cached = BUILT.get(cycle.id);
  if (cached) return cached;

  const directions = directionsFor(TERMINAL.scope);
  const shortId = cycle.id.replace('CY-', '').replace('-', '');

  const drafts = (SEEDS[cycle.id] ?? []).map(([type, seq, centre, offset], index) => {
    const id = `CSQ-${shortId}-${101 + index}`;
    const status: SubmissionStatus = offset === null ? 'IN_PROGRESS' : 'SUBMITTED';
    return {
      id,
      assessorKind: kindFor(type),
      respondent: { reference: referenceFor(type, seq), type } as Respondent,
      status,
      submittedAt:
        offset === null ? null : submittedInstant(cycle.assessmentWindow.start, offset, id),
      // an open response is not review material, so none of its content is served
      parameters: status === 'SUBMITTED' ? buildAnswers(id, centre, directions) : [],
    };
  });

  assignComments(
    drafts.flatMap((draft) =>
      draft.parameters.flatMap((p) =>
        p.answers.map((answer) => ({
          answer,
          parameterNo: p.parameterNo,
          category: p.category,
        })),
      ),
    ),
    cycle.id,
  );

  const rows: SubmissionRow[] = [];
  const details = new Map<string, SubmissionDetail>();
  const comments: CommentEntry[] = [];

  drafts.forEach((draft) => {
    const { id, assessorKind, respondent, status, submittedAt, parameters } = draft;
    const ratings = parameters.flatMap((p) => p.answers.map((a) => a.rating));
    const score = meanRating(ratings);
    const naCount = ratings.filter((r) => r === 'NA').length;
    let commentCount = 0;

    parameters.forEach((p) => {
      p.answers.forEach((a) => {
        if (!a.comment || !submittedAt) return;
        commentCount += 1;
        comments.push({
          id: `${id}:${p.parameterNo}:${a.direction}`,
          submissionId: id,
          assessorKind,
          respondent,
          category: p.category,
          parameterNo: p.parameterNo,
          question: p.question,
          direction: a.direction,
          rating: a.rating,
          sentiment: sentimentOf(a.rating),
          text: a.comment,
          submittedAt,
        });
      });
    });

    rows.push({
      id,
      cycleId: cycle.id,
      cycleLabel: cycle.label,
      assessorKind,
      respondent,
      status,
      submittedAt,
      score,
      answeredCount: ratings.length - naCount,
      naCount,
      commentCount,
      countsTowardScore: assessorKind !== 'SELF',
    });

    // the detail holds the same answer objects as the row was counted from,
    // so a row and the response behind it can never disagree
    details.set(id, {
      id,
      cycleLabel: cycle.label,
      assessorKind,
      respondent,
      status,
      submittedAt,
      score,
      directions,
      directionScores: directions.map((direction) => ({
        direction,
        score: meanRating(
          parameters.flatMap((p) =>
            p.answers.filter((a) => a.direction === direction).map((a) => a.rating),
          ),
        ),
      })),
      categoryScores: categoryScores(parameters),
      parameters,
      totalAnswerSlots: PARAMETERS.length * directions.length,
    });
  });

  rows.sort(sortByNewest);
  comments.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const built: BuiltCycle = { rows, details, comments };
  BUILT.set(cycle.id, built);
  return built;
}

/** Newest submission first, with responses that are still open at the foot. */
function sortByNewest(a: SubmissionRow, b: SubmissionRow): number {
  if (a.submittedAt === null && b.submittedAt === null) return a.id.localeCompare(b.id);
  if (a.submittedAt === null) return 1;
  if (b.submittedAt === null) return -1;
  return b.submittedAt.localeCompare(a.submittedAt);
}

export async function fetchAssessmentHistory(cycleId?: string): Promise<AssessmentHistoryData> {
  await new Promise((resolve) => setTimeout(resolve, 420));
  const cycle = CYCLES.find((c) => c.id === cycleId) ?? CYCLES.find((c) => c.id === DEFAULT_CYCLE_ID);
  if (!cycle) throw new Error('Unknown cycle');
  const built = buildCycle(cycle);
  return {
    viewer: VIEWER,
    terminal: TERMINAL,
    cycles: CYCLES,
    cycle,
    directions: directionsFor(TERMINAL.scope),
    submissions: built.rows,
    comments: built.comments,
    parameterCount: PARAMETERS.length,
  };
}

export async function fetchSubmissionDetail(submissionId: string): Promise<SubmissionDetail> {
  await new Promise((resolve) => setTimeout(resolve, 260));
  for (const cycle of CYCLES) {
    const detail = buildCycle(cycle).details.get(submissionId);
    if (detail) return detail;
  }
  throw new Error(`No submission ${submissionId}`);
}
