import type {
  ApprovalMode,
  ApprovalModeResult,
  ApprovalQueueData,
  ApprovalStatus,
  AuditEntry,
  BatchDetailData,
  CompanyType,
  ContactChange,
  DateWindow,
  DecisionInput,
  DecisionResult,
  QueueRow,
  SampledContact,
  TerminalScope,
  Viewer,
} from './approvals.types';
import { recomputeFlags, tallyFlags } from '../lib/integrity';
import { applyChanges, CHANGE_KIND_LABEL, REASON_LABEL } from '../lib/changes';
import { REJECT_LABEL } from '../lib/labels';

/**
 * Stand in for GET /v1/sampling/approvals, GET /v1/sampling/batches/:id,
 * POST /v1/sampling/batches/:id/decision and PATCH /v1/operators/:id/approval-mode.
 *
 * Every name, company and figure here is invented. The UI says so on screen:
 * no real operator, forwarder or broker appears in this file.
 *
 * Timestamps are relative to load so the review deadlines stay meaningful
 * whenever the screen is opened.
 */

const NOW = Date.now();
const HOUR = 3600_000;
const DAY = 24 * HOUR;

function iso(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

export const MOCK_VIEWER: Viewer = {
  id: 'u-sa-1',
  name: 'R. Venkataraman',
  role: 'SUPER_ADMIN',
};

/* ---------------- deterministic generation ---------------- */

/** Seeded so the same batch reads the same on every reload. */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const FIRST_NAMES = [
  'Rakesh', 'Priya', 'Anand', 'Meera', 'Sunil', 'Kavita', 'Farhan', 'Deepa',
  'Vikram', 'Nisha', 'Arjun', 'Shalini', 'Ramesh', 'Ayesha', 'Gopal', 'Sneha',
  'Imran', 'Divya', 'Karthik', 'Pooja', 'Mahesh', 'Anita', 'Rohit', 'Leena',
  'Suresh', 'Fatima', 'Naveen', 'Reena', 'Ajay', 'Shweta',
];

const LAST_NAMES = [
  'Sharma', 'Nair', 'Iyer', 'Desai', 'Mehta', 'Reddy', 'Khan', 'Patel',
  'Joshi', 'Rao', 'Bose', 'Menon', 'Gupta', 'Shetty', 'Pillai', 'Chawla',
  'Banerjee', 'Kulkarni', 'Naidu', 'Fernandes',
];

const DESIGNATIONS = [
  'Export Manager', 'Import Manager', 'Operations Head', 'Customs Manager',
  'Branch Manager', 'Documentation Lead', 'Air Freight Manager',
  'Key Accounts Manager', 'Managing Partner', 'Proprietor',
];

interface CompanyProfile {
  name: string;
  domain: string;
  type: CompanyType;
}

const COMPANIES: CompanyProfile[] = [
  { name: 'Meridian Freight Systems', domain: 'meridianfreight.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Sagar Logistics', domain: 'sagarlogistics.co.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Trident Cargo Movers', domain: 'tridentcargo.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Nandan Clearing Agents', domain: 'nandanclearing.in', type: 'CUSTOMS_BROKER' },
  { name: 'Apex Customs House Agents', domain: 'apexcha.co.in', type: 'CUSTOMS_BROKER' },
  { name: 'Silk Route Forwarders', domain: 'silkrouteff.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Harbourline Logistics', domain: 'harbourline.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Pinnacle Air Cargo', domain: 'pinnacleaircargo.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Vayu Freight Services', domain: 'vayufreight.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Anchor Customs Brokers', domain: 'anchorbrokers.co.in', type: 'CUSTOMS_BROKER' },
  { name: 'Deccan Cargo Services', domain: 'deccancargo.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Gateway Freight India', domain: 'gatewayfreight.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Orient Trade Services', domain: 'orienttrade.co.in', type: 'CUSTOMS_BROKER' },
  { name: 'Zenith Shipping Services', domain: 'zenithshipping.in', type: 'SHIPPER' },
  { name: 'Prabhat Logistics', domain: 'prabhatlogistics.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Marigold Freight', domain: 'marigoldfreight.co.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Eastern Customs Advisors', domain: 'easterncustoms.in', type: 'CUSTOMS_BROKER' },
  { name: 'Skybridge Logistics', domain: 'skybridgelog.in', type: 'FREIGHT_FORWARDER' },
  { name: 'Continental Clearing Co', domain: 'conticlearing.in', type: 'CUSTOMS_BROKER' },
  { name: 'Bluewave Shipping Agency', domain: 'bluewaveshipping.in', type: 'SHIPPER' },
];

const FREE_DOMAINS = ['gmail.com', 'yahoo.co.in', 'rediffmail.com', 'outlook.com'];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '.');
}

