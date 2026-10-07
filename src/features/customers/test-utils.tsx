import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { type Customer, type ImportCommit, type ImportValidation, type Participation } from '@/api/customers.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test helpers for the customers feature: a mocked `fetch` keyed on method +
   path, the two sessions the pages care about, and fixtures. */

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

/** Replaces global fetch for the API base; unknown routes answer 404 with a request id. */
export function mockApi(routes: MockRoute[]) {
  const calls: MockCall[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(urlStr, 'http://localhost');
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const method = (init?.method ?? 'GET').toUpperCase();
    let body: unknown;
    if (typeof init?.body === 'string') body = JSON.parse(init.body);
    else if (init?.body instanceof FormData) body = { file: init.body.get('file') };
    calls.push({ method, path, body, url });
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = route.path.exec(path);
      if (!match) continue;
      const res = await route.reply({ url, body, match });
      if (typeof res.body === 'string') return new Response(res.body, { status: res.status ?? 200, headers: { 'content-type': 'text/csv' } });
      return json(res.body ?? {}, res.status ?? 200);
    }
    return json({ error: { code: 'NOT_FOUND', message: `No mock for ${method} ${path}`, requestId: 'req_missing' } }, 404);
  });
  vi.stubGlobal('fetch', fn);
  return { calls, fn };
}

export const list = <T,>(data: T[], total = data.length): MockReply => ({ body: { data, meta: { page: 1, pageSize: 25, total } } });
export const apiError = (status: number, code: string, message: string, details?: unknown): MockReply => ({ status, body: { error: { code, message, details, requestId: 'req_abc123' } } });

export const OPERATOR_SESSION: Session = {
  user: { id: 'u2', name: 'Priya Natarajan', email: 'priya@csc.example', status: 'ACTIVE' },
  org: { id: 'org-csc', name: 'Cargo Service Center', type: 'ACO', airportId: 'ap-del' },
  role: { code: 'ACO_ADMIN', scope: 'ACO' },
  scope: { kind: 'ACO', acoId: 'org-csc' },
  tasks: new Set(['customers.view', 'customers.manage', 'sampling.view', 'sampling.manage', 'sampling.lock', 'cycles.view']),
  memberships: [{ id: 'm2', orgId: 'org-csc', orgName: 'Cargo Service Center', orgType: 'ACO', roleCode: 'ACO_ADMIN', airportId: 'ap-del' }],
};

export const VIEWER_SESSION: Session = { ...OPERATOR_SESSION, role: { code: 'ACO_USER', scope: 'ACO' }, tasks: new Set(['customers.view', 'sampling.view']) };

export const PLATFORM_SESSION: Session = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['customers.view', 'customers.manage', 'sampling.view', 'sampling.manage', 'sampling.lock', 'sampling.unlock', 'operators.view', 'notifications.send', 'cycles.view']),
  memberships: [{ id: 'm1', orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

export function renderPage(ui: ReactNode, { session = OPERATOR_SESSION, route = '/customers' }: { session?: Session; route?: string } = {}) {
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
    tags: ['priority'],
    lastSampledCycleId: 'cy-25h2',
    lastSampledCycle: { id: 'cy-25h2', code: 'CSQ-25H2', name: 'CSQ 2025 H2' },
    importBatchId: null,
    createdAt: '2026-09-01T06:30:00.000Z',
    updatedAt: '2026-09-20T09:00:00.000Z',
    ...overrides,
  };
}

export const CUSTOMERS: Customer[] = [
  customer(),
  customer({ id: 'c2', name: 'Harbor Customs Services', contactPerson: 'Vikram Mehta', email: 'vikram@harbor.example', phone: '+919812345678', type: 'CB', surveyType: 'INTERNATIONAL', tags: [], lastSampledCycleId: null, lastSampledCycle: null }),
  customer({ id: 'c3', name: 'Zenith Freight', contactPerson: 'Zenith Freight', email: 'ops@zenith.example', phone: '+919700000001', type: 'FF', surveyType: 'BOTH', status: 'INACTIVE', tags: ['delhi', 'ops'], lastSampledCycleId: null, lastSampledCycle: null }),
];

export const PARTICIPATION: Participation = {
  customer: { id: 'c1', name: 'Bluewave Logistics Pvt Ltd', contactPerson: 'Asha Rao', email: 'asha@bluewave.example', phone: '+919876543210', type: 'FF', surveyType: 'DOMESTIC', status: 'ACTIVE' },
  cycles: [
    { cycleId: 'cy-25h2', cycle: { id: 'cy-25h2', code: 'CSQ-25H2', name: 'CSQ 2025 H2', type: 'BOTH', status: 'SCORED' }, surveyType: 'DOMESTIC', state: 'LOCKED', addedAt: '2025-10-03T08:00:00.000Z', submitted: true },
    { cycleId: 'cy-25h1', cycle: { id: 'cy-25h1', code: 'CSQ-25H1', name: 'CSQ 2025 H1', type: 'DOMESTIC', status: 'SCORED' }, surveyType: 'DOMESTIC', state: 'LOCKED', addedAt: '2025-04-03T08:00:00.000Z', submitted: false },
  ],
};

export const VALIDATION: ImportValidation = {
  importId: 'imp1',
  acoId: 'org-csc',
  fileName: 'customers.csv',
  status: 'VALIDATED',
  rows: 4,
  accepted: 3,
  rejected: 1,
  errors: [{ row: 4, field: 'phone', message: 'Phone must be a 10-digit Indian mobile or an international number starting with +' }],
  preview: [
    { row: 2, action: 'CREATE', data: { name: 'Northstar Cargo', contactPerson: 'Meera Iyer', email: 'meera@northstar.example', phone: '+919811111111', type: 'FF', surveyType: 'DOMESTIC', tags: ['new'] }, errors: [] },
    { row: 3, action: 'UPDATE', data: { name: 'Bluewave Logistics Pvt Ltd', contactPerson: 'Asha Rao', email: 'asha@bluewave.example', phone: '+919876543210', type: 'FF', surveyType: 'BOTH', tags: ['priority'] }, errors: [] },
    { row: 4, action: 'REJECT', data: { name: 'Broken Row', contactPerson: '', email: 'broken@example.com', phone: '12', type: 'CB', surveyType: 'DOMESTIC', tags: [] }, errors: [{ row: 4, field: 'phone', message: 'Phone must be a 10-digit Indian mobile or an international number starting with +' }] },
    { row: 5, action: 'CREATE', data: { name: 'Sunrise Brokers', contactPerson: 'Rahul Verma', email: 'rahul@sunrise.example', phone: '+919822222222', type: 'CB', surveyType: 'INTERNATIONAL', tags: [] }, errors: [] },
  ],
  headers: { matched: { name: 'Name', contactPerson: 'Contact person', email: 'Email', phone: 'Phone', type: 'Type', surveyType: 'Survey type', tags: 'Tags' }, ignored: ['Notes'], missing: [] },
};

export const COMMIT: ImportCommit = { importId: 'imp1', acoId: 'org-csc', fileName: 'customers.csv', status: 'COMMITTED', rows: 4, accepted: 3, rejected: 1, created: 2, updated: 1, committedAt: '2026-10-07T10:00:00.000Z' };
