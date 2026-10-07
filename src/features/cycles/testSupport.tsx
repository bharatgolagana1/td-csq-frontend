import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives/Toast/Toast';

/* Test helpers for the cycles and overview pages: a fetch mock keyed by method +
   path, the providers a page needs, and the two session presets. Each test file
   still has to `vi.mock('@/auth/keycloak', …)` itself (vi.mock is per file). */

export const PLATFORM_TASKS = [
  'cycles.view',
  'cycles.manage',
  'cycles.publish',
  'cycles.operate',
  'monitoring.view',
  'operators.view',
  'airports.view',
  'onboarding.review',
  'notifications.view',
  'notifications.send',
  'audit.view',
  'sampling.unlock',
  'surveys.view',
  'marketshare.view',
  'reports.national',
  'settings.view',
];

export function platformSession(tasks: string[] = PLATFORM_TASKS): Session {
  return {
    user: { id: 'u1', name: 'Anita Rao', email: 'anita@acfi.example', status: 'ACTIVE' },
    org: { id: 'org-acfi', name: 'ACFI', type: 'ACFI' },
    role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
    scope: { kind: 'PLATFORM' },
    tasks: new Set(tasks),
    memberships: [{ orgId: 'org-acfi', orgName: 'ACFI', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
  };
}

export function operatorSession(tasks: string[] = ['cycles.view', 'sampling.view', 'customers.view', 'reports.operator', 'assessments.self']): Session {
  return {
    user: { id: 'u2', name: 'Priya Nair', email: 'priya@csc.example', status: 'ACTIVE' },
    org: { id: 'org-csc', name: 'Cargo Service Center', type: 'ACO', airportId: 'ap-del' },
    role: { code: 'ACO_ADMIN', scope: 'ACO' },
    scope: { kind: 'ACO', acoId: 'org-csc' },
    tasks: new Set(tasks),
    memberships: [{ orgId: 'org-csc', orgName: 'Cargo Service Center', orgType: 'ACO', roleCode: 'ACO_ADMIN' }],
  };
}

export type Reply = { status: number; body: unknown };
export type MockRoute = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string | RegExp;
  reply: (ctx: { url: URL; match: RegExpExecArray | null; body: unknown }) => Reply | unknown;
};

export function list<T>(data: T[], total = data.length) {
  return { data, meta: { page: 1, pageSize: data.length, total } };
}
export function one<T>(data: T) {
  return { data };
}
export function apiError(status: number, code: string, message: string, details?: unknown): Reply {
  return { status, body: { error: { code, message, details, requestId: 'req_test' } } };
}
export function isReply(v: unknown): v is Reply {
  return Boolean(v) && typeof v === 'object' && 'status' in (v as object) && 'body' in (v as object);
}

/** Stubs `fetch` for the API base; unmatched calls answer 404 so a missing mock is visible. */
export function mockApi(routes: MockRoute[]) {
  const calls: { method: string; path: string; body: unknown; query: Record<string, string> }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(urlStr, 'http://localhost');
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : undefined;
    calls.push({ method, path, body, query: Object.fromEntries(url.searchParams) });
    const json = (status: number, payload: unknown) => new Response(JSON.stringify(payload ?? {}), { status, headers: { 'Content-Type': 'application/json' } });
    for (const r of routes) {
      if ((r.method ?? 'GET') !== method) continue;
      let match: RegExpExecArray | null = null;
      if (typeof r.path === 'string') {
        if (r.path !== path) continue;
      } else {
        match = r.path.exec(path);
        if (!match) continue;
      }
      const out = r.reply({ url, match, body });
      return isReply(out) ? json(out.status, out.body) : json(200, out);
    }
    return json(404, { error: { code: 'NOT_FOUND', message: `No mock for ${method} ${path}`, requestId: 'req_test' } });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, calls };
}

export function renderWithProviders(ui: ReactNode, { path = '/', session = platformSession() }: { path?: string; session?: Session } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider session={session}>
            <Routes>{ui}</Routes>
          </AuthProvider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
