import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: true },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(async () => 'tok'),
  forceRefreshToken: vi.fn(async () => false),
}));

import { AuthProvider, type Session } from '@/auth/session';
import { currentCycle } from '@/features/cycles/fixtures';
import { mockApi, operatorSession, platformSession } from '@/features/cycles/testSupport';

import { CycleStrip, pickCurrent, stripPropsFrom, useCycleStripProps } from './CycleStrip';

afterEach(() => vi.unstubAllGlobals());

describe('stripPropsFrom', () => {
  it('maps a sampling-phase entry to the counter and the sampling link', () => {
    const props = stripPropsFrom(currentCycle());
    expect(props).toMatchObject({ cycleName: 'CSQ 2026 H2', cycleCode: 'CSQ-26H2', phase: 'SAMPLING_OPEN', selected: 43, required: 50, to: '/sampling', actionLabel: 'Go to sampling', deadlineLabel: 'Sampling closes' });
    const locked = currentCycle();
    locked.participant.sampling.status = 'LOCKED';
    expect(stripPropsFrom(locked)?.actionLabel).toBe('View sample');
    expect(stripPropsFrom(currentCycle(), { canSample: false, canSelfAssess: true })?.to).toBe('/dashboard');
  });

  it('drops the counter outside sampling and points at the self-assessment or dashboard', () => {
    const open = currentCycle({ nextDeadline: { kind: 'ASSESSMENT_CLOSES', at: '2026-11-09T18:30:00.000Z' } });
    open.cycle.status = 'ASSESSMENT_OPEN';
    const props = stripPropsFrom(open);
    expect(props?.selected).toBeUndefined();
    expect(props).toMatchObject({ to: '/self-assessment', deadlineLabel: 'Assessment closes' });
    const scored = currentCycle({ nextDeadline: null });
    scored.cycle.status = 'SCORED';
    expect(stripPropsFrom(scored)).toMatchObject({ to: '/dashboard', deadlineAt: null });
    expect(stripPropsFrom(null)).toBeNull();
  });

  it('picks the entry with the nearest deadline', () => {
    const later = currentCycle({ nextDeadline: { kind: 'ASSESSMENT_CLOSES', at: '2026-12-01T00:00:00.000Z' } });
    const sooner = currentCycle({ nextDeadline: { kind: 'SAMPLING_CLOSES', at: '2026-10-10T18:30:00.000Z' } });
    expect(pickCurrent([later, sooner])).toBe(sooner);
    expect(pickCurrent([])).toBeNull();
  });
});

function Probe() {
  const cycle = useCycleStripProps();
  return cycle ? <CycleStrip {...cycle} /> : <p>no strip</p>;
}

function renderProbe(session: Session) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider session={session}>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('useCycleStripProps', () => {
  it('fetches GET /cycles/current for an operator session and renders the strip', async () => {
    const { calls } = mockApi([{ path: '/cycles/current', reply: () => ({ data: [currentCycle()] }) }]);
    renderProbe(operatorSession());
    const region = await screen.findByRole('region', { name: 'Current cycle' });
    expect(region).toHaveTextContent('CSQ 2026 H2');
    expect(region).toHaveTextContent('Sampling open');
    expect(region).toHaveTextContent('43 / 50');
    expect(screen.getByRole('link', { name: /Go to sampling/ })).toHaveAttribute('href', '/sampling');
    expect(calls[0]?.query).toEqual({ acoId: 'org-csc' });
  });

  it('stays hidden for platform sessions and when the operator has nothing to act on', async () => {
    const { calls } = mockApi([{ path: '/cycles/current', reply: () => ({ data: [] }) }]);
    const first = renderProbe(platformSession());
    expect(screen.getByText('no strip')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
    first.unmount();

    renderProbe(operatorSession());
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(screen.getByText('no strip')).toBeInTheDocument();
  });
});
