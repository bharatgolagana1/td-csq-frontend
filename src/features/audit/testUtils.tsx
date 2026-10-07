import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { onTestFinished, vi } from 'vitest';

import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test helpers for this feature: a platform session, the provider stack and a
   route-table fetch mock. Each feature keeps its own copy (features never
   import each other's internals). */

export const PLATFORM_SESSION: Session = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['audit.view', 'operators.view']),
  memberships: [
    { orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' },
    { orgId: 'org-csc', orgName: 'Cargo Service Center', orgType: 'ACO', roleCode: 'ACO_ADMIN', airportId: 'ap-del' },
  ],
};

export function renderWithProviders(ui: ReactNode, session: Session = PLATFORM_SESSION) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  // Stop late refetches from reaching the real fetch after the stub is removed.
  onTestFinished(() => qc.clear());
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider session={session}>{ui}</AuthProvider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

export type MockReply = { status?: number; body?: unknown } | 'pending';
export type MockRoute = { method?: string; path: string | RegExp; reply: (url: URL, body: unknown) => MockReply };

/** Installs a `fetch` stub that answers from the route table; unknown routes get a 404. Returns the spy. */
export function mockFetch(routes: MockRoute[]) {
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : undefined;
    const route = routes.find((r) => (r.method ?? 'GET') === method && (typeof r.path === 'string' ? url.pathname.endsWith(r.path) : r.path.test(url.pathname)));
    const reply = route?.reply(url, body) ?? { status: 404, body: { error: { code: 'NOT_FOUND', message: `No mock for ${method} ${url.pathname}`, requestId: 'req_test' } } };
    if (reply === 'pending') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

/** The URLs the spy was called with, for asserting query strings. */
export function calledUrls(spy: ReturnType<typeof mockFetch>): string[] {
  return spy.mock.calls.map(([input]) => (typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url));
}