interface BatchSpec {
  batchId: string;
  operatorId: string;
  operatorName: string;
  terminalName: string;
  airportIata: string;
  airportName: string;
  scope: TerminalScope;
  cycleId: string;
  cycleLabel: string;
  operatorDomain: string;
  submittedBy: string;
  submittedHoursAgo: number;
  slaHoursFromNow: number;
  count: number;
  minimum: number;
  ownDomain: number;
  freeMail: number;
  dupPhonePairs: number;
  dupEmailPairs: number;
  late: number;
  status: ApprovalStatus;
  approvalMode: ApprovalMode;
  decidedHoursAgo?: number;
}

const SAMPLING_WINDOW: DateWindow = { opensAt: iso(-32 * DAY), closesAt: iso(5 * DAY) };
const ASSESSMENT_WINDOW: DateWindow = { opensAt: iso(-10 * DAY), closesAt: iso(35 * DAY) };

function buildContacts(spec: BatchSpec): SampledContact[] {
  const rand = rng(spec.batchId);
  const contacts: SampledContact[] = [];

  for (let i = 0; i < spec.count; i += 1) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const company = COMPANIES[(i + Math.floor(rand() * 7)) % COMPANIES.length];
    const name = `${first} ${last}`;
    // unique local part, so duplicates only exist where the spec puts them
    const local = `${slug(first)}.${slug(last)}${i}`;
    const phoneTail = String(10000000 + Math.floor(rand() * 89999999));
    contacts.push({
      id: `${spec.batchId}-c${String(i + 1).padStart(2, '0')}`,
      name,
      designation: DESIGNATIONS[Math.floor(rand() * DESIGNATIONS.length)],
      company: company.name,
      companyType: company.type,
      email: `${local}@${company.domain}`,
      phone: `+91 9${phoneTail}`,
      addedAt: iso(-(12 + Math.floor(rand() * 16)) * DAY),
      addedBy: spec.submittedBy,
      flags: [],
      origin: 'OPERATOR',
    });
  }

  let cursor = 0;

  for (let i = 0; i < spec.ownDomain && cursor < contacts.length; i += 1, cursor += 1) {
    const c = contacts[cursor];
    c.email = `${slug(c.name)}@${spec.operatorDomain}`;
  }

  for (let i = 0; i < spec.freeMail && cursor < contacts.length; i += 1, cursor += 1) {
    const c = contacts[cursor];
    c.email = `${slug(c.name)}${i}@${FREE_DOMAINS[i % FREE_DOMAINS.length]}`;
  }

  for (let i = 0; i < spec.dupPhonePairs && cursor + 1 < contacts.length; i += 1, cursor += 2) {
    contacts[cursor + 1].phone = contacts[cursor].phone;
  }

  for (let i = 0; i < spec.dupEmailPairs && cursor + 1 < contacts.length; i += 1, cursor += 2) {
    contacts[cursor + 1].email = contacts[cursor].email;
  }

  // late additions sit at the tail, which is also where the operator added them
  for (let i = 0; i < spec.late && i < contacts.length; i += 1) {
    const c = contacts[contacts.length - 1 - i];
    c.addedAt = iso(-(1 + i) * DAY - 6 * HOUR);
  }

  return recomputeFlags(contacts, {
    operatorDomains: [spec.operatorDomain],
    assessmentOpensAt: ASSESSMENT_WINDOW.opensAt,
  });
}

