import {
  type AirportOption,
  type AirportReport,
  type CategoryReport,
  type ComparisonReport,
  type ComparisonRow,
  type CycleOption,
  type NationalReport,
  type OperatorQuestions,
  type OperatorReport,
  type QuestionReportRow,
  type ReportCycle,
} from './reports.types';

/* Sample report payloads shaped exactly like the wire (reports.schemas.ts).
   Used by the feature tests and the dev screenshots; the dev shell's mock API
   can serve them too. Nothing here is imported by production code. */

export const CYCLE_LIVE: ReportCycle = {
  id: 'c-26h2',
  code: 'CSQ-26H2',
  name: 'CSQ 2026 H2',
  type: 'BOTH',
  status: 'ASSESSMENT_OPEN',
  assessment: { start: '2026-10-01T00:00:00+05:30', end: '2026-10-31T23:59:59+05:30' },
  scoredAt: null,
};

export const CYCLE_SCORED: ReportCycle = {
  id: 'c-26h1',
  code: 'CSQ-26H1',
  name: 'CSQ 2026 H1',
  type: 'BOTH',
  status: 'SCORED',
  assessment: { start: '2026-04-01T00:00:00+05:30', end: '2026-04-30T23:59:59+05:30' },
  scoredAt: '2026-05-02T03:00:00+05:30',
};

export const CYCLE_PREVIOUS: ReportCycle = {
  id: 'c-25h2',
  code: 'CSQ-25H2',
  name: 'CSQ 2025 H2',
  type: 'BOTH',
  status: 'SCORED',
  assessment: { start: '2025-10-01T00:00:00+05:30', end: '2025-10-31T23:59:59+05:30' },
  scoredAt: '2025-11-02T03:00:00+05:30',
};

/** GET /cycles rows, newest first (what the selectors receive). */
export const CYCLE_OPTIONS: CycleOption[] = [CYCLE_LIVE, CYCLE_SCORED, CYCLE_PREVIOUS].map((c) => ({ id: c.id, code: c.code, name: c.name, type: c.type, status: c.status, scoredAt: c.scoredAt }));

export const AIRPORT_OPTIONS: AirportOption[] = [
  { id: 'ap-bom', iata: 'BOM', name: 'Mumbai' },
  { id: 'ap-blr', iata: 'BLR', name: 'Bengaluru' },
  { id: 'ap-del', iata: 'DEL', name: 'Delhi' },
  { id: 'ap-hyd', iata: 'HYD', name: 'Hyderabad' },
  { id: 'ap-maa', iata: 'MAA', name: 'Chennai' },
  { id: 'ap-ccu', iata: 'CCU', name: 'Kolkata' },
];

const DEL = { id: 'ap-del', iata: 'DEL', name: 'Delhi' };
const CSC = { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: DEL };

const NATIONAL_TABLE: OperatorReport['nationalTable'] = [
  { airportIata: 'BOM', airportName: 'Mumbai', rating: 4.42, rank: 1 },
  { airportIata: 'BLR', airportName: 'Bengaluru', rating: 4.31, rank: 2 },
  { airportIata: 'DEL', airportName: 'Delhi', rating: 4.08, rank: 3 },
  { airportIata: 'HYD', airportName: 'Hyderabad', rating: 3.98, rank: 4 },
  { airportIata: 'MAA', airportName: 'Chennai', rating: 3.91, rank: 5 },
  { airportIata: 'AMD', airportName: 'Ahmedabad', rating: 3.86, rank: 6 },
  { airportIata: 'COK', airportName: 'Kochi', rating: 3.8, rank: 7 },
  { airportIata: 'PNQ', airportName: 'Pune', rating: 3.74, rank: 8 },
  { airportIata: 'GOI', airportName: 'Goa', rating: 3.66, rank: 9 },
  { airportIata: 'ATQ', airportName: 'Amritsar', rating: 3.61, rank: 10 },
  { airportIata: 'LKO', airportName: 'Lucknow', rating: 3.52, rank: 11 },
  { airportIata: 'JAI', airportName: 'Jaipur', rating: 3.4, rank: 12 },
  { airportIata: 'CCU', airportName: 'Kolkata', rating: null, rank: null },
  { airportIata: 'NAG', airportName: 'Nagpur', rating: null, rank: null },
];

