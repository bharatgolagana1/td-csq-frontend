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

import { cycleDetail, monitoring } from './fixtures';
import { MonitoringTab } from './MonitoringTab';
import { mockApi, one, renderWithProviders } from './testSupport';

afterEach(() => vi.unstubAllGlobals());

describe('MonitoringTab', () => {
  it('explains an Invites sent of 0 while the locked samples’ invitations wait for the assessment window', async () => {
    const base = monitoring();
    const [del, bom] = base.byAirport as [(typeof base.byAirport)[number], (typeof base.byAirport)[number]];
    const waiting = monitoring({
      status: 'SAMPLING_CLOSED',
      assessment: { invited: 0, readyToSend: 102, started: 0, completed: 0, pending: 0, completionRate: 0 },
      byAirport: [
        { ...del, operators: del.operators.map((o) => ({ ...o, invited: 0, started: 0, completed: 0, readyToSend: o.sampling.status === 'LOCKED' ? 52 : 0 })) },
        { ...bom, operators: bom.operators.map((o) => ({ ...o, invited: 0, started: 0, completed: 0, readyToSend: 50 })) },
      ],
    });
    mockApi([{ path: '/cycles/cy1/monitoring', reply: () => one(waiting) }]);
    renderWithProviders(<Route path="/" element={<MonitoringTab cycle={cycleDetail({ status: 'SAMPLING_CLOSED' })} />} />);

    const hint = await screen.findByText('102 ready to send when the assessment opens');
    const sent = screen.getByText('Invites sent').parentElement as HTMLElement;
    expect(sent).toContainElement(hint);
    expect(sent).toHaveTextContent(/^Invites sent0/);
    const csc = screen.getByRole('row', { name: /Cargo Service Center/ });
    expect(within(csc).getByText('52 ready')).toBeInTheDocument();
    expect(within(csc).getByTitle('52 ready to send when the assessment opens')).toBeInTheDocument();
    // An operator still selecting has nothing waiting.
    expect(within(screen.getByRole('row', { name: /Çelebi Delhi Cargo/ })).queryByText(/ready/)).toBeNull();
  });

  it('shows no hint once the invitations are out', async () => {
    mockApi([{ path: '/cycles/cy1/monitoring', reply: () => one(monitoring({ assessment: { invited: 95, readyToSend: 0, started: 55, completed: 40, pending: 55, completionRate: 42.1 } })) }]);
    renderWithProviders(<Route path="/" element={<MonitoringTab cycle={cycleDetail()} />} />);
    expect(await screen.findByText('Invites sent')).toBeInTheDocument();
    expect(screen.queryByText(/ready to send/)).toBeNull();
  });
});
