/* Hand-written mirrors of the reports contract (td-csq-backend/docs/ARCHITECTURE.md §6
   "scoring and reports"; wire shapes in src/modules/reports/reports.schemas.ts).
   Every mean on the wire is 2 dp or null (no score / suppressed). */

export type SurveyType = 'DOMESTIC' | 'INTERNATIONAL';
export type CycleType = SurveyType | 'BOTH';

export type MeanWithN = { mean: number | null; n: number };
export type SelfFigure = { mean: number | null };
export type Suppressed = 'INSUFFICIENT_RESPONSES';

/** The cycle a report is about (a subset of the cycles module's summary). */
export type ReportCycle = {
  id: string;
  code: string;
  name: string;
  type: CycleType;
  status: string;
  /** Assessment window as ISO instants. */
  assessment: { start: string; end: string } | null;
  scoredAt: string | null;
};

export type AirportSummary = { id: string; iata: string; name: string };
export type OperatorSummary = { id: string; code: string; name: string; airport: AirportSummary | null };

/** Figures of one survey level (category / subcategory / question) for one operator. */
export type LevelFigures = {
  customer: MeanWithN;
  self: SelfFigure;
  /** Customer mean of the previous SCORED cycle of the same type, when the node existed there. */
  previous: number | null;
  /** customer.mean − previous, 2 dp; only when both are known. */
  delta: number | null;
  suppressed?: Suppressed;
};

export type SurveyNode = { id: string; code: string; name: string };
export type SubcategoryReport = SurveyNode & LevelFigures;
export type CategoryReport = SurveyNode & LevelFigures & { subcategories: SubcategoryReport[] };

export type ComparisonPoint = { cycleId: string; cycleName: string; customer: number | null; self: number | null };

export type FeedbackBucket = {
  /** 5 = Excellent … 1 = Poor; null = NA. */
  rating: number | null;
  label: string;
  count: number;
  pct: number;
};

export type AssessorStats = { total: number; completed: number; inProgress: number; yetToStart: number };

/** What an operator sees of the country: airport ratings and ranks, never another operator's figures. */
export type NationalTableRow = { airportIata: string; airportName: string; rating: number | null; rank: number | null };

/** GET /reports/operator/:acoId */
export type OperatorReport = {
  cycle: ReportCycle;
  surveyType: SurveyType;
  /** True while the cycle is not SCORED: figures come from a nightly (or manual) provisional run. */
  provisional: boolean;
  operator: OperatorSummary;
  overall: { customer: MeanWithN; self: SelfFigure; rank: number | null; rankOf: number; suppressed?: Suppressed };
  comparison: { current: ComparisonPoint; previous: ComparisonPoint | null };
  feedbackDistribution: FeedbackBucket[];
  categories: CategoryReport[];
  byStakeholder: { FF: MeanWithN; CB: MeanWithN };
  assessorStats: AssessorStats;
  /** Submitted assessments behind the figures: customer returns + the self-assessment. Optional until every environment serves it. */
  assessments?: AssessmentCounts;
  nationalTable: NationalTableRow[];
  /** Airports live on the platform (Phase I), whether or not they are in the table. Optional until every environment serves it. */
  airportsTotal?: number;
};

export type AssessmentCounts = { total: number; customer: number; self: number };

/** GET /reports/operator/:acoId/questions rows */
export type QuestionReportRow = {
  id: string;
  code: string;
  text: string;
  category: { code: string; name: string };
  subcategory: { code: string; name: string } | null;
  customer: MeanWithN & { naCount: number };
  self: SelfFigure;
  previous: number | null;
  delta: number | null;
  suppressed?: Suppressed;
  /** Customer answers to this question that carry a comment. */
  comments: number;
};

export type OperatorQuestions = {
  cycle: ReportCycle;
  surveyType: SurveyType;
  provisional: boolean;
  operator: OperatorSummary;
  questions: QuestionReportRow[];
};

export type AirportLevel = {
  mean: number | null;
  /** Share of the airport (or, without a snapshot, of its operators) behind the figure. */
  coveredSharePct: number;
  marketShareApplied: boolean;
};

export type AirportOperatorRow = { acoId: string; code: string; name: string; mean: number | null; sharePct: number | null; suppressed: boolean };

/** GET /reports/airport/:airportId */
export type AirportReport = {
  cycle: ReportCycle;
  surveyType: SurveyType;
  provisional: boolean;
  airport: AirportSummary;
  overall: AirportLevel & { rank: number | null; rankOf: number };
  /** Present for PLATFORM and AIRPORT callers only. */
  operators?: AirportOperatorRow[];
  categories: (SurveyNode & AirportLevel)[];
};

export type NationalAirportRow = AirportSummary & { rating: number | null; rank: number | null; rankOf: number; coveredSharePct: number; marketShareApplied: boolean };
export type NationalOperatorRow = {
  acoId: string;
  code: string;
  name: string;
  airport: AirportSummary | null;
  rating: number | null;
  n: number;
  rank: number | null;
  rankOf: number;
  suppressed?: Suppressed;
};
export type Participation = {
  airports: number;
  operators: number;
  sampleLocked: number;
  invited: number;
  started: number;
  completed: number;
  pending: number;
  /** completed / invited × 100, 2 dp; 0 when nothing was invited. */
  completionRate: number;
};

/** GET /reports/national */
export type NationalReport = {
  cycle: ReportCycle;
  surveyType: SurveyType;
  provisional: boolean;
  airports: NationalAirportRow[];
  operators: NationalOperatorRow[];
  /** Equal-weight average of the operators' category means; n = operators contributing. */
  categories: (SurveyNode & { mean: number | null; n: number })[];
  participation: Participation;
};

export type ComparisonValue = { cycleId: string; customer: MeanWithN; self: SelfFigure; suppressed?: Suppressed };
/** One survey node across the compared cycles; `values` is aligned with `cycles`. Matched on code. */
export type ComparisonRow = { code: string; name: string; parentCode: string | null; values: ComparisonValue[] };

/** GET /reports/comparison */
export type ComparisonReport = {
  operator: OperatorSummary;
  surveyType: SurveyType;
  cycles: (ReportCycle & { provisional: boolean })[];
  overall: (ComparisonValue & { rank: number | null; rankOf: number })[];
  categories: ComparisonRow[];
  subcategories: ComparisonRow[];
  questions: ComparisonRow[];
};

export type ReportQuery = { cycleId?: string; surveyType?: SurveyType };

export type ExportScope = 'operator' | 'airport' | 'national';
export type ExportQuery = {
  scope: ExportScope;
  cycleId?: string;
  surveyType?: SurveyType;
  acoId?: string;
  airportId?: string;
  format?: 'csv';
};

/** GET /cycles rows — only what the report selectors need. */
export type CycleOption = {
  id: string;
  code: string;
  name: string;
  type: CycleType;
  status: string;
  scoredAt?: string | null;
};

/** GET /airports rows — only what the airport selector needs. */
export type AirportOption = { id: string; iata: string; name: string; active?: boolean };