function category(code: string, name: string, customer: number, n: number, self: number | null, previous: number | null, subs: [string, string, number, number | null, number | null][]): CategoryReport {
  const delta = previous === null ? null : Math.round((customer - previous) * 100) / 100;
  return {
    id: `cat-${code}`,
    code,
    name,
    customer: { mean: customer, n },
    self: { mean: self },
    previous,
    delta,
    subcategories: subs.map(([scode, sname, mean, sself, sprev]) => ({
      id: `sub-${scode}`,
      code: scode,
      name: sname,
      customer: { mean, n },
      self: { mean: sself },
      previous: sprev,
      delta: sprev === null ? null : Math.round((mean - sprev) * 100) / 100,
    })),
  };
}

/** Six categories, 23 parameters (subcategories) — the deck's "Category Ratings · 23 Parameters". The first subcategory of each keeps its index (OPERATOR_QUESTIONS points at them). */
export const CATEGORIES: CategoryReport[] = [
  category('INF', 'Infrastructure & facilities', 4.12, 128, 4.6, 3.9, [
    ['INF-1', 'Truck docks & parking', 4.05, 4.5, 3.8],
    ['INF-2', 'Warehouse & storage', 4.2, 4.7, 4.0],
    ['INF-3', 'Cold chain & special cargo', 4.08, 4.6, 3.85],
    ['INF-4', 'Handling equipment', 4.15, 4.6, 3.95],
  ]),
  category('SEC', 'Security & safety', 4.41, 128, 4.5, 4.3, [
    ['SEC-1', 'Screening & access control', 4.41, 4.5, 4.3],
    ['SEC-2', 'Cargo integrity & pilferage', 4.46, 4.6, 4.35],
    ['SEC-3', 'Safety practices on the apron', 4.36, 4.4, 4.25],
  ]),
  category('PRO', 'Processes & turnaround', 3.74, 127, 4.2, 3.52, [
    ['PRO-1', 'Acceptance & documentation', 3.62, 4.1, 3.4],
    ['PRO-2', 'Delivery & dwell time', 3.86, 4.3, 3.64],
    ['PRO-3', 'Build-up & break-down', 3.7, 4.2, 3.5],
    ['PRO-4', 'Slot & queue management', 3.66, 4.1, 3.45],
    ['PRO-5', 'Exception handling', 3.86, 4.3, 3.6],
  ]),
  category('TRD', 'Trade facilitation', 4.2, 126, 4.3, 4.1, [
    ['TRD-1', 'Customs coordination', 4.2, 4.3, 4.1],
    ['TRD-2', 'Regulatory compliance support', 4.24, 4.4, 4.12],
    ['TRD-3', 'EDI & messaging', 4.16, 4.2, 4.08],
  ]),
  category('CUS', 'Customer service', 4.28, 128, null, 3.95, [
    ['CUS-1', 'Helpdesk & responsiveness', 4.28, null, 3.95],
    ['CUS-2', 'Complaint resolution', 4.18, null, 3.9],
    ['CUS-3', 'Proactive communication', 4.3, null, 3.98],
    ['CUS-4', 'Staff courtesy', 4.36, null, 3.97],
  ]),
  // New this cycle: no previous figure, so no delta.
  category('DIG', 'Digital & information', 3.96, 125, 4.1, null, [
    ['DIG-1', 'Portal & track-and-trace', 4.02, 4.2, null],
    ['DIG-2', 'Billing accuracy', 3.84, 4.0, null],
    ['DIG-3', 'Data & reporting', 3.9, 4.1, null],
    ['DIG-4', 'Appointment system', 4.08, 4.1, null],
  ]),
];

