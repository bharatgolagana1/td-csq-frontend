import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { type Me } from '@/api/types';

vi.mock('./keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(),
  forceRefreshToken: vi.fn(),
}));

import { RequireTask } from './RequireTask';
import { AuthProvider, type Session, sessionFromMe, useSession } from './session';

const SESSION: Session = {
  user: { id: 'u1', name: 'Priya', email: 'priya@csc.example', status: 'ACTIVE' },
  org: { id: 'org-csc', name: 'Cargo Service Center', type: 'ACO', airportId: 'ap-del' },
  role: { code: 'ACO_ADMIN', scope: 'ACO' },
  scope: { kind: 'ACO', acoId: 'org-csc' },
  tasks: new Set(['customers.view', 'sampling.view']),
  memberships: [{ orgId: 'org-csc', orgName: 'Cargo Service Center', orgType: 'ACO', roleCode: 'ACO_ADMIN' }],
};

function Who() {
  const s = useSession();
  return (
    <p>
      {s.user.name} · {s.org.name} · {s.hasTask('customers.view') ? 'can' : 'cannot'} view customers
    </p>
  );
}

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AuthProvider', () => {
  it('renders children immediately with a session override', () => {
    render(
      wrap(
        <AuthProvider session={SESSION}>
          <Who />
        </AuthProvider>,
      ),
    );
    expect(screen.getByText('Priya · Cargo Service Center · can view customers')).toBeInTheDocument();
  });

  it('RequireTask renders the No access page instead of the child', () => {
    render(
      wrap(
        <AuthProvider session={SESSION}>
          <RequireTask task="cycles.manage">
            <p>secret</p>
          </RequireTask>
          <RequireTask task={['cycles.manage', 'sampling.view']}>
            <p>allowed</p>
          </RequireTask>
        </AuthProvider>,
      ),
    );
    expect(screen.queryByText('secret')).toBeNull();
    expect(screen.getByRole('heading', { name: 'No access' })).toBeInTheDocument();
    expect(screen.getByText(/ACO admin/)).toBeInTheDocument();
    expect(screen.getByText('allowed')).toBeInTheDocument();
  });

  it('builds a session from GET /me', () => {
    const me: Me = {
      user: { id: 'u9', name: 'Anita', email: 'anita@acfi.example', status: 'ACTIVE' },
      memberships: [
        { orgId: 'org-acfi', orgName: 'ACFI', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' },
        { orgId: 'org-csc', orgName: 'CSC', orgType: 'ACO', roleCode: 'ACO_ADMIN', airportId: 'ap-del' },
      ],
      active: { orgId: 'org-csc', roleCode: 'ACO_ADMIN', tasks: ['customers.view'], scope: { kind: 'ACO', acoId: 'org-csc' } },
    };
    const s = sessionFromMe(me);
    expect(s.org).toEqual({ id: 'org-csc', name: 'CSC', type: 'ACO', airportId: 'ap-del' });
    expect(s.role).toEqual({ code: 'ACO_ADMIN', scope: 'ACO' });
    expect(s.tasks.has('customers.view')).toBe(true);
    expect(s.memberships).toHaveLength(2);
  });
});