/* ---------------- the batches ---------------- */

const SPECS: BatchSpec[] = [
  {
    batchId: 'b-bom-01', operatorId: 'op-bom', operatorName: 'Skyline Cargo Handling',
    terminalName: 'Cargo Terminal 2', airportIata: 'BOM', airportName: 'Mumbai',
    scope: 'INTERNATIONAL', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'skylinecargo.in', submittedBy: 'Priyanka Rane',
    submittedHoursAgo: 30, slaHoursFromNow: 18,
    count: 21, minimum: 15, ownDomain: 2, freeMail: 3, dupPhonePairs: 1, dupEmailPairs: 1, late: 2,
    status: 'AWAITING_REVIEW', approvalMode: 'REQUIRES_REVIEW',
  },
  {
    batchId: 'b-del-01', operatorId: 'op-del', operatorName: 'Northgate Cargo Terminals',
    terminalName: 'Import Cargo Terminal', airportIata: 'DEL', airportName: 'Delhi',
    scope: 'INTERNATIONAL', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'northgatecargo.in', submittedBy: 'Sanjay Kohli',
    submittedHoursAgo: 52, slaHoursFromNow: -4,
    count: 12, minimum: 15, ownDomain: 1, freeMail: 2, dupPhonePairs: 0, dupEmailPairs: 0, late: 0,
    status: 'AWAITING_REVIEW', approvalMode: 'REQUIRES_REVIEW',
  },
  {
    batchId: 'b-hyd-01', operatorId: 'op-hyd', operatorName: 'Deccan Air Cargo Services',
    terminalName: 'Domestic Cargo Terminal', airportIata: 'HYD', airportName: 'Hyderabad',
    scope: 'DOMESTIC', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'deccanaircargo.in', submittedBy: 'Lakshmi Prasad',
    submittedHoursAgo: 9, slaHoursFromNow: 63,
    count: 16, minimum: 12, ownDomain: 0, freeMail: 1, dupPhonePairs: 2, dupEmailPairs: 0, late: 1,
    status: 'AUTO_APPROVED', approvalMode: 'AUTOMATIC', decidedHoursAgo: 9,
  },
  {
    batchId: 'b-cok-01', operatorId: 'op-cok', operatorName: 'Malabar Cargo Handling',
    terminalName: 'International Cargo Terminal', airportIata: 'COK', airportName: 'Kochi',
    scope: 'INTERNATIONAL', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'malabarcargo.in', submittedBy: 'Thomas Varghese',
    submittedHoursAgo: 20, slaHoursFromNow: 28,
    count: 17, minimum: 15, ownDomain: 1, freeMail: 1, dupPhonePairs: 1, dupEmailPairs: 0, late: 1,
    status: 'AWAITING_REVIEW', approvalMode: 'REQUIRES_REVIEW',
  },
  {
    batchId: 'b-blr-01', operatorId: 'op-blr', operatorName: 'Kempegowda Cargo Services',
    terminalName: 'Cargo Terminal 1', airportIata: 'BLR', airportName: 'Bengaluru',
    scope: 'INTERNATIONAL', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'kempegowdacargo.in', submittedBy: 'Anil Gowda',
    submittedHoursAgo: 13, slaHoursFromNow: 59,
    count: 18, minimum: 15, ownDomain: 0, freeMail: 2, dupPhonePairs: 0, dupEmailPairs: 0, late: 1,
    status: 'AWAITING_REVIEW', approvalMode: 'REQUIRES_REVIEW',
  },
  {
    batchId: 'b-amd-01', operatorId: 'op-amd', operatorName: 'Sabarmati Cargo Terminal',
    terminalName: 'Domestic Cargo Terminal', airportIata: 'AMD', airportName: 'Ahmedabad',
    scope: 'DOMESTIC', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'sabarmaticargo.in', submittedBy: 'Hetal Trivedi',
    submittedHoursAgo: 5, slaHoursFromNow: 67,
    count: 13, minimum: 12, ownDomain: 0, freeMail: 1, dupPhonePairs: 0, dupEmailPairs: 0, late: 0,
    status: 'AWAITING_REVIEW', approvalMode: 'REQUIRES_REVIEW',
  },
  {
    batchId: 'b-maa-01', operatorId: 'op-maa', operatorName: 'Coromandel Cargo Handling',
    terminalName: 'Domestic Cargo Terminal', airportIata: 'MAA', airportName: 'Chennai',
    scope: 'DOMESTIC', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'coromandelcargo.in', submittedBy: 'Bhuvana Krishnan',
    submittedHoursAgo: 74, slaHoursFromNow: -26,
    count: 14, minimum: 12, ownDomain: 0, freeMail: 1, dupPhonePairs: 0, dupEmailPairs: 0, late: 0,
    status: 'APPROVED', approvalMode: 'REQUIRES_REVIEW', decidedHoursAgo: 48,
  },
  {
    batchId: 'b-ccu-01', operatorId: 'op-ccu', operatorName: 'Hooghly Cargo Terminals',
    terminalName: 'Domestic Cargo Terminal', airportIata: 'CCU', airportName: 'Kolkata',
    scope: 'DOMESTIC', cycleId: 'FY2025-26', cycleLabel: 'FY 2025-26',
    operatorDomain: 'hooghlycargo.in', submittedBy: 'Dipankar Sen',
    submittedHoursAgo: 96, slaHoursFromNow: -48,
    count: 9, minimum: 12, ownDomain: 1, freeMail: 1, dupPhonePairs: 0, dupEmailPairs: 0, late: 0,
    status: 'REJECTED', approvalMode: 'REQUIRES_REVIEW', decidedHoursAgo: 72,
  },
];

