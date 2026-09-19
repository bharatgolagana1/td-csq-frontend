import type {
  CommitResult,
  Customer,
  CustomerDraft,
  ImportRow,
  SampleLock,
  SamplingData,
  SamplingPermissions,
} from './sampling.types';
import { rowToDraft } from './sampling.logic';

/**
 * Illustrative directory for one terminal. Every contact, company and number
 * here is invented and the UI says so: no real forwarder or broker is listed.
 *
 * Replace the exported functions with the real calls when the customer and
 * sampling endpoints land. Nothing else in this feature needs to change.
 */

const SERVER_NOW = '2026-09-20T09:40:00+05:30';
const OPERATOR_DOMAIN = 'bomcargoterminal.example';

interface Seed {
  name: string;
  company: string;
  email: string;
  phone: string;
  type: Customer['type'];
  scope: Customer['scope'];
  lastSampledAt: string | null;
  addedAt: string;
  addedBy: string;
}

const FF: Customer['type'] = 'FREIGHT_FORWARDER';
const CB: Customer['type'] = 'CUSTOMS_BROKER';

const SEEDS: Seed[] = [
  { name: 'Priya Nair', company: 'Meridian Freight Services', email: 'priya.nair@meridianfreight.example', phone: '+91 98200 11234', type: FF, scope: 'INTERNATIONAL', lastSampledAt: '2025-08-14', addedAt: '2025-07-02T10:12:00+05:30', addedBy: 'R. Iyer' },
  { name: 'Arun Verma', company: 'Sagar Clearing Agents', email: 'arun.verma@sagarclearing.example', phone: '+91 98450 77812', type: CB, scope: 'BOTH', lastSampledAt: '2025-08-14', addedAt: '2025-07-02T10:14:00+05:30', addedBy: 'R. Iyer' },
  { name: 'Nikhil Rao', company: 'Trident Cargo Movers', email: 'nikhil.rao@tridentcargo.example', phone: '+91 99870 24415', type: FF, scope: 'INTERNATIONAL', lastSampledAt: '2025-08-14', addedAt: '2025-07-02T10:18:00+05:30', addedBy: 'R. Iyer' },
  { name: 'Fatima Sheikh', company: 'Konkan Clearing House', email: 'fatima.sheikh@konkanclearing.example', phone: '+91 98332 66190', type: CB, scope: 'DOMESTIC', lastSampledAt: '2025-08-14', addedAt: '2025-07-03T09:02:00+05:30', addedBy: 'R. Iyer' },
  { name: 'Rajesh Menon', company: 'Anchor Logistics', email: 'rajesh.menon@anchorlogistics.example', phone: '+91 98111 20034', type: FF, scope: 'BOTH', lastSampledAt: null, addedAt: '2025-07-03T09:06:00+05:30', addedBy: 'R. Iyer' },
  { name: 'Sunita Das', company: 'Harbour Gate Brokers', email: 'sunita.das@harbourgate.example', phone: '+91 98214 50077', type: CB, scope: 'INTERNATIONAL', lastSampledAt: '2025-08-14', addedAt: '2025-07-05T14:41:00+05:30', addedBy: 'R. Iyer' },
  { name: 'Imran Qureshi', company: 'Silk Route Forwarders', email: 'imran.qureshi@silkroute.example', phone: '+91 98204 71120', type: FF, scope: 'INTERNATIONAL', lastSampledAt: null, addedAt: '2025-07-05T14:45:00+05:30', addedBy: 'R. Iyer' },
  { name: 'Kavita Joshi', company: 'Deccan Air Cargo', email: 'kavita.joshi@deccanaircargo.example', phone: '+91 99301 55027', type: FF, scope: 'DOMESTIC', lastSampledAt: '2025-08-14', addedAt: '2025-07-09T11:20:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Vikram Bhatia', company: 'Northgate Shipping Agency', email: 'vikram.bhatia@northgateship.example', phone: '+91 98670 31188', type: CB, scope: 'BOTH', lastSampledAt: '2025-08-14', addedAt: '2025-07-09T11:24:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Ananya Ghosh', company: 'Bluewater Freight', email: 'ananya.ghosh@bluewaterfreight.example', phone: '+91 97022 84410', type: FF, scope: 'INTERNATIONAL', lastSampledAt: null, addedAt: '2025-07-14T16:03:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Mohit Saxena', company: 'Everest Customs Consultants', email: 'mohit.saxena@everestcc.example', phone: '+91 98335 12008', type: CB, scope: 'INTERNATIONAL', lastSampledAt: '2025-08-14', addedAt: '2025-07-14T16:09:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Leela Krishnan', company: 'Coastal Cargo Care', email: 'leela.krishnan@coastalcargo.example', phone: '+91 99400 26713', type: FF, scope: 'DOMESTIC', lastSampledAt: null, addedAt: '2025-07-21T10:55:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Harpreet Singh', company: 'Tricolour Logistics', email: 'harpreet.singh@tricolourlog.example', phone: '+91 98765 40021', type: FF, scope: 'BOTH', lastSampledAt: '2025-08-14', addedAt: '2025-07-21T11:01:00+05:30', addedBy: 'S. Pillai' },
  // shares a desk line with the contact below: surfaced as a signal, not an error
  { name: 'Deepak Shetty', company: 'Ironwood Clearing', email: 'deepak.shetty@ironwoodclearing.example', phone: '+91 98201 33440', type: CB, scope: 'INTERNATIONAL', lastSampledAt: null, addedAt: '2025-08-02T12:31:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Reshma Pawar', company: 'Ironwood Clearing', email: 'reshma.pawar@ironwoodclearing.example', phone: '098201 33440', type: CB, scope: 'DOMESTIC', lastSampledAt: null, addedAt: '2025-08-02T12:33:00+05:30', addedBy: 'S. Pillai' },
  { name: 'George Mathew', company: 'Cardinal Air Logistics', email: 'george.mathew@cardinalair.example', phone: '+91 98470 90215', type: FF, scope: 'INTERNATIONAL', lastSampledAt: '2025-08-14', addedAt: '2025-08-11T09:44:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Neha Kulkarni', company: 'Sahyadri Freight Lines', email: 'neha.kulkarni@sahyadrifreight.example', phone: '+91 97640 11829', type: FF, scope: 'DOMESTIC', lastSampledAt: null, addedAt: '2025-08-19T15:12:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Suresh Nambiar', company: 'Fortuna Customs Services', email: 'suresh.nambiar@fortunacs.example', phone: '+91 98860 74003', type: CB, scope: 'BOTH', lastSampledAt: null, addedAt: '2025-09-01T10:07:00+05:30', addedBy: 'S. Pillai' },
  // operator's own mail domain: belongs in the self assessment, not the customer sample
  { name: 'Ajay Kamath', company: 'BOM Cargo Terminal', email: 'ajay.kamath@bomcargoterminal.example', phone: '+91 98920 55510', type: FF, scope: 'INTERNATIONAL', lastSampledAt: null, addedAt: '2026-09-19T17:22:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Meera Rangan', company: 'BOM Cargo Terminal', email: 'meera.rangan@bomcargoterminal.example', phone: '+91 98920 55511', type: CB, scope: 'INTERNATIONAL', lastSampledAt: null, addedAt: '2026-09-19T17:24:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Zoya Ansari', company: 'Lighthouse Forwarding', email: 'zoya.ansari@lighthousefwd.example', phone: '+91 99206 41137', type: FF, scope: 'INTERNATIONAL', lastSampledAt: null, addedAt: '2026-09-19T18:02:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Tarun Gill', company: 'Summit Trade Services', email: 'tarun.gill@summittrade.example', phone: '+91 98118 60094', type: CB, scope: 'BOTH', lastSampledAt: null, addedAt: '2026-09-19T18:05:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Pallavi Desai', company: 'Orchid Cargo Solutions', email: 'pallavi.desai@orchidcargo.example', phone: '+91 97690 22318', type: FF, scope: 'DOMESTIC', lastSampledAt: null, addedAt: '2026-09-20T08:31:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Ravi Chandran', company: 'Peninsula Clearing Co', email: 'ravi.chandran@peninsulaclearing.example', phone: '+91 98410 77256', type: CB, scope: 'INTERNATIONAL', lastSampledAt: '2025-08-14', addedAt: '2026-09-20T08:35:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Ishita Bose', company: 'Delta Wing Freight', email: 'ishita.bose@deltawingfreight.example', phone: '+91 98301 46620', type: FF, scope: 'BOTH', lastSampledAt: null, addedAt: '2026-09-20T08:40:00+05:30', addedBy: 'S. Pillai' },
  { name: 'Farhan Memon', company: 'Gateway Cargo Brokers', email: 'farhan.memon@gatewaycargo.example', phone: '+91 98195 30072', type: CB, scope: 'INTERNATIONAL', lastSampledAt: null, addedAt: '2026-09-20T08:44:00+05:30', addedBy: 'S. Pillai' },
];

