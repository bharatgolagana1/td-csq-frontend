import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: true },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(async () => 'tok'),
  forceRefreshToken: vi.fn(async () => false),
}));

import { cycleDetail, cycleSummary, OPERATORS, registration } from '@/features/cycles/fixtures';
import { list, mockApi, one, platformSession, renderWithProviders } from '@/features/cycles/testSupport';

import OverviewPage from './OverviewPage';
import { shareProblems, unlockedOperators } from './useOverviewData';

const routes = <Route path="/overview" element={<OverviewPage />} />;

afterEach(() => vi.unstubAllGlobals());

describe('overview derivations', () => {
  it('lists operators not locked in open sampling windows, soonest closing first, flagged when within 3 days', () => {
    const c = cycleSummary({ status: 'SAMPLING_OPEN' });
    const rows = unlockedOperators([c], [cycleDetail()], new Date('2026-10-09T00:00:00Z'));
    expect(rows.map((r) => r.participant.operator.code)).toEqual(['CLB-DEL']);
    expect(rows[0]?.soon).toBe(true);
    expect(unlockedOperators([{ ...c, status: 'SAMPLING_CLOSED' }], [cycleDetail()])).toEqual([]);
  });

  it('finds airports whose current shares do not total 100', () => {
    expect(shareProblems(OPERATORS).map((s) => `${s.airport.iata}:${s.total}`)).toEqual(['BOM:80']);
  });
});

describe('OverviewPage', () => {
  it('shows active cycle cards with the funnel, what needs attention and quick links', async () => {
    mockApi([
      { path: '/cycles', reply: () => list([cycleSummary(), cycleSummary({ id: 'cy2', code: 'CSQ-26H1', name: 'CSQ 2026 H1', status: 'SCORED' })]) },
      { path: '/cycles/cy1', reply: () => one(cycleDetail()) },
      { path: '/operators', reply: () => list(OPERATORS) },
      { path: '/registrations', reply: () => list([registration()], 3) },
    ]);
    renderWithProviders(routes, { path: '/overview' });
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Active cycles · 1' })).toBeInTheDocument();
    const card = screen.getByRole('link', { name: /CSQ 2026 H2, Sampling open/ });
    expect(within(card).getByRole('img', { name: 'Operators 3, Locked 2, Invited 95, Completed 40' })).toBeInTheDocument();
    expect(within(card).getByText('Sampling closes')).toBeInTheDocument();
    expect(screen.queryByText('CSQ 2026 H1')).toBeNull();

    const unlocked = await screen.findByRole('list', { name: 'Operators not locked' });
    expect(within(unlocked).getByText('Çelebi Delhi Cargo · DEL')).toBeInTheDocument();
    expect(within(unlocked).getByText(/37 \/ 50 selected/)).toBeInTheDocument();

    const shares = await screen.findByRole('list', { name: 'Airports with shares not totalling 100' });
    expect(within(shares).getByText('BOM · Mumbai')).toBeInTheDocument();
    expect(within(shares).getByText('80 %')).toBeInTheDocument();

    const pending = await screen.findByRole('list', { name: 'Registrations pending' });
    expect(within(pending).getByText('Menzies Bengaluru')).toBeInTheDocument();
    expect(within(pending).getByText('and 2 more')).toBeInTheDocument();

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'New cycle' })).toHaveAttribute('href', '/cycles/new');
    expect(within(nav).getByRole('link', { name: 'Market share' })).toHaveAttribute('href', '/market-share');
  });

  it('shows the calm empty state and skips lists the role cannot see', async () => {
    const { calls } = mockApi([{ path: '/cycles', reply: () => list([]) }]);
    renderWithProviders(routes, { path: '/overview', session: platformSession(['monitoring.view', 'cycles.view']) });
    expect(await screen.findByText('No active cycle')).toBeInTheDocument();
    expect(screen.getByText('Every operator in an open sampling window has locked.')).toBeInTheDocument();
    expect(screen.getByText('Needs the operators.view task.')).toBeInTheDocument();
    expect(screen.getByText('Needs the onboarding.review task.')).toBeInTheDocument();
    expect(calls.every((c) => c.path === '/cycles')).toBe(true);
  });
});
