import type {
  AssessorKind,
  AssessorWeight,
  CategoryCode,
  ChangedField,
  Direction,
  InstrumentVersion,
  Operator,
  Question,
  RatingKey,
  Scope,
  ValidationIssue,
  VersionDiff,
} from './api/adminMaster.types';

/** Everything that has to add up, adds up to this. */
export const BP_TOTAL = 10000;

export const CATEGORY_ORDER: CategoryCode[] = [
  'INFRASTRUCTURE_FACILITIES',
  'SECURITY_SAFETY',
  'PROCESSES',
  'TRADE_FACILITATION',
];

export const CATEGORY_LABEL: Record<CategoryCode, string> = {
  INFRASTRUCTURE_FACILITIES: 'Infrastructure / Facilities',
  SECURITY_SAFETY: 'Security / Safety',
  PROCESSES: 'Processes',
  TRADE_FACILITATION: 'Trade Facilitation',
};

/** Codes are mnemonic and carry the head, so a question can move without renumbering. */
export const CATEGORY_PREFIX: Record<CategoryCode, string> = {
  INFRASTRUCTURE_FACILITIES: 'INF',
  SECURITY_SAFETY: 'SEC',
  PROCESSES: 'PRO',
  TRADE_FACILITATION: 'TRD',
};

/** Phase 1 counts, from the ACFI instrument. Departing from them is worth a warning. */
export const CATEGORY_PHASE1_COUNT: Record<CategoryCode, number> = {
  INFRASTRUCTURE_FACILITIES: 8,
  SECURITY_SAFETY: 6,
  PROCESSES: 5,
  TRADE_FACILITATION: 4,
};

export const SCOPE_DIRECTIONS: Record<Scope, [Direction, Direction]> = {
  INTERNATIONAL: ['EXPORT', 'IMPORT'],
  DOMESTIC: ['INBOUND', 'OUTBOUND'],
};

export const DIRECTION_ORDER: Direction[] = ['EXPORT', 'IMPORT', 'INBOUND', 'OUTBOUND'];

export const DIRECTION_LABEL: Record<Direction, string> = {
  EXPORT: 'Export',
  IMPORT: 'Import',
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
};

export const DIRECTION_SCOPE: Record<Direction, Scope> = {
  EXPORT: 'INTERNATIONAL',
  IMPORT: 'INTERNATIONAL',
  INBOUND: 'DOMESTIC',
  OUTBOUND: 'DOMESTIC',
};

export const RATING_ORDER: RatingKey[] = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'];

