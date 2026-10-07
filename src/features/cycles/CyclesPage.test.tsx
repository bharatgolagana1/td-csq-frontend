import { fireEvent, screen, waitFor } from '@testing-library/react';
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

import CyclesPage from './CyclesPage';
import { cycleSummary } from './fixtures';
import { apiError, list, mockApi, platformSession, renderWithProviders } from './testSupport';

const routes = <Route path="/cycles" element={<CyclesPage />} />;

afterEach(() => vi.unstubAllGlobals());

describe('CyclesPage', () => {
  it('shows the loading count, then the rows with type and status pills, windows and progress', async () => {
    mockApi([{ path: '/cycles', reply: () => list([cycleSummary(), cycleSummary({ id: 'cy2', code: 'CSQ-26H1', name: 'CSQ 2026 H1', status: 'SCORED', type: 'DOMESTIC' })]) }]);
    renderWithProviders(routes, { path: '/cycles' });
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(await screen.findByText('2 cycles')).toBeInTheDocument();
    expect(screen.getAllByText('CSQ 2026 H2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sampling open').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Scored').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Domestic').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 Oct 2026 – 11 Oct 2026/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('2 / 3').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'New cycle' })).toBeInTheDocument();
  });

  it('renders the empty state with the one primary action and passes filters to the API', async () => {
    const { calls } = mockApi([{ path: '/cycles', reply: () => list([]) }]);
    renderWithProviders(routes, { path: '/cycles' });
    expect((await screen.findAllByText('No cycles yet')).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Create the first cycle' }).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'DRAFT' } });
    await waitFor(() => expect(calls.some((c) => c.path === '/cycles' && c.query.status === 'DRAFT' && c.query.page === '1')).toBe(true));
    expect((await screen.findAllByText('No cycles match')).length).toBeGreaterThan(0);
  });

  it('shows the inline error with the request id and a retry', async () => {
    mockApi([{ path: '/cycles', reply: () => apiError(500, 'INTERNAL', 'Database unavailable') }]);
    renderWithProviders(routes, { path: '/cycles' });
    expect(await screen.findByText('Could not load cycles')).toBeInTheDocument();
    expect(screen.getByText(/Database unavailable/)).toBeInTheDocument();
    expect(screen.getByText('req_test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('hides New cycle without cycles.manage', async () => {
    mockApi([{ path: '/cycles', reply: () => list([cycleSummary()]) }]);
    renderWithProviders(routes, { path: '/cycles', session: platformSession(['cycles.view']) });
    expect(await screen.findByText('1 cycle')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New cycle' })).toBeNull();
  });
});
