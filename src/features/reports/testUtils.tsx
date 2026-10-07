import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test harness for the report pages: a session override, a memory router and
   a fetch stub keyed by API path. Mirrors the shape of src/dev/mockApi.ts. */

export const ACO_SESSION: Session = {
  user: { id: 'u2', name: 'Priya Natarajan', email: 'priya@csc.example', status: 'ACTIVE' },
  org: { id: 'org-csc', name: 'Cargo Service Center', type: 'ACO', airportId: 'ap-del' },
  role: { code: 'ACO_ADMIN', scope: 'ACO' },
  scope: { kind: 'ACO', acoId: 'org-csc' },
  tasks: new Set(['reports.operator', 'reports.airport', 'cycles.view']),
  memberships: [{ orgId: 'org-csc', orgName: 'Cargo Service Center', orgType: 'ACO', roleCode: 'ACO_ADMIN', airportId: 'ap-del' }],
};

export const AIRPORT_SESSION: Session = {
  user: { id: 'u3', name: 'Rohan Mehta', email: 'rohan@delhiairport.example', status: 'ACTIVE' },
  org: { id: 'org-del', name: 'Delhi Airport', type: 'AIRPORT', airportId: 'ap-del' },
  role: { code: 'AIRPORT_ADMIN', scope: 'AIRPORT' },
  scope: { kind: 'AIRPORT', airportId: 'ap-del' },
  tasks: new Set(['reports.airport', 'cycles.view']),
  memberships: [{ orgId: 'org-del', orgName: 'Delhi Airport', orgType: 'AIRPORT', roleCode: 'AIRPORT_ADMIN', airportId: 'ap-del' }],
};

export const PLATFORM_SESSION: Session = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['reports.operator', 'reports.airport', 'reports.national', 'operators.view', 'airports.view', 'cycles.view']),
  memberships: [{ orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

export const OPERATORS = [
  { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 6, customerCount: 212 },
  { id: 'org-celebi', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 4, customerCount: 180 },
];

export type Handler = unknown | ((url: URL) => unknown);

/** Never resolves: keeps a page in its loading state. */
export const PENDING: Handler = () => new Promise(() => undefined);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Stubs `fetch`: `handlers` map an API path (without the base) to a payload; arrays become list envelopes. */
export function mockApi(handlers: Record<string, Handler>) {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(raw, 'http://localhost');
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const handler = handlers[path];
    if (handler === undefined) return json({ error: { code: 'NOT_FOUND', message: `No mock for ${path}`, requestId: 'req_test' } }, 404);
    const body = typeof handler === 'function' ? await (handler as (u: URL) => unknown)(url) : handler;
    if (body instanceof Response) return body;
    return json(Array.isArray(body) ? { data: body, meta: { page: 1, pageSize: body.length, total: body.length } } : { data: body });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export type RenderOptions = { session?: Session; path?: string; routePath?: string };

export function renderPage(ui: ReactNode, { session = PLATFORM_SESSION, path = '/reports/national', routePath = path.split('?')[0] ?? path }: RenderOptions = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider session={session}>
          <ToastProvider>
            <Routes>
              <Route path={routePath} element={ui} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