export const OPERATOR_REPORT: OperatorReport = {
  cycle: CYCLE_SCORED,
  surveyType: 'DOMESTIC',
  provisional: false,
  operator: CSC,
  overall: { customer: { mean: 4.15, n: 128 }, self: { mean: 4.4 }, rank: 3, rankOf: 14 },
  comparison: {
    current: { cycleId: CYCLE_SCORED.id, cycleName: CYCLE_SCORED.name, customer: 4.15, self: 4.4 },
    previous: { cycleId: CYCLE_PREVIOUS.id, cycleName: CYCLE_PREVIOUS.name, customer: 3.85, self: 4.3 },
  },
  feedbackDistribution: [
    { rating: 5, label: 'Excellent', count: 1040, pct: 32.0 },
    { rating: 4, label: 'Very good', count: 1312, pct: 40.37 },
    { rating: 3, label: 'Good', count: 530, pct: 16.31 },
    { rating: 2, label: 'Fair', count: 228, pct: 7.02 },
    { rating: 1, label: 'Poor', count: 76, pct: 2.34 },
    { rating: null, label: 'NA', count: 64, pct: 1.97 },
  ],
  categories: CATEGORIES,
  byStakeholder: { FF: { mean: 4.21, n: 84 }, CB: { mean: 4.03, n: 44 } },
  assessorStats: { total: 150, completed: 128, inProgress: 9, yetToStart: 13 },
  assessments: { total: 129, customer: 128, self: 1 },
  nationalTable: NATIONAL_TABLE,
  airportsTotal: 14,
};

/** The same operator while the live cycle runs: provisional figures, no rank yet. */
export const OPERATOR_REPORT_PROVISIONAL: OperatorReport = {
  ...OPERATOR_REPORT,
  cycle: CYCLE_LIVE,
  provisional: true,
  overall: { customer: { mean: 4.22, n: 41 }, self: { mean: null }, rank: null, rankOf: 0 },
  comparison: {
    current: { cycleId: CYCLE_LIVE.id, cycleName: CYCLE_LIVE.name, customer: 4.22, self: null },
    previous: { cycleId: CYCLE_SCORED.id, cycleName: CYCLE_SCORED.name, customer: 4.15, self: 4.4 },
  },
  assessorStats: { total: 150, completed: 41, inProgress: 22, yetToStart: 87 },
  assessments: { total: 41, customer: 41, self: 0 },
  nationalTable: [],
};

/** Below the minimum-responses rule: every figure hidden. */
export const OPERATOR_REPORT_SUPPRESSED: OperatorReport = {
  ...OPERATOR_REPORT,
  overall: { customer: { mean: null, n: 2 }, self: { mean: 4.4 }, rank: null, rankOf: 13, suppressed: 'INSUFFICIENT_RESPONSES' },
  comparison: { current: { cycleId: CYCLE_SCORED.id, cycleName: CYCLE_SCORED.name, customer: null, self: 4.4 }, previous: null },
  feedbackDistribution: [],
  categories: CATEGORIES.map((c) => ({
    ...c,
    customer: { mean: null, n: 2 },
    previous: null,
    delta: null,
    suppressed: 'INSUFFICIENT_RESPONSES',
    subcategories: c.subcategories.map((s) => ({ ...s, customer: { mean: null, n: 2 }, previous: null, delta: null, suppressed: 'INSUFFICIENT_RESPONSES' })),
  })),
  byStakeholder: { FF: { mean: null, n: 2 }, CB: { mean: null, n: 0 } },
  assessorStats: { total: 150, completed: 2, inProgress: 1, yetToStart: 147 },
  assessments: { total: 3, customer: 2, self: 1 },
};

function question(code: string, text: string, cat: CategoryReport, sub: number | null, mean: number | null, n: number, na: number, self: number | null, previous: number | null, comments: number): QuestionReportRow {
  const s = sub === null ? null : cat.subcategories[sub];
  return {
    id: `q-${code}`,
    code,
    text,
    category: { code: cat.code, name: cat.name },
    subcategory: s ? { code: s.code, name: s.name } : null,
    customer: { mean, n, naCount: na },
    self: { mean: self },
    previous,
    delta: mean === null || previous === null ? null : Math.round((mean - previous) * 100) / 100,
    comments,
    ...(mean === null ? { suppressed: 'INSUFFICIENT_RESPONSES' as const } : {}),
  };
}

const [INF, SEC, PRO, TRD, CUS] = CATEGORIES as [CategoryReport, CategoryReport, CategoryReport, CategoryReport, CategoryReport];

