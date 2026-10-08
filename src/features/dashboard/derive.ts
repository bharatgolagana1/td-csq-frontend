import { deltaOf } from '@/api/reports';
import { type AssessmentCounts, type CategoryReport, type FeedbackBucket, type LevelFigures, type NationalTableRow, type OperatorReport, type SurveyNode } from '@/api/reports.types';
import { type BandSegment, type GroupedBarSeries, type PairedBarRow, type RankRow } from '@/design/charts';
import { formatInt, formatRating } from '@/lib/format';

/* Pure shaping of the operator report into what the chart wrappers take. */

export type CategoryLevel = 'categories' | 'subcategories';

export type LevelRow = SurveyNode & LevelFigures & { parent?: string };

/** Category rows, or every subcategory flattened with its category as `parent`. */
export function levelRows(categories: readonly CategoryReport[], level: CategoryLevel): LevelRow[] {
  if (level === 'categories') return categories.map(({ subcategories: _subs, ...rest }) => rest);
  return categories.flatMap((c) => c.subcategories.map((s) => ({ ...s, parent: c.name })));
}

/** Subcategories across every category: the deck's "N parameters". */
export function parameterCount(categories: readonly CategoryReport[]): number {
  return categories.reduce((sum, c) => sum + c.subcategories.length, 0);
}

export function isSuppressed(figures: Pick<LevelFigures, 'suppressed'>): boolean {
  return figures.suppressed === 'INSUFFICIENT_RESPONSES';
}

/** Current over previous per row, self as a marker on the current bar. */
export function pairedRows(rows: readonly LevelRow[]): PairedBarRow[] {
  return rows.map((r) => ({
    id: r.id,
    label: r.name,
    ...(r.parent ? { sublabel: r.parent } : {}),
    current: r.customer.mean,
    previous: r.previous,
    delta: r.delta,
    self: r.self.mean,
    n: r.customer.n,
    suppressed: isSuppressed(r),
  }));
}

/**
 * Self vs customer × Overall / this cycle / previous cycle (ARCHITECTURE §7).
 * The API's `overall` is the selected cycle's figure, so while it equals the
 * comparison's current point the note says so instead of implying an all-cycles figure.
 */
export function overallSeries(report: OperatorReport): { categories: string[]; series: GroupedBarSeries[]; note?: string } {
  const { current, previous } = report.comparison;
  const sameAsCycle = report.overall.customer.mean === current.customer && report.overall.self.mean === current.self;
  const cycles = previous ? `this cycle ${current.cycleName} · previous ${previous.cycleName}` : `this cycle ${current.cycleName} · no previous scored cycle of this survey type yet`;
  return {
    categories: ['Overall', 'This cycle', 'Previous cycle'],
    series: [
      { name: 'Customer', key: 'customer', values: [report.overall.customer.mean, current.customer, previous?.customer ?? null] },
      { name: 'Self', key: 'self', values: [report.overall.self.mean, current.self, previous?.self ?? null] },
    ],
    note: sameAsCycle ? `Overall = this cycle until more cycles are scored · ${cycles}` : `${cycles.charAt(0).toUpperCase()}${cycles.slice(1)}`,
  };
}

function bandOf(rating: number | null): BandSegment['rating'] {
  return rating === 1 || rating === 2 || rating === 3 || rating === 4 || rating === 5 ? rating : null;
}

/** Five bands + NA in the order the API sends them; unknown ratings fold into NA. */
export function feedbackSegments(buckets: readonly FeedbackBucket[]): BandSegment[] {
  return buckets.map((b) => ({ rating: bandOf(b.rating), label: b.label, count: b.count, pct: b.pct }));
}

export function answersTotal(buckets: readonly FeedbackBucket[]): number {
  return buckets.reduce((sum, b) => sum + b.count, 0);
}

/** The national table as rank rows; `rankOf` (airports with a figure) comes from the API. */
export function nationalRows(table: readonly NationalTableRow[]): RankRow[] {
  return table.map((r) => ({ id: r.airportIata, label: r.airportName, sublabel: r.airportIata, rating: r.rating, rank: r.rank, rankOf: r.rankOf }));
}

/** Ranked airports for the table, by rank; the rest (no rating yet) for the footnote. */
export function nationalSplit(table: readonly NationalTableRow[]): { ranked: NationalTableRow[]; pending: NationalTableRow[] } {
  const ranked = table.filter((r) => r.rank !== null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const pending = table.filter((r) => r.rank === null);
  return { ranked, pending };
}

/**
 * "Kolkata, Nagpur + 2 more airports live under Phase I" for the airports without a
 * rank this cycle: the unranked table rows by name (up to `shown`), plus `unlisted`
 * airports live on the platform but absent from the table (`airportsTotal` − rows).
 */
export function pendingFootnote(pending: readonly NationalTableRow[], unlisted = 0, shown = 3): string | null {
  const names = pending.slice(0, shown).map((r) => r.airportName);
  const more = pending.length - names.length + Math.max(0, unlisted);
  if (names.length === 0 && more === 0) return null;
  if (names.length === 0) return `${formatInt(more)} ${more === 1 ? 'airport lives' : 'airports live'} under Phase I · not rated this cycle`;
  const tail = more > 0 ? ` + ${formatInt(more)} more ${more === 1 ? 'airport' : 'airports'}` : '';
  return `${names.join(', ')}${tail} live under Phase I · not rated this cycle`;
}

/** Airports live under Phase I that the national table does not list at all. */
export function unlistedAirports(report: Pick<OperatorReport, 'nationalTable' | 'airportsTotal'>): number {
  return Math.max(0, report.airportsTotal - report.nationalTable.length);
}

export function heroDelta(report: OperatorReport): number | null {
  const { current, previous } = report.comparison;
  return previous ? deltaOf(current.customer, previous.customer) : null;
}

/**
 * "129 assessments · 1 self · 128 customer" from the API's submitted counts; an
 * older payload without them falls back to the customer count and the self mean.
 */
export function heroCounts(report: Pick<OperatorReport, 'overall'> & { assessments?: AssessmentCounts }): string {
  const counts = report.assessments;
  if (counts) {
    return `${formatInt(counts.total)} ${counts.total === 1 ? 'assessment' : 'assessments'} · ${formatInt(counts.self)} self · ${formatInt(counts.customer)} customer`;
  }
  const n = report.overall.customer.n;
  return `${formatInt(n)} ${n === 1 ? 'assessment' : 'assessments'} · self ${formatRating(report.overall.self.mean)} · ${formatInt(n)} customer`;
}
