import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
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

import { CycleStrip, pickCurrent, stripPropsFor, stripPropsFrom, useCycleStripProps } from './CycleStrip';
import { useStripCycle } from './stripCycle';

afterEach(() => vi.unstubAllGlobals());

describe('stripPropsFrom', () => {
  it('maps a sampling-phase entry to the counter and the sampling link', () => {
    const props = stripPropsFrom(currentCycle());
    expect(props).toMatchObject({ cycleName: 'CSQ 2026 H2', cycleCode: 'CSQ-26H2', phase: 'SAMPLING_OPEN', selected: 43, required: 50, to: '/sampling?cycleId=cy1', actionLabel: 'Go to sampling', deadlineLabel: 'Sampling closes' });
    const locked = currentCycle();
    locked.participant.sampling.status = 'LOCKED';
    expect(stripPropsFrom(locked)?.actionLabel).toBe('View sample');
    expect(stripPropsFrom(currentCycle(), { canSample: false, canSelfAssess: true })?.to).toBe('/dashboard?cycleId=cy1');
  });

  it('drops the counter outside sampling and points at the self-assessment or dashboard', () => {
    const open = currentCycle({ nextDeadline: { kind: 'ASSESSMENT_CLOSES', at: '2026-11-09T18:30:00.000Z' } });
    open.cycle.status = 'ASSESSMENT_OPEN';
    const props = stripPropsFrom(open);
    expect(props?.selected).toBeUndefined();
    expect(props).toMatchObject({ to: '/self-assessment?cycleId=cy1', deadlineLabel: 'Assessment closes' });
    const scored = currentCycle({ nextDeadline: null });
    scored.cycle.status = 'SCORED';
    expect(stripPropsFrom(scored)).toMatchObject({ to: '/dashboard?cycleId=cy1', deadlineAt: null });
    expect(stripPropsFrom(null)).toBeNull();
  });

  it('picks the entry with the nearest deadline', () => {
    const later = currentCycle({ nextDeadline: { kind: 'ASSESSMENT_CLOSES', at: '2026-12-01T00:00:00.000Z' } });
    const sooner = currentCycle({ nextDeadline: { kind: 'SAMPLING_CLOSES', at: '2026-10-10T18:30:00.000Z' } });
    expect(pickCurrent([later, sooner])).toBe(sooner);
    expect(pickCurrent([])).toBeNull();
  });

  it('follows the cycle the page shows: a current one with its counter, a closed one by name; else the default', () => {
    const access = { canSample: true, canSelfAssess: true };
    const h2 = currentCycle();
    const express = currentCycle({ nextDeadline: { kind: 'ASSESSMENT_CLOSES', at: '2026-12-01T00:00:00.000Z' } });
    express.cycle = { ...express.cycle, id: 'cy2', code: 'CSQ-26X', name: 'CSQ 2026 Express', status: 'ASSESSMENT_OPEN' };
    expect(stripPropsFor([h2, express], null, access)).toMatchObject({ cycleName: 'CSQ 2026 H2' });
    expect(stripPropsFor([h2, express], { id: 'cy2', name: 'CSQ 2026 Express', code: 'CSQ-26X', status: 'ASSESSMENT_OPEN' }, access)).toMatchObject({ cycleName: 'CSQ 2026 Express', deadlineLabel: 'Assessment closes', to: '/self-assessment?cycleId=cy2' });
    // A scored cycle on the dashboard is not current: named, no deadline, its dashboard.
    expect(stripPropsFor([h2], { id: 'cy0', name: 'CSQ 2026 H1', code: 'CSQ-26H1', status: 'SCORED' }, access)).toEqual({ cycleName: 'CSQ 2026 H1', cycleCode: 'CSQ-26H1', phase: 'SCORED', tz: undefined, deadlineAt: null, deadlineLabel: 'No deadline', to: '/dashboard?cycleId=cy0', actionLabel: 'Dashboard' });
    // Nothing current: no strip, whatever the page shows.
    expect(stripPropsFor([], { id: 'cy0', name: 'CSQ 2026 H1', code: 'CSQ-26H1', status: 'SCORED' }, access)).toBeNull();
  });
});

function Probe() {
  const cycle = useCycleStripProps();
  return cycle ? <CycleStrip {...cycle} /> : <p>no strip</p>;
}

/** Stands in for a page that shows a cycle (Sampling, Dashboard, Self-assessment). */
function ShowsCycle({ id, name }: { id: string; name: string }) {
  useStripCycle({ id, name, code: id.toUpperCase(), status: 'ASSESSMENT_OPEN', tz: 'Asia/Kolkata' });
  return null;
}

function renderProbe(session: Session, page: ReactNode = null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider session={session}>
          <Probe />
          {page}
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
    expect(screen.getByRole('link', { name: /Go to sampling/ })).toHaveAttribute('href', '/sampling?cycleId=cy1');
    expect(calls[0]?.query).toEqual({ acoId: 'org-csc' });
  });

  it('follows the cycle the page on screen shows, and goes back to the default when the page goes', async () => {
    const express = currentCycle({ nextDeadline: { kind: 'ASSESSMENT_CLOSES', at: '2026-12-01T00:00:00.000Z' } });
    express.cycle = { ...express.cycle, id: 'cy2', code: 'CSQ-26X', name: 'CSQ 2026 Express', status: 'ASSESSMENT_OPEN' };
    mockApi([{ path: '/cycles/current', reply: () => ({ data: [currentCycle(), express] }) }]);
    const view = renderProbe(operatorSession(), <ShowsCycle id="cy2" name="CSQ 2026 Express" />);
    const region = await screen.findByRole('region', { name: 'Current cycle' });
    expect(region).toHaveTextContent('CSQ 2026 Express');
    expect(region).toHaveTextContent('Assessment open');
    expect(screen.getByRole('link', { name: /Self-assessment/ })).toHaveAttribute('href', '/self-assessment?cycleId=cy2');

    // The page goes (another page without a cycle): the strip shows the default current cycle again.
    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider session={operatorSession()}>
            <Probe />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('CSQ 2026 H2')).toBeInTheDocument();
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
