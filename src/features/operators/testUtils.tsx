import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { type Airport } from '@/api/airports.types';
import { type MarketShare, type MarketShareCycle } from '@/api/marketshare.types';
import { type Operator } from '@/api/operators.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test helpers for the operators feature: a mocked `fetch`, a platform session and fixtures. */

export type MockReply = { status?: number; body?: unknown };
export type MockRoute = { method: string; path: RegExp; reply: (ctx: { url: URL; body: unknown; match: RegExpExecArray }) => MockReply | Promise<MockReply> };
export type MockCall = { method: string; path: string; body: unknown; url: URL };

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
      const match = route.method === method ? route.path.exec(path) : null;
      if (!match) continue;
      const res = await route.reply({ url, body, match });
      return new Response(JSON.stringify(res.body ?? {}), { status: res.status ?? 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: `No mock for ${method} ${path}`, requestId: 'req_missing' } }), { status: 404 });
  });
  vi.stubGlobal('fetch', fn);
  return { calls, fn };
}

export const list = <T,>(data: T[], total = data.length): MockReply => ({ body: { data, meta: { page: 1, pageSize: 25, total } } });
export const data = (value: unknown, status = 200): MockReply => ({ status, body: { data: value } });
export const apiError = (status: number, code: string, message: string, details?: unknown): MockReply => ({ status, body: { error: { code, message, details, requestId: 'req_abc123' } } });
export const never = (): Promise<MockReply> => new Promise(() => undefined);

export const PLATFORM_SESSION: Session = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['airports.view', 'operators.view', 'operators.manage', 'marketshare.view', 'cycles.view', 'users.view', 'users.manage', 'roles.view']),
  memberships: [{ id: 'm1', orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

export function renderPage(ui: ReactNode, { session = PLATFORM_SESSION, route = '/operators', path = '/operators' }: { session?: Session; route?: string; path?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <AuthProvider session={session}>
          <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path={path} element={ui} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const AT = '2026-09-01T06:00:00.000Z';

export const DEL: Airport = { id: 'ap-del', iata: 'DEL', icao: 'VIDP', name: 'Indira Gandhi International Airport', city: 'New Delhi', state: 'Delhi', region: 'North', country: 'IN', lat: 28.5562, lng: 77.1, active: true, createdAt: AT, updatedAt: AT };

export const CSC: Operator = {
  id: 'org-csc',
  code: 'CSC-DEL',
  name: 'Cargo Service Center',
  legalName: 'Cargo Service Center India Pvt Ltd',
  airport: { id: 'ap-del', iata: 'DEL', name: 'Indira Gandhi International Airport' },
  operations: { domestic: true, international: true },
  address: { line1: 'Cargo Terminal 2', line2: null, city: 'New Delhi', state: 'Delhi', pincode: '110037' },
  contact: { name: 'Priya Natarajan', email: 'priya@csc.example', phone: '+91 98 1234 5678' },
  status: 'ACTIVE',
  createdVia: 'ADMIN',
  memberCount: 6,
  customerCount: 212,
  currentShare: 55,
  approvedAt: AT,
  createdAt: AT,
  updatedAt: AT,
};
export const CLB: Operator = { ...CSC, id: 'org-clb', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', legalName: null, operations: { domestic: true, international: false }, memberCount: 4, customerCount: 180, currentShare: 45, createdVia: 'LINK' };

export const CYCLE: MarketShareCycle = { id: 'cy-26h1', code: 'CSQ-26H1', name: 'CSQ 2026 H1', status: 'SCORED', type: 'BOTH' };

export const CYCLE_SHARE: MarketShare = {
  airportId: 'ap-del',
  cycleId: 'cy-26h1',
  entries: [
    { acoId: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', sharePct: 60 },
    { acoId: 'org-clb', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', sharePct: 40 },
  ],
  total: 100,
  frozen: true,
};