interface StoredBatch {
  spec: BatchSpec;
  row: QueueRow;
  contacts: SampledContact[];
  submittedCount: number;
  recordedChanges: ContactChange[];
  audit: AuditEntry[];
}

function rowFrom(spec: BatchSpec, contacts: SampledContact[]): QueueRow {
  const decided = spec.decidedHoursAgo !== undefined;
  return {
    batchId: spec.batchId,
    operatorId: spec.operatorId,
    operatorName: spec.operatorName,
    terminalName: spec.terminalName,
    airportIata: spec.airportIata,
    airportName: spec.airportName,
    scope: spec.scope,
    cycleId: spec.cycleId,
    cycleLabel: spec.cycleLabel,
    submittedAt: iso(-spec.submittedHoursAgo * HOUR),
    submittedBy: spec.submittedBy,
    contactCount: contacts.length,
    minimumContacts: spec.minimum,
    flags: tallyFlags(contacts),
    slaDueAt: iso(spec.slaHoursFromNow * HOUR),
    status: spec.status,
    approvalMode: spec.approvalMode,
    decidedAt: decided ? iso(-(spec.decidedHoursAgo ?? 0) * HOUR) : undefined,
    decidedBy: decided ? (spec.status === 'AUTO_APPROVED' ? 'CSQ system' : MOCK_VIEWER.name) : undefined,
  };
}

let auditSeq = 0;
function auditId(): string {
  auditSeq += 1;
  return `a-${auditSeq}`;
}

