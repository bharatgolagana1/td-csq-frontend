import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { type Airport } from '@/api/airports.types';
import { type OnboardingLink, type Registration, type RegistrationDetail } from '@/api/onboarding.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test helpers for the onboarding feature: a mocked `fetch`, a platform session and fixtures. */

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
  tasks: new Set(['airports.view', 'operators.view', 'onboarding.links', 'onboarding.review']),
  memberships: [{ id: 'm1', orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

export function renderPage(ui: ReactNode, { session = PLATFORM_SESSION, route = '/onboarding', path = '/onboarding' }: { session?: Session; route?: string; path?: string } = {}) {
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
const SOON = new Date(Date.now() + 10 * 86_400_000).toISOString();
const AIRPORT = { id: 'ap-del', iata: 'DEL', name: 'Indira Gandhi International Airport' };

export const DEL: Airport = { ...AIRPORT, icao: 'VIDP', city: 'New Delhi', state: 'Delhi', region: 'North', country: 'IN', lat: 28.5562, lng: 77.1, active: true, operatorCount: 1, createdAt: AT, updatedAt: AT };

export const OPEN_LINK: OnboardingLink = {
  id: 'lnk-1',
  orgType: 'ACO',
  airport: AIRPORT,
  createdBy: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example' },
  expiresAt: SOON,
  usedAt: null,
  registrationId: null,
  note: 'For the new terminal operator',
  status: 'OPEN',
  createdAt: AT,
  updatedAt: AT,
};
export const USED_LINK: OnboardingLink = { ...OPEN_LINK, id: 'lnk-2', note: null, usedAt: AT, registrationId: 'reg-1', status: 'USED' };

export const SUBMITTED: Registration = {
  id: 'reg-1',
  linkId: 'lnk-2',
  orgType: 'ACO',
  airport: AIRPORT,
  organisation: {
    name: 'Delhi Cargo Handlers',
    legalName: 'Delhi Cargo Handlers Pvt Ltd',
    address: { line1: 'Plot 7, Cargo Complex', line2: null, city: 'New Delhi', state: 'Delhi', pincode: '110037' },
    contact: { name: 'Rahul Verma', email: 'rahul@dch.example', phone: '+91 98 7654 3210' },
  },
  operations: { domestic: true, international: false },
  admin: { name: 'Meera Iyer', email: 'meera@dch.example', phone: '+91 98 1111 2222' },
  marketSharePct: 10,
  status: 'SUBMITTED',
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: null,
  resultOrgId: null,
  createdAt: AT,
  updatedAt: AT,
};
export const APPROVED: Registration = { ...SUBMITTED, id: 'reg-0', organisation: { ...SUBMITTED.organisation, name: 'Mumbai Air Cargo' }, status: 'APPROVED', reviewedAt: AT, reviewNote: 'Welcome aboard', resultOrgId: 'org-mac' };

export const SUBMITTED_DETAIL: RegistrationDetail = {
  ...SUBMITTED,
  marketShare: {
    entries: [
      { acoId: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', sharePct: 55 },
      { acoId: 'org-clb', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', sharePct: 45 },
    ],
    total: 100,
    projectedTotal: 110,
  },
};
