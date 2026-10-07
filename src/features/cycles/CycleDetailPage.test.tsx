import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import CycleDetailPage from './CycleDetailPage';
import { auditEntry, cycleDetail, monitoring, notification } from './fixtures';
import { apiError, list, type MockRoute, mockApi, one, platformSession, renderWithProviders } from './testSupport';

const routes = (
  <>
    <Route path="/cycles/:id" element={<CycleDetailPage />} />
    <Route path="/cycles/:id/edit" element={<p>builder</p>} />
  </>
);

function cycleRoutes(detail = cycleDetail()): MockRoute[] {
  return [
    { path: '/cycles/cy1', reply: () => one(detail) },
    { path: '/cycles/cy1/participants', reply: ({ url }) => list(detail.participantList.filter((p) => !url.searchParams.get('samplingStatus') || p.sampling.status === url.searchParams.get('samplingStatus'))) },
    { path: '/cycles/cy1/monitoring', reply: () => one(monitoring()) },
    { path: '/notifications', reply: () => list([notification()]) },
    { path: '/audit', reply: () => list([auditEntry()]) },
  ];
}

afterEach(() => vi.unstubAllGlobals());

describe('CycleDetailPage', () => {
  it('shows the header with status, windows and the operate actions, and the participants table', async () => {
    mockApi(cycleRoutes());
    renderWithProviders(routes, { path: '/cycles/cy1' });
    expect(await screen.findByRole('heading', { name: 'CSQ 2026 H2' })).toBeInTheDocument();
    expect(screen.getByText('Sampling open')).toBeInTheDocument();
    expect(screen.getByText(/Sampling closes in/)).toBeInTheDocument();
    expect(screen.getByText(/1 Oct 2026, 00:00 → 11 Oct 2026, 00:00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transition…' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send sampling reminders' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish…' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit draft' })).toBeNull();

    expect(await screen.findByText('3 participants')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Participants' });
    expect(within(table).getByText('Cargo Service Center')).toBeInTheDocument();
    expect(within(table).getByText('52 / 50')).toBeInTheDocument();
    expect(within(table).getByText('In progress')).toBeInTheDocument();
  });

  it('switches between monitoring, notifications and audit tabs', async () => {
    mockApi(cycleRoutes());
    const user = userEvent.setup();
    renderWithProviders(routes, { path: '/cycles/cy1' });
    await screen.findByRole('heading', { name: 'CSQ 2026 H2' });

    await user.click(screen.getByRole('tab', { name: /Monitoring/ }));
    expect(await screen.findByText('Sample locked')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('42 %')).toBeInTheDocument();
    expect(screen.getByText('DEL · Delhi')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Notifications/ }));
    expect(await screen.findByText('Commencement of assessment cycle CSQ 2026 H2')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Audit/ }));
    const log = await screen.findByRole('list', { name: 'Audit log' });
    expect(within(log).getByText('Published')).toBeInTheDocument();
    expect(within(log).getByText('req req_42')).toBeInTheDocument();
  });

  it('unlocks a locked participant with a reason through the sampling endpoint', async () => {
    const { calls } = mockApi([...cycleRoutes(), { method: 'POST', path: '/sampling/cycles/cy1/unlock', reply: () => one({ ok: true }) }]);
    const user = userEvent.setup();
    renderWithProviders(routes, { path: '/cycles/cy1' });
    await screen.findByText('3 participants');

    const [firstRowActions] = screen.getAllByRole('button', { name: 'Row actions' });
    await user.click(firstRowActions as HTMLElement);
    await user.click(await screen.findByRole('menuitem', { name: 'Unlock sample…' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Unlock Cargo Service Center?');
    await user.click(within(dialog).getByRole('button', { name: 'Unlock sample' }));
    expect(await within(dialog).findByText(/Give a reason/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Reason/), 'Operator asked to add two customers');
    await user.click(within(dialog).getByRole('button', { name: 'Unlock sample' }));

    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/sampling/cycles/cy1/unlock')).toBe(true));
    const call = calls.find((c) => c.path === '/sampling/cycles/cy1/unlock');
    expect(call?.body).toEqual({ acoId: 'org-csc', reason: 'Operator asked to add two customers' });
  });

  it('offers Edit draft and Publish on a draft and shows the publish problems', async () => {
    mockApi([
      ...cycleRoutes(cycleDetail({}, 'DRAFT')),
      { method: 'POST', path: '/cycles/cy1/publish', reply: () => apiError(412, 'PRECONDITION_FAILED', 'No published DOMESTIC survey version; publish the domestic survey first', { surveyType: 'DOMESTIC' }) },
    ]);
    const user = userEvent.setup();
    renderWithProviders(routes, { path: '/cycles/cy1' });
    await screen.findByRole('heading', { name: 'CSQ 2026 H2' });
    expect(screen.getByRole('button', { name: 'Edit draft' })).toBeInTheDocument();
    expect(screen.getByText('Participants are created when the cycle is published')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publish…' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    expect(await within(dialog).findByText(/No published DOMESTIC survey version/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Open surveys/ })).toHaveAttribute('href', '/surveys');
  });

  it('hides operate actions and restricted tabs without the tasks', async () => {
    mockApi(cycleRoutes());
    renderWithProviders(routes, { path: '/cycles/cy1', session: platformSession(['cycles.view']) });
    await screen.findByRole('heading', { name: 'CSQ 2026 H2' });
    expect(screen.queryByRole('button', { name: 'Transition…' })).toBeNull();
    expect(screen.queryByRole('tab', { name: /Monitoring/ })).toBeNull();
    expect(screen.getByRole('tab', { name: /Participants/ })).toBeInTheDocument();
  });
});
