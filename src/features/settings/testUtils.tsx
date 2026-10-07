import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router-dom';
import { onTestFinished, vi } from 'vitest';

import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

/* Test helpers for this feature: a platform session, the provider stack on a
   data router (the dirty guard uses `useBlocker`) and a route-table fetch mock.
   Each feature keeps its own copy (features never import each other's internals). */

export const PLATFORM_SESSION: Session = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['settings.view', 'settings.manage', 'roles.view']),
  memberships: [{ orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

function Frame() {
  return (
    <>
      <nav>
        <Link to="/users">Users</Link>
      </nav>
      <Outlet />
    </>
  );
}

/**
 * jsdom's AbortSignal is not Node's, and the data router builds every navigation
 * as `new Request(url, { signal })`, which undici then rejects. Dropping the
 * signal keeps navigation working in tests (nothing here aborts a loader).
 */
class SignalFreeRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init ? { ...init, signal: undefined } : undefined);
  }
}

/** Mounts `ui` at /settings inside a data router with a /users sibling so navigation can be exercised. */
export function renderWithProviders(ui: ReactNode, session: Session = PLATFORM_SESSION) {
  vi.stubGlobal('Request', SignalFreeRequest);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  onTestFinished(() => qc.clear());
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AuthProvider session={session}>
            <Frame />
          </AuthProvider>
        ),
        children: [
          { path: 'settings', element: ui },
          { path: 'users', element: <h1>Users page</h1> },
          { path: 'users/roles', element: <h1>Matrix page</h1> },
        ],
      },
    ],
    { initialEntries: ['/settings'], future: { v7_relativeSplatPath: true } },
  );
  const result = render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { ...result, router, qc };
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

/** The PATCH bodies the spy received, in order. */
export function patchBodies(spy: ReturnType<typeof mockFetch>): unknown[] {
  return spy.mock.calls.filter(([, init]) => (init?.method ?? 'GET').toUpperCase() === 'PATCH').map(([, init]) => JSON.parse(String(init?.body)) as unknown);
}