export const OPERATOR_QUESTIONS: OperatorQuestions = {
  cycle: CYCLE_SCORED,
  surveyType: 'DOMESTIC',
  provisional: false,
  operator: CSC,
  questions: [
    question('INF-1.1', 'Availability of truck docks at peak hours', INF, 0, 3.9, 126, 2, 4.5, 3.7, 14),
    question('INF-1.2', 'Parking and marshalling for waiting vehicles', INF, 0, 4.2, 120, 8, 4.5, 3.9, 6),
    question('INF-2.1', 'Condition of warehouse floor and racking', INF, 1, 4.3, 128, 0, 4.8, 4.1, 3),
    question('INF-2.2', 'Cold-chain and special cargo storage', INF, 1, 4.1, 96, 32, 4.6, 3.9, 9),
    question('SEC-1.1', 'Speed of screening without compromising safety', SEC, 0, 4.4, 128, 0, 4.5, 4.3, 2),
    question('SEC-1.2', 'Clarity of access-control procedures', SEC, 0, 4.42, 127, 1, 4.5, 4.3, 1),
    question('PRO-1.1', 'Acceptance cut-off adherence', PRO, 0, 3.5, 128, 0, 4.0, 3.3, 22),
    question('PRO-1.2', 'Documentation errors and rework', PRO, 0, 3.74, 125, 3, 4.2, 3.5, 17),
    question('PRO-2.1', 'Dwell time from landing to delivery', PRO, 1, 3.8, 128, 0, 4.3, 3.6, 19),
    question('PRO-2.2', 'Delivery order processing', PRO, 1, 3.92, 128, 0, 4.3, 3.68, 5),
    question('TRD-1.1', 'Coordination with customs for examinations', TRD, 0, 4.2, 126, 2, 4.3, 4.1, 4),
    question('CUS-1.1', 'Responsiveness of the helpdesk', CUS, 0, 4.28, 128, 0, null, 3.95, 11),
    question('CUS-1.2', 'Resolution of complaints', CUS, 0, null, 2, 126, null, 3.9, 0),
  ],
};

