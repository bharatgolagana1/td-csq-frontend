import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { type Customer } from '@/api/customers.types';
import { type Invitation } from '@/api/invitations.types';
import { eligibleEntries } from '@/api/sampling';
import { type CurrentCycle, type ParticipantSummary, type SamplingAuditEntry, type SelectionRow, type SelectionState } from '@/api/sampling.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test helpers for the sampling feature: a mocked `fetch`, sessions and fixtures
   for the four states the screen has (in progress · lockable · shortfall · locked). */

export type MockReply = { status?: number; body?: unknown };
export type MockRoute = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: RegExp;
  reply: (ctx: { url: URL; body: unknown; match: RegExpExecArray }) => MockReply | Promise<MockReply>;
};
export type MockCall = { method: string; path: string; body: unknown; url: URL };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

export function mockApi(routes: MockRoute[]) {
  const calls: MockCall[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(urlStr, 'http://localhost');
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const method = (init?.method ?? 'GET').toUpperCase();
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, body, url });
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = route.path.exec(path);
      if (!match) continue;
      const res = await route.reply({ url, body, match });
      return json(res.body ?? {}, res.status ?? 200);
    }
    return json({ error: { code: 'NOT_FOUND', message: `No mock for ${method} ${path}`, requestId: 'req_missing' } }, 404);
  });
  vi.stubGlobal('fetch', fn);
  return { calls, fn };
}

export const list = <T,>(data: T[], total = data.length): MockReply => ({ body: { data, meta: { page: 1, pageSize: 25, total } } });
export const data = (value: unknown, status = 200): MockReply => ({ status, body: { data: value } });
export const apiError = (status: number, code: string, message: string, details?: unknown): MockReply => ({ status, body: { error: { code, message, details, requestId: 'req_abc123' } } });

export const OPERATOR_SESSION: Session = {
  user: { id: 'u2', name: 'Priya Natarajan', email: 'priya@csc.example', status: 'ACTIVE' },
  org: { id: 'org-csc', name: 'Cargo Service Center', type: 'ACO', airportId: 'ap-del' },
  role: { code: 'ACO_ADMIN', scope: 'ACO' },
  scope: { kind: 'ACO', acoId: 'org-csc' },
  tasks: new Set(['customers.view', 'customers.manage', 'sampling.view', 'sampling.manage', 'sampling.lock', 'cycles.view']),
  memberships: [{ id: 'm2', orgId: 'org-csc', orgName: 'Cargo Service Center', orgType: 'ACO', roleCode: 'ACO_ADMIN', airportId: 'ap-del' }],
};