function seedToCustomer(seed: Seed, index: number): Customer {
  return { id: `cust-${String(index + 1).padStart(3, '0')}`, ...seed };
}

/** Preview scenarios. The states people forget are the ones that need a way to
    be looked at before there is an API to produce them. */
export type SamplingScenario = 'default' | 'empty' | 'small' | 'locked' | 'awaiting-approval' | 'read-only' | 'denied' | 'error';

export const SCENARIOS: SamplingScenario[] = ['default', 'empty', 'small', 'locked', 'awaiting-approval', 'read-only', 'denied', 'error'];

const FULL_ACCESS: SamplingPermissions = {
  canViewDirectory: true,
  canEditDirectory: true,
  canLockSample: true,
  deniedReason: null,
};

function baseData(): SamplingData {
  return {
    operator: {
      acoId: 'aco-bom-1',
      terminalName: 'Cargo Terminal',
      airportIata: 'BOM',
      airportName: 'Mumbai',
      emailDomain: OPERATOR_DOMAIN,
      terminalScope: 'BOTH',
    },
    cycle: {
      id: 'FY2026-27',
      label: 'FY 2026-27',
      samplingOpensAt: '2026-09-01',
      samplingClosesAt: '2026-10-15',
      assessmentOpensAt: '2026-09-15',
      assessmentClosesAt: '2026-11-30',
      minimumSampleSize: 20,
    },
    customers: SEEDS.map(seedToCustomer),
    lock: null,
    permissions: { ...FULL_ACCESS },
    serverNow: SERVER_NOW,
  };
}