function baseAudit(spec: BatchSpec, contacts: SampledContact[]): AuditEntry[] {
  const entries: AuditEntry[] = [
    {
      id: auditId(),
      at: iso(-32 * DAY),
      actor: spec.submittedBy,
      role: 'OPERATOR',
      action: 'Started building the customer sample',
    },
    {
      id: auditId(),
      at: iso(-spec.submittedHoursAgo * HOUR),
      actor: spec.submittedBy,
      role: 'OPERATOR',
      action: `Locked and submitted ${contacts.length} contacts for review`,
      detail: `Minimum for this cycle is ${spec.minimum}.`,
    },
  ];

  const late = contacts.filter((c) => c.flags.includes('ADDED_LATE')).length;
  if (late > 0) {
    entries.push({
      id: auditId(),
      at: iso(-spec.submittedHoursAgo * HOUR - HOUR),
      actor: 'CSQ system',
      role: 'SYSTEM',
      action: `${late} contact${late === 1 ? '' : 's'} added after assessment opened`,
      detail: 'Permitted while the sampling and assessment windows overlap.',
    });
  }

  if (spec.status === 'AUTO_APPROVED') {
    entries.push({
      id: auditId(),
      at: iso(-(spec.decidedHoursAgo ?? 0) * HOUR),
      actor: 'CSQ system',
      role: 'SYSTEM',
      action: 'Approved automatically',
      detail: 'This operator is set to automatic approval, so no Super Admin saw the sample.',
    });
  }

  if (spec.status === 'REJECTED') {
    entries.push({
      id: auditId(),
      at: iso(-(spec.decidedHoursAgo ?? 0) * HOUR),
      actor: MOCK_VIEWER.name,
      role: 'SUPER_ADMIN',
      action: `Rejected the batch: ${REJECT_LABEL.BELOW_MINIMUM.toLowerCase()}`,
      detail:
        'Nine contacts against a minimum of twelve, and one address on your own domain. Please add customers you actually served this cycle and resubmit.',
    });
  }

  return entries;
}

/** The Chennai batch is the one that was reviewed properly, so it carries a real diff. */
function chennaiChanges(contacts: SampledContact[]): ContactChange[] {
  const at = iso(-48 * HOUR);
  const removed = contacts[contacts.length - 1];
  const corrected = contacts[1];
  return [
    {
      id: 'ch-maa-1',
      kind: 'REMOVE',
      contactId: removed.id,
      contact: removed,
      reason: 'NOT_A_CUSTOMER',
      note: 'No tonnage booked through this terminal in the cycle.',
      at,
      by: MOCK_VIEWER.name,
    },
    {
      id: 'ch-maa-2',
      kind: 'EDIT',
      contactId: corrected.id,
      contact: { ...corrected, email: corrected.email.replace('@', '@ops.') },
      reason: 'TYPO_CORRECTION',
      note: 'Mail to the submitted address bounced.',
      fields: [
        {
          field: 'email',
          label: 'Email',
          from: corrected.email,
          to: corrected.email.replace('@', '@ops.'),
        },
      ],
      at,
      by: MOCK_VIEWER.name,
    },
  ];
}

const STORE = new Map<string, StoredBatch>();

for (const spec of SPECS) {
  const submitted = buildContacts(spec);
  const audit = baseAudit(spec, submitted);
  const recordedChanges = spec.batchId === 'b-maa-01' ? chennaiChanges(submitted) : [];

  // a batch that was approved holds the sample as approved, so the list and the
  // diff tell the same story
  const contacts =
    spec.status === 'APPROVED'
      ? applyChanges(submitted, recordedChanges, {
          operatorDomains: [spec.operatorDomain],
          assessmentOpensAt: ASSESSMENT_WINDOW.opensAt,
        })
      : submitted;

  for (const change of recordedChanges) {
    audit.push({
      id: auditId(),
      at: change.at,
      actor: change.by,
      role: 'SUPER_ADMIN',
      action: `${CHANGE_KIND_LABEL[change.kind]} ${change.contact.name} (${change.contact.company})`,
      detail: change.note,
      reason: change.reason,
    });
  }

  if (spec.status === 'APPROVED') {
    audit.push({
      id: auditId(),
      at: iso(-(spec.decidedHoursAgo ?? 0) * HOUR),
      actor: MOCK_VIEWER.name,
      role: 'SUPER_ADMIN',
      action: `Approved the batch with ${recordedChanges.length} change${recordedChanges.length === 1 ? '' : 's'}`,
    });
  }

  STORE.set(spec.batchId, {
    spec,
    row: rowFrom(spec, contacts),
    contacts,
    submittedCount: submitted.length,
    recordedChanges,
    audit,
  });
}

