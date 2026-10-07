import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { type Mock } from 'vitest';

import { api } from '@/api/client';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

import SurveyEditorPage from './SurveyEditorPage';
import SurveysPage from './SurveysPage';

/* Shared by the page tests: providers, the two surveys routes and a mocked
   session. The test files mock `@/api/client` themselves (vi.mock is hoisted
   per file); `mocked()` just types the handles. */

export const PLATFORM: Session = {
  user: { id: 'u1', name: 'Anita Rao', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['surveys.view', 'surveys.manage']),
  memberships: [{ orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

export const VIEWER: Session = { ...PLATFORM, role: { code: 'ACFI_ANALYST', scope: 'PLATFORM' }, tasks: new Set(['surveys.view']) };

type Call = (path: string, opts?: { body?: unknown; query?: Record<string, unknown> }) => Promise<unknown>;

export function mocked() {
  return {
    get: api.get as unknown as Mock<Call>,
    post: api.post as unknown as Mock<Call>,
    patch: api.patch as unknown as Mock<Call>,
    put: api.put as unknown as Mock<Call>,
    delete: api.delete as unknown as Mock<Call>,
  };
}

/** GET handler from a path → response map; unknown paths reject loudly. */
export function mockGets(routes: Record<string, unknown>) {
  mocked().get.mockImplementation(async (path) => {
    if (!(path in routes)) throw new Error(`Unmocked GET ${path}`);
    const value = routes[path];
    return typeof value === 'function' ? (value as () => unknown)() : value;
  });
}

export function renderSurveys(path: string, session: Session = PLATFORM) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider session={session}>
            <Routes>
              <Route path="surveys" element={<SurveysPage />} />
              <Route path="surveys/:id" element={<SurveyEditorPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
