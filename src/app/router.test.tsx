import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { matchRoutes, RouterProvider } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { type Me } from '@/api/types';
import { appRootPath, routerBasename } from '@/lib/basePath';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: true, tokenParsed: undefined },
  initKeycloak: async () => true,
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: async () => 'tok_test',
  forceRefreshToken: async () => false,
}));

import { AppProviders } from './providers';
import { createAppRouter, createRoutes } from './router';

/* The router under a base path (VITE_BASE_PATH=/app/ → basename '/app'):
   routes stay written without the prefix, links and navigation gain it. */

const ME: Me = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  memberships: [{ orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
  active: { orgId: 'org-acfi', roleCode: 'SUPER_ADMIN', tasks: ['cycles.view'], scope: { kind: 'PLATFORM' } },
};

/**
 * jsdom's AbortSignal is not Node's, and the data router builds every navigation
 * as `new Request(url, { signal })`, which undici then rejects (same trick as
 * features/settings/testUtils.tsx).
 */
class SignalFreeRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init ? { ...init, signal: undefined } : undefined);
  }
}

beforeAll(() => {
  vi.stubGlobal('Request', SignalFreeRequest);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/me')) return Response.json({ data: ME });
      return Response.json({ error: { code: 'NOT_FOUND', message: `No mock for ${url}`, requestId: 'req_test' } }, { status: 404 });
    }),
  );
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('routerBasename', () => {
  it('maps the Vite base to a router basename', () => {
    expect(routerBasename('/')).toBe('/');
    expect(routerBasename('')).toBe('/');
    expect(routerBasename('/app/')).toBe('/app');
    expect(routerBasename('/app')).toBe('/app');
    expect(routerBasename('app/')).toBe('/app');
  });

  it('gives the app root with a trailing slash', () => {
    expect(appRootPath('/')).toBe('/');
    expect(appRootPath('/app/')).toBe('/app/');
  });
});

describe('the route tree under basename /app', () => {
  it('matches public and app routes below the prefix only', () => {
    const routes = createRoutes();
    const assess = matchRoutes(routes, '/app/assess/t0k3n', '/app');
    expect(assess?.at(-1)?.route.path).toBe('/assess/:token');
    expect(assess?.at(-1)?.params).toEqual({ token: 't0k3n' });
    expect(matchRoutes(routes, '/app/cycles/c1', '/app')?.at(-1)?.route.path).toBe('cycles/:id');
    expect(matchRoutes(routes, '/assess/t0k3n', '/app')).toBeNull();
  });

  it('renders the shell with prefixed links and navigates under the prefix', async () => {
    window.history.replaceState(null, '', '/app/no-access');
    const router = createAppRouter({ basename: '/app' });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    try {
      expect(router.basename).toBe('/app');
      expect(router.state.matches.at(-1)?.route.path).toBe('no-access');

      render(
        <AppProviders queryClient={qc}>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AppProviders>,
      );
      expect(await screen.findByRole('heading', { name: 'No access' })).toBeInTheDocument();
      // The sidebar writes <NavLink to="/cycles">; the router renders it under the basename.
      expect(screen.getByRole('link', { name: 'Cycles' })).toHaveAttribute('href', '/app/cycles');

      await router.navigate('/does-not-exist');
      // NotFoundPage's EmptyState title (the PageHeader title is mirrored by the Topbar, so it appears twice).
      expect(await screen.findByRole('heading', { name: 'There is nothing at this address' })).toBeInTheDocument();
      expect(window.location.pathname).toBe('/app/does-not-exist');
    } finally {
      router.dispose();
      qc.clear();
    }
  });
});