/* ---------------- the API surface ---------------- */

const LATENCY = 420;

function wait<T>(value: T, ms: number = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchApprovalQueue(): Promise<ApprovalQueueData> {
  const rows = [...STORE.values()].map((b) => b.row);
  return wait({ viewer: MOCK_VIEWER, rows, generatedAt: new Date().toISOString() });
}

export async function fetchBatchDetail(batchId: string): Promise<BatchDetailData> {
  const batch = STORE.get(batchId);
  if (!batch) {
    await wait(null, 200);
    throw new Error(`No sampling batch with id ${batchId}`);
  }
  return wait({
    row: batch.row,
    samplingWindow: SAMPLING_WINDOW,
    assessmentWindow: ASSESSMENT_WINDOW,
    operatorDomains: [batch.spec.operatorDomain],
    contacts: batch.contacts,
    submittedCount: batch.submittedCount,
    recordedChanges: batch.recordedChanges,
    audit: batch.audit,
  });
}

export async function submitDecision(input: DecisionInput): Promise<DecisionResult> {
  const batch = STORE.get(input.batchId);
  if (!batch) throw new Error(`No sampling batch with id ${input.batchId}`);

  const recordedAt = new Date().toISOString();
  const entries: AuditEntry[] = input.changes.map((change) => ({
    id: auditId(),
    at: change.at,
    actor: change.by,
    role: 'SUPER_ADMIN',
    action: `${CHANGE_KIND_LABEL[change.kind]} ${change.contact.name} (${change.contact.company})`,
    detail: change.note || REASON_LABEL[change.reason],
    reason: change.reason,
  }));

  const status: ApprovalStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  entries.push({
    id: auditId(),
    at: recordedAt,
    actor: MOCK_VIEWER.name,
    role: 'SUPER_ADMIN',
    action:
      input.decision === 'APPROVE'
        ? `Approved the batch with ${input.finalContactIds.length} contacts`
        : `Rejected the batch: ${(input.rejectCode ? REJECT_LABEL[input.rejectCode] : 'reason not given').toLowerCase()}`,
    detail: input.messageToOperator,
  });

  batch.row = { ...batch.row, status, decidedAt: recordedAt, decidedBy: MOCK_VIEWER.name };
  batch.recordedChanges = [...batch.recordedChanges, ...input.changes];
  batch.audit = [...batch.audit, ...entries];
  if (input.decision === 'APPROVE') {
    batch.contacts = batch.contacts
      .filter((c) => input.finalContactIds.includes(c.id))
      .concat(
        input.changes
          .filter((ch) => ch.kind === 'ADD')
          .map((ch) => ch.contact),
      );
    batch.row = { ...batch.row, contactCount: input.finalContactIds.length };
  }

  return wait({ batchId: input.batchId, status, recordedAt, decidedBy: MOCK_VIEWER.name, audit: entries });
}

export async function setApprovalMode(
  operatorId: string,
  mode: ApprovalMode,
): Promise<ApprovalModeResult> {
  const entry: AuditEntry = {
    id: auditId(),
    at: new Date().toISOString(),
    actor: MOCK_VIEWER.name,
    role: 'SUPER_ADMIN',
    action:
      mode === 'AUTOMATIC'
        ? 'Set this operator to automatic approval'
        : 'Set this operator to require review',
    detail: 'Applies to batches submitted from now on.',
  };

  for (const batch of STORE.values()) {
    if (batch.spec.operatorId === operatorId) {
      batch.row = { ...batch.row, approvalMode: mode };
      batch.audit = [...batch.audit, entry];
    }
  }

  return wait({ operatorId, mode, audit: entry }, 260);
}
