import type {
  AdminMasterData,
  AdminRole,
  AdminSession,
  AssessorWeight,
  InstrumentVersion,
  Operator,
  Question,
} from './adminMaster.types';
import { nextVersionLabel } from '../adminMaster.logic';

/**
 * Illustrative master data. Operator names are generic on purpose: this console
 * will eventually hold real ACFI records and nothing here should be mistaken
 * for one. Replace the functions below with the real calls when
 * /v1/admin/master lands. Nothing else in this feature needs to change.
 */

const ALL_DIRECTIONS: Question['directions'] = ['EXPORT', 'IMPORT', 'INBOUND', 'OUTBOUND'];
const DEFAULT_FOLLOW_UP: Question['revealFollowUpOn'] = ['FAIR', 'POOR'];

/** The Phase 1 instrument: 23 parameters across four heads. */
const LIVE_QUESTIONS: Question[] = [
  // Infrastructure / Facilities (8), weights inside the head sum to 10000
  { id: 'q-inf-dock', code: 'INF-DOCK', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'Truck docks', text: 'Adequacy of truck docks and their availability at peak hours', directions: ALL_DIRECTIONS, weightBp: 1400, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-inf-space', code: 'INF-SPACE', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'Storage space', text: 'Sufficiency of covered storage and staging area for the volumes handled', directions: ALL_DIRECTIONS, weightBp: 1300, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-inf-mhe', code: 'INF-MHE', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'Handling equipment', text: 'Condition and availability of material handling equipment', directions: ALL_DIRECTIONS, weightBp: 1300, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-inf-cold', code: 'INF-COLD', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'Cold chain', text: 'Cold chain and temperature controlled storage capacity and integrity', directions: ALL_DIRECTIONS, weightBp: 1300, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-inf-uld', code: 'INF-ULD', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'ULD areas', text: 'Adequacy of ULD storage, build up and break down areas', directions: ALL_DIRECTIONS, weightBp: 1200, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-inf-xray', code: 'INF-XRAY', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'Screening equipment', text: 'Availability and uptime of screening equipment', directions: ALL_DIRECTIONS, weightBp: 1200, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-inf-power', code: 'INF-POWER', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'Power and lighting', text: 'Power backup and lighting across operational areas', directions: ALL_DIRECTIONS, weightBp: 1300, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-inf-amen', code: 'INF-AMEN', category: 'INFRASTRUCTURE_FACILITIES', shortLabel: 'Amenities', text: 'Amenities for visiting drivers and agency staff: parking, washrooms, waiting area', directions: ALL_DIRECTIONS, weightBp: 1000, revealFollowUpOn: DEFAULT_FOLLOW_UP },

  // Security / Safety (6)
  { id: 'q-sec-access', code: 'SEC-ACCESS', category: 'SECURITY_SAFETY', shortLabel: 'Access control', text: 'Access control at gates and within the terminal', directions: ALL_DIRECTIONS, weightBp: 1800, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-sec-cctv', code: 'SEC-CCTV', category: 'SECURITY_SAFETY', shortLabel: 'CCTV', text: 'CCTV coverage, retention of recordings and ability to retrieve footage on request', directions: ALL_DIRECTIONS, weightBp: 1700, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-sec-pilfer', code: 'SEC-PILFER', category: 'SECURITY_SAFETY', shortLabel: 'Pilferage and damage', text: 'Prevention and handling of pilferage and damage to consignments', directions: ALL_DIRECTIONS, weightBp: 1900, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-sec-dgr', code: 'SEC-DGR', category: 'SECURITY_SAFETY', shortLabel: 'Dangerous goods', text: 'Handling and segregated storage of dangerous goods', directions: ALL_DIRECTIONS, weightBp: 1600, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-sec-fire', code: 'SEC-FIRE', category: 'SECURITY_SAFETY', shortLabel: 'Fire safety', text: 'Fire detection, suppression and evacuation readiness', directions: ALL_DIRECTIONS, weightBp: 1600, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-sec-staff', code: 'SEC-STAFF', category: 'SECURITY_SAFETY', shortLabel: 'Staff safety', text: 'Safety training and use of protective equipment by terminal staff', directions: ALL_DIRECTIONS, weightBp: 1400, revealFollowUpOn: DEFAULT_FOLLOW_UP },

  // Processes (5)
  { id: 'q-pro-accept', code: 'PRO-ACCEPT', category: 'PROCESSES', shortLabel: 'Acceptance time', text: 'Time taken from arrival at the gate to acceptance of cargo', directions: ALL_DIRECTIONS, weightBp: 2200, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-pro-deliv', code: 'PRO-DELIV', category: 'PROCESSES', shortLabel: 'Delivery time', text: 'Time taken to deliver cargo once documents are cleared', directions: ALL_DIRECTIONS, weightBp: 2200, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-pro-doc', code: 'PRO-DOC', category: 'PROCESSES', shortLabel: 'Documentation', text: 'Accuracy and speed of documentation handling', directions: ALL_DIRECTIONS, weightBp: 2000, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-pro-sys', code: 'PRO-SYS', category: 'PROCESSES', shortLabel: 'System and tracking', text: 'Reliability of the terminal system and quality of status information', directions: ALL_DIRECTIONS, weightBp: 1800, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-pro-griev', code: 'PRO-GRIEV', category: 'PROCESSES', shortLabel: 'Grievance handling', text: 'Responsiveness to queries, escalations and claims', directions: ALL_DIRECTIONS, weightBp: 1800, revealFollowUpOn: DEFAULT_FOLLOW_UP },

  // Trade Facilitation (4)
  { id: 'q-trd-customs', code: 'TRD-CUSTOMS', category: 'TRADE_FACILITATION', shortLabel: 'Customs coordination', text: 'Coordination with Customs and facilitation of examination', directions: ['EXPORT', 'IMPORT'], weightBp: 3000, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-trd-hours', code: 'TRD-HOURS', category: 'TRADE_FACILITATION', shortLabel: 'Service hours', text: 'Working hours and availability of services outside normal hours', directions: ALL_DIRECTIONS, weightBp: 2500, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-trd-charge', code: 'TRD-CHARGE', category: 'TRADE_FACILITATION', shortLabel: 'Charges', text: 'Transparency of tariffs, charges and demurrage', directions: ALL_DIRECTIONS, weightBp: 2500, revealFollowUpOn: DEFAULT_FOLLOW_UP },
  { id: 'q-trd-digital', code: 'TRD-DIGITAL', category: 'TRADE_FACILITATION', shortLabel: 'Digital processes', text: 'Digital payments, electronic delivery orders and paperless processes', directions: ALL_DIRECTIONS, weightBp: 2000, revealFollowUpOn: DEFAULT_FOLLOW_UP },
];

const LIVE: InstrumentVersion = {
  id: 'iv-1',
  label: 'v1.0',
  state: 'PUBLISHED',
  publishedOn: '2025-08-12',
  updatedOn: '2025-08-12',
  updatedBy: 'ACFI Secretariat',
  categories: [
    { code: 'INFRASTRUCTURE_FACILITIES', label: 'Infrastructure / Facilities', weightBp: 3500 },
    { code: 'SECURITY_SAFETY', label: 'Security / Safety', weightBp: 2500 },
    { code: 'PROCESSES', label: 'Processes', weightBp: 2500 },
    { code: 'TRADE_FACILITATION', label: 'Trade Facilitation', weightBp: 1500 },
  ],
  questions: LIVE_QUESTIONS,
};

/**
 * The working draft, left mid edit on purpose. It carries the two faults the
 * publish gate exists to catch: a head whose question weights no longer sum,
 * and a code with a printed ordinal in it. Both are fixable in the console.
 */
const DRAFT: InstrumentVersion = {
  id: 'iv-2',
  label: 'v1.1',
  state: 'DRAFT',
  publishedOn: null,
  updatedOn: '2025-09-17',
  updatedBy: 'ACFI Secretariat',
  categories: LIVE.categories.map((c) => ({ ...c })),
  questions: [
    ...LIVE_QUESTIONS.map((q) => {
      if (q.id === 'q-sec-cctv') return { ...q, weightBp: 1900 };
      if (q.id === 'q-sec-staff') return { ...q, weightBp: 1200 };
      if (q.id === 'q-pro-sys') {
        return {
          ...q,
          shortLabel: 'System uptime',
          text: 'Reliability and uptime of the terminal system, and the quality of shipment status information shared with customers',
          revealFollowUpOn: ['GOOD', 'FAIR', 'POOR'] as Question['revealFollowUpOn'],
        };
      }
      return { ...q };
    }),
    {
      id: 'q-inf-evse',
      code: 'INF-9',
      category: 'INFRASTRUCTURE_FACILITIES',
      shortLabel: 'EV charging',
      text: 'Charging points and turnaround arrangements for electric goods vehicles',
      directions: ALL_DIRECTIONS,
      weightBp: 1000,
      revealFollowUpOn: DEFAULT_FOLLOW_UP,
    },
  ],
};

const ASSESSOR_WEIGHTS: AssessorWeight[] = [
  { kind: 'SELF', weightBp: 0, locked: true, note: 'Reported back to the operator, never counted in the published score' },
  { kind: 'CUSTOMER', weightBp: 7000, locked: false, note: 'The locked sample of freight forwarders and customs brokers' },
  { kind: 'EXTERNAL', weightBp: 3000, locked: false, note: 'Independent auditor appointed by ACFI' },
];

const OPERATORS: Operator[] = [
  { id: 'op-del-1', name: 'Delhi Import Terminal', airportId: 'ap-del', state: 'ACTIVE', formScope: 'INTERNATIONAL', approvalMode: 'ACFI_REVIEW', marketShareBp: 5500, selfRegistered: false, registeredOn: '2025-06-02', contact: { name: 'Operations Head', email: 'ops@delhi-import.example', phone: '+91 11 4000 0001' } },
  { id: 'op-del-2', name: 'Delhi Export Terminal', airportId: 'ap-del', state: 'ACTIVE', formScope: 'INTERNATIONAL', approvalMode: 'ACFI_REVIEW', marketShareBp: 4500, selfRegistered: false, registeredOn: '2025-06-02', contact: { name: 'Terminal Manager', email: 'ops@delhi-export.example', phone: '+91 11 4000 0002' } },
  { id: 'op-bom-1', name: 'Mumbai Cargo Terminal 1', airportId: 'ap-bom', state: 'ACTIVE', formScope: 'BOTH', approvalMode: 'AUTO', marketShareBp: 6000, selfRegistered: false, registeredOn: '2025-06-04', contact: { name: 'Cargo Head', email: 'cargo1@bom.example', phone: '+91 22 6600 0001' } },
  { id: 'op-bom-2', name: 'Mumbai Cargo Terminal 2', airportId: 'ap-bom', state: 'ACTIVE', formScope: 'INTERNATIONAL', approvalMode: 'ACFI_REVIEW', marketShareBp: 3200, selfRegistered: false, registeredOn: '2025-06-04', contact: { name: 'Cargo Head', email: 'cargo2@bom.example', phone: '+91 22 6600 0002' } },
  { id: 'op-blr-1', name: 'Bengaluru Air Cargo Terminal', airportId: 'ap-blr', state: 'ACTIVE', formScope: 'BOTH', approvalMode: 'AUTO', marketShareBp: 10000, selfRegistered: false, registeredOn: '2025-06-09', contact: { name: 'Station Head', email: 'cargo@blr.example', phone: '+91 80 6678 0001' } },
  { id: 'op-maa-1', name: 'Chennai Cargo Terminal', airportId: 'ap-maa', state: 'ACTIVE', formScope: 'INTERNATIONAL', approvalMode: 'ACFI_REVIEW', marketShareBp: 10000, selfRegistered: false, registeredOn: '2025-06-11', contact: { name: 'Cargo Manager', email: 'cargo@maa.example', phone: '+91 44 2256 0001' } },
  { id: 'op-maa-2', name: 'Chennai Perishable Cargo Centre', airportId: 'ap-maa', state: 'SUSPENDED', formScope: 'INTERNATIONAL', approvalMode: 'ACFI_REVIEW', marketShareBp: 0, selfRegistered: false, registeredOn: '2025-06-11', contact: { name: 'Centre In Charge', email: 'perishable@maa.example', phone: '+91 44 2256 0009' } },
  { id: 'op-gau-1', name: 'Guwahati Cargo Terminal', airportId: 'ap-gau', state: 'ACTIVE', formScope: 'DOMESTIC', approvalMode: 'AUTO', marketShareBp: 10000, selfRegistered: false, registeredOn: '2025-07-01', contact: { name: 'Terminal In Charge', email: 'cargo@gau.example', phone: '+91 361 284 0001' } },
  { id: 'op-trv-1', name: 'Trivandrum Cargo Terminal', airportId: 'ap-trv', state: 'REGISTERED', formScope: 'INTERNATIONAL', approvalMode: 'ACFI_REVIEW', marketShareBp: 0, selfRegistered: false, registeredOn: '2025-09-08', contact: { name: 'Cargo Officer', email: 'cargo@trv.example', phone: '+91 471 250 0001' } },
  { id: 'op-amd-1', name: 'Ahmedabad Cargo Terminal', airportId: 'ap-amd', state: 'PENDING_APPROVAL', formScope: null, approvalMode: 'ACFI_REVIEW', marketShareBp: 0, selfRegistered: true, registeredOn: '2025-09-15', contact: { name: 'R. Shah', email: 'terminal@amd.example', phone: '+91 79 2286 0001' } },
  { id: 'op-ccu-1', name: 'Kolkata Cargo Terminal', airportId: 'ap-ccu', state: 'PENDING_APPROVAL', formScope: 'INTERNATIONAL', approvalMode: 'ACFI_REVIEW', marketShareBp: 0, selfRegistered: true, registeredOn: '2025-09-18', contact: { name: 'S. Banerjee', email: 'terminal@ccu.example', phone: '+91 33 2511 0001' } },
];

const DATA: AdminMasterData = {
  airports: [
    { id: 'ap-del', iata: 'DEL', city: 'Delhi', name: 'Indira Gandhi Intl.', scope: 'INTERNATIONAL' },
    { id: 'ap-bom', iata: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj Intl.', scope: 'INTERNATIONAL' },
    { id: 'ap-blr', iata: 'BLR', city: 'Bengaluru', name: 'Kempegowda Intl.', scope: 'INTERNATIONAL' },
    { id: 'ap-maa', iata: 'MAA', city: 'Chennai', name: 'Chennai Intl.', scope: 'INTERNATIONAL' },
    { id: 'ap-ccu', iata: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose Intl.', scope: 'INTERNATIONAL' },
    { id: 'ap-amd', iata: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl.', scope: 'INTERNATIONAL' },
    { id: 'ap-trv', iata: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum Intl.', scope: 'INTERNATIONAL' },
    { id: 'ap-gau', iata: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi Intl.', scope: 'DOMESTIC' },
  ],
  operators: OPERATORS,
  live: LIVE,
  draft: DRAFT,
  assessorWeights: ASSESSOR_WEIGHTS,
  openCycle: { id: 'cy-2025-26', label: 'FY 2025-26', assessmentStarted: true },
};

const LATENCY = 420;

function wait<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Until Keycloak roles are wired in, the URL decides, so the denied path stays reviewable. */
export async function fetchAdminSession(roleHint?: string | null): Promise<AdminSession> {
  const role: AdminRole =
    roleHint === 'aco' ? 'ACO_ADMIN' : roleHint === 'assessor' ? 'ASSESSOR' : 'SUPER_ADMIN';
  return wait({ userName: 'ACFI Secretariat', role }, 200);
}

export async function fetchAdminMaster(): Promise<AdminMasterData> {
  if (typeof window !== 'undefined' && window.location.search.includes('fail=1')) {
    await wait(null, 300);
    throw new Error('master data unavailable');
  }
  return wait({
    ...DATA,
    operators: DATA.operators.map((o) => ({ ...o, contact: { ...o.contact } })),
    live: cloneVersion(DATA.live),
    draft: cloneVersion(DATA.draft),
    assessorWeights: DATA.assessorWeights.map((w) => ({ ...w })),
  });
}

export async function saveOperators(operators: Operator[]): Promise<Operator[]> {
  return wait(operators.map((o) => ({ ...o })));
}

export async function saveDraft(draft: InstrumentVersion): Promise<InstrumentVersion> {
  return wait({ ...cloneVersion(draft), updatedOn: today(), updatedBy: 'ACFI Secretariat' });
}

export async function saveAssessorWeights(weights: AssessorWeight[]): Promise<AssessorWeight[]> {
  return wait(weights.map((w) => ({ ...w })));
}

/**
 * Publishing freezes the draft and forks the next one. A published version is
 * never edited in place because open cycles reference the version they started
 * with, and a score has to stay explainable after the fact.
 */
export async function publishDraft(
  draft: InstrumentVersion,
): Promise<{ live: InstrumentVersion; draft: InstrumentVersion }> {
  const published: InstrumentVersion = {
    ...cloneVersion(draft),
    state: 'PUBLISHED',
    publishedOn: today(),
    updatedOn: today(),
  };
  const forked: InstrumentVersion = {
    ...cloneVersion(draft),
    id: `iv-${Date.now()}`,
    label: nextVersionLabel(draft.label),
    state: 'DRAFT',
    publishedOn: null,
    updatedOn: today(),
  };
  return wait({ live: published, draft: forked }, 700);
}

function cloneVersion(v: InstrumentVersion): InstrumentVersion {
  return {
    ...v,
    categories: v.categories.map((c) => ({ ...c })),
    questions: v.questions.map((q) => ({
      ...q,
      directions: [...q.directions],
      revealFollowUpOn: [...q.revealFollowUpOn],
    })),
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