function lockedFixture(customers: Customer[], approvalPending: boolean): SampleLock {
  return {
    lockedAt: '2026-09-19T16:05:00+05:30',
    lockedBy: 'S. Pillai',
    memberIds: customers.slice(0, 22).map((c) => c.id),
    shortfall: 0,
    approval: approvalPending
      ? { status: 'PENDING', reviewer: null, decidedAt: null, note: null }
      : { status: 'NOT_REQUIRED', reviewer: null, decidedAt: null, note: null },
  };
}

let store: SamplingData = baseData();

function clone(data: SamplingData): SamplingData {
  return { ...data, customers: data.customers.map((c) => ({ ...c })), lock: data.lock ? { ...data.lock } : null };
}

function buildScenario(scenario: SamplingScenario): SamplingData {
  const data = baseData();
  switch (scenario) {
    case 'empty':
      data.customers = [];
      return data;
    case 'small':
      // A regional terminal whose whole customer base is under the minimum.
      data.customers = data.customers.slice(0, 12);
      return data;
    case 'locked':
      data.lock = lockedFixture(data.customers, false);
      return data;
    case 'awaiting-approval':
      data.lock = lockedFixture(data.customers, true);
      return data;
    case 'read-only':
      data.permissions = {
        canViewDirectory: true,
        canEditDirectory: false,
        canLockSample: false,
        deniedReason: 'Your account can view the directory but not change it. Ask your terminal administrator for the Sampling role.',
      };
      return data;
    case 'denied':
      data.permissions = {
        canViewDirectory: false,
        canEditDirectory: false,
        canLockSample: false,
        deniedReason: 'Customer contact details are restricted to the terminal administrator and the sampling officer for this account.',
      };
      return data;
    default:
      return data;
  }
}

