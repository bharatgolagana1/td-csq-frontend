import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { type Airport, type AirportDetail } from '@/api/airports.types';
import { type MarketShare } from '@/api/marketshare.types';
import { type Operator } from '@/api/operators.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test helpers for the airports feature: a mocked `fetch`, a platform session and fixtures. */

export type MockReply = { status?: number; body?: unknown };
export type MockRoute = { method: string; path: RegExp; reply: (ctx: { url: URL; body: unknown; raw: string | undefined; match: RegExpExecArray }) => MockReply | Promise<MockReply> };
export type MockCall = { method: string; path: string; body: unknown; url: URL };

export function mockApi(routes: MockRoute[]) {
  const calls: MockCall[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(urlStr, 'http://localhost');
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const method = (init?.method ?? 'GET').toUpperCase();
    const raw = typeof init?.body === 'string' ? init.body : undefined;
    let body: unknown;
    try {
      body = raw === undefined ? undefined : JSON.parse(raw);
    } catch {
      body = raw;
    }
    calls.push({ method, path, body, url });
    for (const route of routes) {
      const match = route.method === method ? route.path.exec(path) : null;
      if (!match) continue;
      const res = await route.reply({ url, body, raw, match });
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
  tasks: new Set(['airports.view', 'airports.manage', 'operators.view', 'operators.manage', 'marketshare.view', 'marketshare.manage', 'cycles.view']),
  memberships: [{ id: 'm1', orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

export function renderPage(ui: ReactNode, { session = PLATFORM_SESSION, route = '/airports', path = '/airports' }: { session?: Session; route?: string; path?: string } = {}) {
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
export const BOM: Airport = { id: 'ap-bom', iata: 'BOM', icao: 'VABB', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', state: 'Maharashtra', region: 'West', country: 'IN', lat: 19.0896, lng: 72.8656, active: false, createdAt: AT, updatedAt: AT };

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
export const CLB: Operator = { ...CSC, id: 'org-clb', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', legalName: null, memberCount: 4, customerCount: 180, currentShare: 45, createdVia: 'LINK' };

export const DEL_SHARE: MarketShare = {
  airportId: 'ap-del',
  cycleId: null,
  entries: [
    { acoId: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', sharePct: 55 },
    { acoId: 'org-clb', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', sharePct: 45 },
  ],
  total: 100,
  frozen: false,
};

export const DEL_DETAIL: AirportDetail = { ...DEL, operators: [CSC, CLB], marketShare: DEL_SHARE };