export const AIRPORT_REPORT: AirportReport = {
  cycle: CYCLE_SCORED,
  surveyType: 'DOMESTIC',
  provisional: false,
  airport: DEL,
  overall: { mean: 4.08, coveredSharePct: 100, marketShareApplied: true, rank: 3, rankOf: 12 },
  operators: [
    { acoId: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', mean: 4.15, sharePct: 55, suppressed: false },
    { acoId: 'org-celebi', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', mean: 4.0, sharePct: 45, suppressed: false },
  ],
  categories: [
    { id: 'cat-INF', code: 'INF', name: 'Infrastructure & facilities', mean: 4.05, coveredSharePct: 100, marketShareApplied: true },
    { id: 'cat-SEC', code: 'SEC', name: 'Security & safety', mean: 4.36, coveredSharePct: 100, marketShareApplied: true },
    { id: 'cat-PRO', code: 'PRO', name: 'Processes & turnaround', mean: 3.7, coveredSharePct: 100, marketShareApplied: true },
    { id: 'cat-TRD', code: 'TRD', name: 'Trade facilitation', mean: 4.11, coveredSharePct: 100, marketShareApplied: true },
    { id: 'cat-CUS', code: 'CUS', name: 'Customer service', mean: 4.18, coveredSharePct: 100, marketShareApplied: true },
  ],
};

/** What an ACO caller gets: no operators table, and only part of the airport covered. */
export const AIRPORT_REPORT_FOR_OPERATOR: AirportReport = {
  ...AIRPORT_REPORT,
  overall: { mean: 4.15, coveredSharePct: 55, marketShareApplied: false, rank: 3, rankOf: 12 },
  operators: undefined,
  categories: AIRPORT_REPORT.categories.map((c) => ({ ...c, coveredSharePct: 55, marketShareApplied: false })),
};

export const NATIONAL_REPORT: NationalReport = {
  cycle: CYCLE_SCORED,
  surveyType: 'DOMESTIC',
  provisional: false,
  airports: NATIONAL_TABLE.map((row) => ({
    id: `ap-${row.airportIata.toLowerCase()}`,
    iata: row.airportIata,
    name: row.airportName,
    rating: row.rating,
    rank: row.rank,
    rankOf: 12,
    coveredSharePct: row.rating === null ? 0 : 100,
    marketShareApplied: row.rating !== null,
  })),
  operators: [
    { acoId: 'org-mial', code: 'MCT-BOM', name: 'Mumbai Cargo Terminal', airport: { id: 'ap-bom', iata: 'BOM', name: 'Mumbai' }, rating: 4.42, n: 141, rank: 1, rankOf: 14 },
    { acoId: 'org-blr-1', code: 'AISATS-BLR', name: 'AISATS Bengaluru', airport: { id: 'ap-blr', iata: 'BLR', name: 'Bengaluru' }, rating: 4.31, n: 97, rank: 2, rankOf: 14 },
    { acoId: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: DEL, rating: 4.15, n: 128, rank: 3, rankOf: 14 },
    { acoId: 'org-celebi', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', airport: DEL, rating: 4.0, n: 102, rank: 4, rankOf: 14 },
    { acoId: 'org-hyd-1', code: 'GHIAL-HYD', name: 'GMR Hyderabad Cargo', airport: { id: 'ap-hyd', iata: 'HYD', name: 'Hyderabad' }, rating: 3.98, n: 88, rank: 5, rankOf: 14 },
    { acoId: 'org-maa-1', code: 'AAICLAS-MAA', name: 'AAICLAS Chennai', airport: { id: 'ap-maa', iata: 'MAA', name: 'Chennai' }, rating: 3.91, n: 76, rank: 6, rankOf: 14 },
    { acoId: 'org-ccu-1', code: 'AAICLAS-CCU', name: 'AAICLAS Kolkata', airport: { id: 'ap-ccu', iata: 'CCU', name: 'Kolkata' }, rating: null, n: 2, rank: null, rankOf: 14, suppressed: 'INSUFFICIENT_RESPONSES' },
  ],
  categories: [
    { id: 'cat-INF', code: 'INF', name: 'Infrastructure & facilities', mean: 3.98, n: 20 },
    { id: 'cat-SEC', code: 'SEC', name: 'Security & safety', mean: 4.3, n: 20 },
    { id: 'cat-PRO', code: 'PRO', name: 'Processes & turnaround', mean: 3.62, n: 20 },
    { id: 'cat-TRD', code: 'TRD', name: 'Trade facilitation', mean: 4.02, n: 19 },
    { id: 'cat-CUS', code: 'CUS', name: 'Customer service', mean: 4.1, n: 20 },
  ],
  participation: { airports: 14, operators: 22, sampleLocked: 20, invited: 1040, started: 880, completed: 812, pending: 228, completionRate: 78.08 },
};

function comparisonRow(code: string, name: string, parentCode: string | null, earlier: [number | null, number], later: [number | null, number], self: [number | null, number | null]): ComparisonRow {
  return {
    code,
    name,
    parentCode,
    values: [
      { cycleId: CYCLE_PREVIOUS.id, customer: { mean: earlier[0], n: earlier[1] }, self: { mean: self[0] }, ...(earlier[0] === null ? { suppressed: 'INSUFFICIENT_RESPONSES' as const } : {}) },
      { cycleId: CYCLE_SCORED.id, customer: { mean: later[0], n: later[1] }, self: { mean: self[1] }, ...(later[0] === null ? { suppressed: 'INSUFFICIENT_RESPONSES' as const } : {}) },
    ],
  };
}

export const COMPARISON_REPORT: ComparisonReport = {
  operator: CSC,
  surveyType: 'DOMESTIC',
  cycles: [
    { ...CYCLE_PREVIOUS, provisional: false },
    { ...CYCLE_SCORED, provisional: false },
  ],
  overall: [
    { cycleId: CYCLE_PREVIOUS.id, customer: { mean: 3.85, n: 117 }, self: { mean: 4.3 }, rank: 5, rankOf: 13 },
    { cycleId: CYCLE_SCORED.id, customer: { mean: 4.15, n: 128 }, self: { mean: 4.4 }, rank: 3, rankOf: 14 },
  ],
  categories: CATEGORIES.map((c) => comparisonRow(c.code, c.name, null, [c.previous, 117], [c.customer.mean, c.customer.n], [c.self.mean === null ? null : Math.round((c.self.mean - 0.1) * 100) / 100, c.self.mean])),
  subcategories: CATEGORIES.flatMap((c) => c.subcategories.map((s) => comparisonRow(s.code, s.name, c.code, [s.previous, 117], [s.customer.mean, s.customer.n], [null, s.self.mean]))),
  questions: OPERATOR_QUESTIONS.questions.map((q) => comparisonRow(q.code, q.text, q.subcategory?.code ?? q.category.code, [q.previous, 117], [q.customer.mean, q.customer.n], [null, q.self.mean])),
};