export const RATING_LABEL: Record<RatingKey, string> = {
  EXCELLENT: 'Excellent',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

export const RATING_VALUE: Record<RatingKey, number> = {
  EXCELLENT: 5,
  VERY_GOOD: 4,
  GOOD: 3,
  FAIR: 2,
  POOR: 1,
};

export const RATING_VAR: Record<RatingKey, string> = {
  EXCELLENT: 'var(--csq-r5)',
  VERY_GOOD: 'var(--csq-r4)',
  GOOD: 'var(--csq-r3)',
  FAIR: 'var(--csq-r2)',
  POOR: 'var(--csq-r1)',
};

export const ASSESSOR_LABEL: Record<AssessorKind, string> = {
  SELF: 'Self',
  CUSTOMER: 'Customer',
  EXTERNAL: 'External',
};

export const SHORT_LABEL_MAX = 24;

/* ---------------- numbers ---------------- */

export function sumBp(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function bpToPct(bp: number, digits = 2): string {
  return (bp / 100).toFixed(digits);
}

export function pctToBp(pct: number): number {
  return Math.round(pct * 100);
}

export function formatBp(bp: number): string {
  return bp.toLocaleString('en-IN');
}

/** Effective share of the whole instrument, in basis points. */
export function effectiveBp(categoryBp: number, questionBp: number): number {
  return (categoryBp * questionBp) / BP_TOTAL;
}

export function formatDate(iso: string | null): string {
  if (!iso) return 'not published';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** v1.1 becomes v1.2. Minor only: a major bump is a Phase decision, not an edit. */
export function nextVersionLabel(label: string): string {
  const m = /^v(\d+)\.(\d+)$/.exec(label.trim());
  if (!m) return `${label}.1`;
  return `v${m[1]}.${Number(m[2]) + 1}`;
}

/* ---------------- instrument helpers ---------------- */

export function questionsIn(version: InstrumentVersion, code: CategoryCode): Question[] {
  return version.questions.filter((q) => q.category === code);
}

export function categoryBp(version: InstrumentVersion, code: CategoryCode): number {
  return version.categories.find((c) => c.code === code)?.weightBp ?? 0;
}

/** How many parameters a terminal on this scope actually sees. */
export function countForScope(version: InstrumentVersion, scope: Scope): number {
  const [a, b] = SCOPE_DIRECTIONS[scope];
  return version.questions.filter((q) => q.directions.includes(a) || q.directions.includes(b)).length;
}

export function scopesOf(q: Question): Scope[] {
  const scopes = new Set<Scope>();
  q.directions.forEach((d) => scopes.add(DIRECTION_SCOPE[d]));
  return [...scopes];
}

/* ---------------- market share ---------------- */

export interface AirportPool {
  /** operators whose share counts: suspended terminals are not assessed, so they hold none */
  members: Operator[];
  excluded: Operator[];
  allocatedBp: number;
  remainderBp: number;
  balanced: boolean;
}

export function poolForAirport(operators: Operator[], airportId: string): AirportPool {
  const atAirport = operators.filter((o) => o.airportId === airportId);
  const members = atAirport.filter((o) => o.state === 'ACTIVE' || o.state === 'REGISTERED');
  const excluded = atAirport.filter((o) => o.state === 'SUSPENDED' || o.state === 'PENDING_APPROVAL');
  const allocatedBp = sumBp(members.map((o) => o.marketShareBp));
  return {
    members,
    excluded,
    allocatedBp,
    remainderBp: BP_TOTAL - allocatedBp,
    balanced: allocatedBp === BP_TOTAL,
  };
}

/* ---------------- validation ---------------- */

const CODE_SHAPE = /^[A-Z]{3}-[A-Z]{2,12}$/;
/** 1. or (a) or iv) leading the text: numbering that breaks the moment a question moves. */
const PRINTED_ORDINAL = /^\s*[([]?(\d+|[ivxIVX]{1,4}|[A-Za-z])[.)\]]\s+/;

export function validateDraft(draft: InstrumentVersion, assessorWeights: AssessorWeight[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const catSum = sumBp(draft.categories.map((c) => c.weightBp));
  if (catSum !== BP_TOTAL) {
    issues.push({
      id: 'cat-sum',
      severity: 'BLOCKING',
      message: `Head weights come to ${formatBp(catSum)} bp. They must come to ${formatBp(BP_TOTAL)}.`,
    });
  }

  CATEGORY_ORDER.forEach((code) => {
    const qs = questionsIn(draft, code);
    if (qs.length === 0) {
      issues.push({
        id: `cat-empty-${code}`,
        severity: 'BLOCKING',
        message: `${CATEGORY_LABEL[code]} has no questions.`,
        categoryCode: code,
      });
      return;
    }
    const sum = sumBp(qs.map((q) => q.weightBp));
    if (sum !== BP_TOTAL) {
      issues.push({
        id: `cat-qsum-${code}`,
        severity: 'BLOCKING',
        message: `Question weights in ${CATEGORY_LABEL[code]} come to ${formatBp(sum)} bp of ${formatBp(BP_TOTAL)}.`,
        categoryCode: code,
      });
    }
    if (qs.length !== CATEGORY_PHASE1_COUNT[code]) {
      issues.push({
        id: `cat-count-${code}`,
        severity: 'ADVISORY',
        message: `${CATEGORY_LABEL[code]} holds ${qs.length} parameters. Phase 1 specifies ${CATEGORY_PHASE1_COUNT[code]}.`,
        categoryCode: code,
      });
    }
  });

  const seen = new Map<string, string>();
  draft.questions.forEach((q) => {
    const code = q.code.trim();

    if (code === '') {
      issues.push({ id: `code-empty-${q.id}`, severity: 'BLOCKING', message: `${q.shortLabel || 'A question'} has no code.`, questionId: q.id });
    } else if (/\d/.test(code)) {
      issues.push({
        id: `code-ordinal-${q.id}`,
        severity: 'BLOCKING',
        message: `Code ${code} carries a printed ordinal. Codes are mnemonic, so a question can move heads without renumbering the paper form.`,
        questionId: q.id,
      });
    } else if (!CODE_SHAPE.test(code)) {
      issues.push({
        id: `code-shape-${q.id}`,
        severity: 'BLOCKING',
        message: `Code ${code} is not in the HEAD-MNEMONIC shape, for example ${CATEGORY_PREFIX[q.category]}-DOCK.`,
        questionId: q.id,
      });
    } else if (!code.startsWith(`${CATEGORY_PREFIX[q.category]}-`)) {
      issues.push({
        id: `code-prefix-${q.id}`,
        severity: 'ADVISORY',
        message: `Code ${code} sits under ${CATEGORY_LABEL[q.category]} but is prefixed ${code.split('-')[0]}.`,
        questionId: q.id,
      });
    }

    if (code !== '') {
      const other = seen.get(code);
      if (other) {
        issues.push({ id: `code-dupe-${q.id}`, severity: 'BLOCKING', message: `Code ${code} is used twice.`, questionId: q.id });
      } else {
        seen.set(code, q.id);
      }
    }

    if (q.text.trim() === '') {
      issues.push({ id: `text-empty-${q.id}`, severity: 'BLOCKING', message: `${code || 'A question'} has no question text.`, questionId: q.id });
    } else if (PRINTED_ORDINAL.test(q.text)) {
      issues.push({
        id: `text-ordinal-${q.id}`,
        severity: 'BLOCKING',
        message: `${code} opens with a printed ordinal. Numbering is rendered by the form, not typed into the text.`,
        questionId: q.id,
      });
    }

    if (q.shortLabel.trim() === '') {
      issues.push({ id: `label-empty-${q.id}`, severity: 'BLOCKING', message: `${code} has no short label. The phone form shows the short label, not the full text.`, questionId: q.id });
    } else if (q.shortLabel.trim().length > SHORT_LABEL_MAX) {
      issues.push({
        id: `label-long-${q.id}`,
        severity: 'ADVISORY',
        message: `Short label for ${code} is ${q.shortLabel.trim().length} characters. Over ${SHORT_LABEL_MAX} wraps badly on a phone.`,
        questionId: q.id,
      });
    }

    if (q.directions.length === 0) {
      issues.push({ id: `dir-none-${q.id}`, severity: 'BLOCKING', message: `${code} applies to no direction, so nobody would ever answer it.`, questionId: q.id });
    } else {
      // one question, two ratings: a scope is answered in both of its directions or not at all
      (Object.keys(SCOPE_DIRECTIONS) as Scope[]).forEach((scope) => {
        const [a, b] = SCOPE_DIRECTIONS[scope];
        const hasA = q.directions.includes(a);
        const hasB = q.directions.includes(b);
        if (hasA !== hasB) {
          issues.push({
            id: `dir-pair-${q.id}-${scope}`,
            severity: 'BLOCKING',
            message: `${code} is set for ${DIRECTION_LABEL[hasA ? a : b]} but not ${DIRECTION_LABEL[hasA ? b : a]}. Every question is rated once per direction.`,
            questionId: q.id,
          });
        }
      });
    }

    if (q.weightBp <= 0) {
      issues.push({ id: `weight-zero-${q.id}`, severity: 'BLOCKING', message: `${code} carries no weight, so its answers would not reach the score.`, questionId: q.id });
    }

    if (q.revealFollowUpOn.length === 0) {
      issues.push({
        id: `follow-none-${q.id}`,
        severity: 'ADVISORY',
        message: `${code} never asks why. A low rating with no comment is hard for an operator to act on.`,
        questionId: q.id,
      });
    }
  });

  const assessorSum = sumBp(assessorWeights.map((w) => w.weightBp));
  if (assessorSum !== BP_TOTAL) {
    issues.push({
      id: 'assessor-sum',
      severity: 'BLOCKING',
      message: `Assessor mix comes to ${formatBp(assessorSum)} bp of ${formatBp(BP_TOTAL)}.`,
    });
  }
  const self = assessorWeights.find((w) => w.kind === 'SELF');
  if (self && self.weightBp !== 0) {
    issues.push({
      id: 'assessor-self',
      severity: 'BLOCKING',
      message: 'Self assessment carries weight. It is reported back to the operator and excluded from the published score.',
    });
  }

  return issues;
}

export function blockingOf(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((i) => i.severity === 'BLOCKING');
}

/* ---------------- diff ---------------- */

export function diffVersions(live: InstrumentVersion, draft: InstrumentVersion): VersionDiff {
  const liveById = new Map(live.questions.map((q) => [q.id, q]));
  const draftById = new Map(draft.questions.map((q) => [q.id, q]));

  const added = draft.questions.filter((q) => !liveById.has(q.id));
  const removed = live.questions.filter((q) => !draftById.has(q.id));

  const changed: VersionDiff['changed'] = [];
  draft.questions.forEach((after) => {
    const before = liveById.get(after.id);
    if (!before) return;
    const fields = changedFields(before, after);
    if (fields.length > 0) changed.push({ before, after, fields });
  });

  const categoryChanges: VersionDiff['categoryChanges'] = [];
  draft.categories.forEach((c) => {
    const before = live.categories.find((lc) => lc.code === c.code);
    if (before && before.weightBp !== c.weightBp) {
      categoryChanges.push({ code: c.code, label: c.label, beforeBp: before.weightBp, afterBp: c.weightBp });
    }
  });

  return { added, removed, changed, categoryChanges };
}

function changedFields(before: Question, after: Question): ChangedField[] {
  const fields: ChangedField[] = [];
  const push = (label: string, b: string, a: string) => {
    if (b !== a) fields.push({ label, before: b, after: a });
  };
  push('Code', before.code, after.code);
  push('Head', CATEGORY_LABEL[before.category], CATEGORY_LABEL[after.category]);
  push('Short label', before.shortLabel, after.shortLabel);
  push('Question text', before.text, after.text);
  push('Directions', directionSummary(before.directions), directionSummary(after.directions));
  push('Weight', `${formatBp(before.weightBp)} bp`, `${formatBp(after.weightBp)} bp`);
  push('Follow up on', followUpSummary(before.revealFollowUpOn), followUpSummary(after.revealFollowUpOn));
  return fields;
}

export function directionSummary(directions: Direction[]): string {
  if (directions.length === 0) return 'none';
  return DIRECTION_ORDER.filter((d) => directions.includes(d))
    .map((d) => DIRECTION_LABEL[d])
    .join(', ');
}

export function followUpSummary(keys: RatingKey[]): string {
  if (keys.length === 0) return 'never';
  return RATING_ORDER.filter((k) => keys.includes(k))
    .map((k) => RATING_LABEL[k])
    .join(', ');
}

export function diffIsEmpty(diff: VersionDiff): boolean {
  return (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.changed.length === 0 &&
    diff.categoryChanges.length === 0
  );
}