export const PLATFORM_SESSION: Session = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['customers.view', 'customers.manage', 'sampling.view', 'sampling.manage', 'sampling.lock', 'sampling.unlock', 'operators.view', 'notifications.send', 'cycles.view']),
  memberships: [{ id: 'm1', orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

export function renderPage(ui: ReactNode, { session = OPERATOR_SESSION, route = '/sampling' }: { session?: Session; route?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <AuthProvider session={session}>
          <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {ui}
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

// --- fixtures ----------------------------------------------------------------------

const DAY = 86_400_000;
export const NOW = Date.now();
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

export const PARTICIPANT: ParticipantSummary = {
  cycleId: 'cy-26h2',
  acoId: 'org-csc',
  airportId: 'ap-del',
  surveyTypes: ['DOMESTIC', 'INTERNATIONAL'],
  requiredSampleSize: 50,
  sampling: { status: 'IN_PROGRESS', selectedCount: 37, lockedAt: null, lockedBy: null, lockedByUser: null, unlockedAt: null, unlockedBy: null, unlockedByUser: null, unlockReason: null },
};

export const CURRENT: CurrentCycle = {
  cycle: {
    id: 'cy-26h2',
    code: 'CSQ-26H2',
    name: 'CSQ 2026 H2',
    type: 'BOTH',
    status: 'SAMPLING_OPEN',
    tz: 'Asia/Kolkata',
    sampling: { start: { wall: '2026-10-01T00:00', utc: iso(-6 * DAY) }, end: { wall: '2026-10-10T23:59', utc: iso(3 * DAY + 2 * 3_600_000) } },
    assessment: { start: { wall: '2026-10-15T00:00', utc: iso(8 * DAY) }, end: { wall: '2026-11-14T23:59', utc: iso(38 * DAY) } },
    minSampleSize: 50,
  },
  participant: { ...PARTICIPANT, id: 'p1', airportId: 'ap-del' },
  nextDeadline: { kind: 'SAMPLING_CLOSES', at: iso(3 * DAY + 2 * 3_600_000) },
};

export function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'c1',
    acoId: 'org-csc',
    airportId: 'ap-del',
    name: 'Bluewave Logistics Pvt Ltd',
    contactPerson: 'Asha Rao',
    email: 'asha@bluewave.example',
    phone: '+919876543210',
    type: 'FF',
    surveyType: 'DOMESTIC',
    status: 'ACTIVE',
    tags: [],
    lastSampledCycleId: null,
    importBatchId: null,
    createdAt: '2026-09-01T06:30:00.000Z',
    updatedAt: '2026-09-20T09:00:00.000Z',
    ...overrides,
  };
}

/** Four active customers → five eligible entries (Zenith is BOTH). */
export const ACTIVE_CUSTOMERS: Customer[] = [
  customer(),
  customer({ id: 'c2', name: 'Harbor Customs Services', contactPerson: 'Vikram Mehta', email: 'vikram@harbor.example', type: 'CB', surveyType: 'INTERNATIONAL' }),
  customer({ id: 'c3', name: 'Zenith Freight', contactPerson: 'Zenith Freight', email: 'ops@zenith.example', type: 'FF', surveyType: 'BOTH' }),
  customer({ id: 'c4', name: 'Monsoon Brokers', contactPerson: 'Meera Iyer', email: 'meera@monsoon.example', type: 'CB', surveyType: 'DOMESTIC' }),
];

const summary = (c: Customer) => ({ id: c.id, name: c.name, contactPerson: c.contactPerson, email: c.email, phone: c.phone, type: c.type, surveyType: c.surveyType, status: c.status });

export const SELECTION: SelectionRow[] = [
  { id: 's1', customerId: 'c1', customer: summary(ACTIVE_CUSTOMERS[0] ?? customer()), surveyType: 'DOMESTIC', state: 'SELECTED', addedAt: iso(-2 * DAY), addedBy: 'u2' },
  { id: 's2', customerId: 'c3', customer: summary(ACTIVE_CUSTOMERS[2] ?? customer()), surveyType: 'INTERNATIONAL', state: 'SELECTED', addedAt: iso(-DAY), addedBy: 'u2' },
];

export function samplingState(overrides: Partial<SelectionState> = {}): SelectionState {
  return {
    cycle: { id: 'cy-26h2', code: 'CSQ-26H2', name: 'CSQ 2026 H2', type: 'BOTH', status: 'SAMPLING_OPEN', samplingStart: CURRENT.cycle.sampling.start.utc, samplingEnd: CURRENT.cycle.sampling.end.utc },
    participant: PARTICIPANT,
    required: 50,
    selectedCount: 37,
    eligibleCount: 120,
    lockable: false,
    reason: 'BELOW_MINIMUM',
    shortfallRule: null,
    remaining: 13,
    target: 50,
    progress: '37 / 50',
    progressPct: 74,
    editable: true,
    selection: SELECTION,
    ...overrides,
  };
}

export const IN_PROGRESS = samplingState();
export const LOCKABLE = samplingState({ selectedCount: 50, lockable: true, reason: null, remaining: 0, progress: '50 / 50', progressPct: 100, participant: { ...PARTICIPANT, sampling: { ...PARTICIPANT.sampling, selectedCount: 50 } } });
export const SHORTFALL = samplingState({ selectedCount: 10, eligibleCount: 42, lockable: false, reason: 'SELECT_ALL_REQUIRED', shortfallRule: 'SELECT_ALL', remaining: 32, target: 42, progress: '10 / 50', progressPct: 24 });
export const LOCKED = samplingState({
  selectedCount: 50,
  lockable: false,
  reason: 'ALREADY_LOCKED',
  remaining: 0,
  progress: '50 / 50',
  progressPct: 100,
  editable: false,
  participant: { ...PARTICIPANT, sampling: { status: 'LOCKED', selectedCount: 50, lockedAt: iso(-3_600_000), lockedBy: 'u2', lockedByUser: { id: 'u2', name: 'Priya Nair' }, unlockedAt: null, unlockedBy: null, unlockedByUser: null, unlockReason: null } },
  selection: SELECTION.map((r) => ({ ...r, state: 'LOCKED' as const })),
});

export const INVITATIONS: Invitation[] = [
  { id: 'i1', cycleId: 'cy-26h2', acoId: 'org-csc', airportId: 'ap-del', customerId: 'c1', assessmentId: null, surveyType: 'DOMESTIC', state: 'SENT', emailMasked: 'a***@bluewave.example', customer: { nameMasked: 'B*** Logistics Pvt Ltd', type: 'FF' }, sentAt: iso(-2 * DAY), openedAt: null, verifiedAt: null, submittedAt: null, revokedAt: null, expiresAt: iso(30 * DAY), remindersSent: 1, lastReminderAt: iso(-DAY), createdAt: iso(-3 * DAY), updatedAt: iso(-DAY) },
  { id: 'i2', cycleId: 'cy-26h2', acoId: 'org-csc', airportId: 'ap-del', customerId: 'c3', assessmentId: 'a2', surveyType: 'INTERNATIONAL', state: 'SUBMITTED', emailMasked: 'o***@zenith.example', customer: { nameMasked: 'Z*** Freight', type: 'FF' }, sentAt: iso(-2 * DAY), openedAt: iso(-DAY), verifiedAt: iso(-DAY), submittedAt: iso(-3_600_000), revokedAt: null, expiresAt: iso(30 * DAY), remindersSent: 0, lastReminderAt: null, createdAt: iso(-3 * DAY), updatedAt: iso(-3_600_000) },
  { id: 'i3', cycleId: 'cy-26h2', acoId: 'org-csc', airportId: 'ap-del', customerId: 'c4', assessmentId: null, surveyType: 'DOMESTIC', state: 'OPENED', emailMasked: 'm***@monsoon.example', customer: { nameMasked: 'M*** Brokers', type: 'CB' }, sentAt: iso(-2 * DAY), openedAt: iso(-DAY), verifiedAt: null, submittedAt: null, revokedAt: null, expiresAt: iso(30 * DAY), remindersSent: 2, lastReminderAt: iso(-DAY), createdAt: iso(-3 * DAY), updatedAt: iso(-DAY) },
];

export const AUDIT: SamplingAuditEntry[] = [
  { id: 'a2', actorUserId: 'u2', actorEmail: 'priya@csc.example', actorOrgId: 'org-csc', orgId: 'org-csc', action: 'sample.selection.changed', entity: 'cycle_participant', entityId: 'cy-26h2', before: { selectedCount: 35 }, after: { selectedCount: 37, required: 50, added: [{}, {}], removed: [], rejected: 0 }, ip: '10.0.0.1', requestId: 'req_sel_002', at: iso(-DAY) },
  { id: 'a1', actorUserId: 'u2', actorEmail: 'priya@csc.example', actorOrgId: 'org-csc', orgId: 'org-csc', action: 'sample.selection.changed', entity: 'cycle_participant', entityId: 'cy-26h2', before: { selectedCount: 0 }, after: { selectedCount: 35, required: 50, added: new Array(35).fill({}), removed: [], rejected: 0 }, ip: '10.0.0.1', requestId: 'req_sel_001', at: iso(-2 * DAY) },
];

/** The routes the page needs for a given state. */
export function samplingRoutes(state: SelectionState, extra: MockRoute[] = []): MockRoute[] {
  return [
    { method: 'GET', path: /^\/cycles\/current$/, reply: () => data([CURRENT]) },
    { method: 'GET', path: /^\/sampling\/cycles\/cy-26h2$/, reply: () => data(state) },
    { method: 'GET', path: /^\/customers\/eligible$/, reply: () => list(eligibleEntries(ACTIVE_CUSTOMERS, 'BOTH')) },
    { method: 'GET', path: /^\/sampling\/cycles\/cy-26h2\/audit$/, reply: () => list(AUDIT) },
    { method: 'GET', path: /^\/invitations$/, reply: () => list(INVITATIONS) },
    { method: 'GET', path: /^\/operators$/, reply: () => list([{ id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 6, customerCount: 212 }]) },
    ...extra,
  ];
}