const LATENCY = 420;

function wait(ms: number = LATENCY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSampling(scenario: SamplingScenario = 'default'): Promise<SamplingData> {
  await wait();
  if (scenario === 'error') throw new Error('sampling-unavailable');
  store = buildScenario(scenario);
  return clone(store);
}

let nextId = SEEDS.length + 1;

function makeId(): string {
  nextId += 1;
  return `cust-${String(nextId).padStart(3, '0')}`;
}

export async function addCustomer(draft: CustomerDraft): Promise<Customer> {
  await wait(260);
  const email = draft.email.trim().toLowerCase();
  if (store.customers.some((c) => c.email.toLowerCase() === email)) {
    throw new Error('That email is already in your directory.');
  }
  const created: Customer = {
    id: makeId(),
    ...draft,
    email,
    lastSampledAt: null,
    addedAt: store.serverNow,
    addedBy: 'You',
  };
  store.customers = [...store.customers, created];
  return { ...created };
}

export async function removeCustomers(ids: string[]): Promise<void> {
  await wait(260);
  const doomed = new Set(ids);
  store.customers = store.customers.filter((c) => !doomed.has(c.id));
}

/**
 * Only rows that pass validation are sent. The server checks uniqueness again,
 * so a contact added by a colleague while this file was open comes back as a
 * rejection rather than silently overwriting.
 */
export async function commitImport(rows: ImportRow[]): Promise<CommitResult> {
  await wait(620);
  const imported: Customer[] = [];
  const rejected: CommitResult['rejected'] = [];

  rows.forEach((row) => {
    const draft = rowToDraft(row.values);
    if (!draft) {
      rejected.push({ lineNumber: row.lineNumber, reason: 'Customer type or form scope could not be read.' });
      return;
    }
    if (store.customers.some((c) => c.email.toLowerCase() === draft.email)) {
      rejected.push({ lineNumber: row.lineNumber, reason: `${draft.email} was added to the directory by someone else while this file was open.` });
      return;
    }
    const created: Customer = {
      id: makeId(),
      ...draft,
      lastSampledAt: null,
      addedAt: store.serverNow,
      addedBy: 'You',
    };
    store.customers = [...store.customers, created];
    imported.push({ ...created });
  });

  return { imported, rejected };
}

export async function lockSample(memberIds: string[], shortfall: number, requiresApproval: boolean): Promise<SampleLock> {
  await wait(700);
  const lock: SampleLock = {
    lockedAt: store.serverNow,
    lockedBy: 'You',
    memberIds: [...memberIds],
    shortfall,
    approval: requiresApproval
      ? { status: 'PENDING', reviewer: null, decidedAt: null, note: null }
      : { status: 'NOT_REQUIRED', reviewer: null, decidedAt: null, note: null },
  };
  store.lock = lock;
  return { ...lock };
}

/**
 * Whether this account's lock needs a Super Admin decision before assessment
 * links go out. Mocked as an account setting; it will arrive on the account.
 */
export function lockNeedsApproval(scenario: SamplingScenario): boolean {
  return scenario === 'awaiting-approval' || scenario === 'default';
}
