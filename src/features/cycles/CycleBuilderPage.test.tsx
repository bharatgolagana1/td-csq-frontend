import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, useParams } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: true },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(async () => 'tok'),
  forceRefreshToken: vi.fn(async () => false),
}));

import CycleBuilderPage from './CycleBuilderPage';
import { AIRPORTS, cycleDetail, OPERATORS, SETTINGS } from './fixtures';
import { apiError, list, type MockRoute, mockApi, one, renderWithProviders } from './testSupport';

function DetailStub() {
  const { id } = useParams();
  return <p>detail {id}</p>;
}

const routes = (
  <>
    <Route path="/cycles" element={<p>cycles list</p>} />
    <Route path="/cycles/new" element={<CycleBuilderPage />} />
    <Route path="/cycles/:id" element={<DetailStub />} />
    <Route path="/cycles/:id/edit" element={<CycleBuilderPage />} />
  </>
);

const reference: MockRoute[] = [
  { path: '/settings', reply: () => one(SETTINGS) },
  { path: '/airports', reply: () => list(AIRPORTS) },
  { path: '/operators', reply: () => list(OPERATORS) },
];

afterEach(() => vi.unstubAllGlobals());

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/Cycle name/), 'CSQ 2026 H2');
  await user.type(screen.getByLabelText(/^Code/), 'csq-26h2');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByLabelText('Initiation date');
}

function dateInputs() {
  return screen.getAllByLabelText('Date') as HTMLInputElement[];
}

describe('CycleBuilderPage', () => {
  it('derives both windows from the initiation date with the platform defaults and draws the timeline', async () => {
    mockApi(reference);
    const user = userEvent.setup();
    renderWithProviders(routes, { path: '/cycles/new' });
    await fillBasics(user);

    expect(screen.getByText('Set all four dates to see the timeline.')).toBeInTheDocument();
    const derive = screen.getByRole('button', { name: 'Derive windows' });
    expect(derive).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Initiation date'), { target: { value: '2026-10-01' } });
    await waitFor(() => expect(derive).toBeEnabled());
    await user.click(derive);

    // DateTimeInput now shows the formatted wall date (its calendar picker
    // commits ISO under the hood), so the visible values are display strings.
    expect(dateInputs().map((i) => i.value)).toEqual(['1 Oct 2026', '11 Oct 2026', '11 Oct 2026', '10 Nov 2026']);
    expect(screen.getByText('Sampling · 10 d')).toBeInTheDocument();
    expect(screen.getByText('Assessment · 30 d')).toBeInTheDocument();
  });

  it('refuses to move on while the windows are out of order', async () => {
    mockApi(reference);
    const user = userEvent.setup();
    renderWithProviders(routes, { path: '/cycles/new' });
    await fillBasics(user);
    fireEvent.change(screen.getByLabelText('Initiation date'), { target: { value: '2026-10-01' } });
    await user.click(await screen.findByRole('button', { name: 'Derive windows' }));

    // Assessment opens before sampling closes.
    const [, , assessmentStart] = dateInputs();
    fireEvent.change(assessmentStart as HTMLInputElement, { target: { value: '2026-10-05' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Assessment cannot start before sampling has ended')).toBeInTheDocument();
    expect(screen.getByLabelText('Initiation date')).toBeInTheDocument(); // still on the windows step
  });

  it('maps a server VALIDATION error onto the field and jumps to its step', async () => {
    mockApi([...reference, { method: 'POST', path: '/cycles', reply: () => apiError(400, 'VALIDATION', 'Invalid', { issues: [{ path: 'body.code', message: 'Code must be unique' }] }) }]);
    const user = userEvent.setup();
    renderWithProviders(routes, { path: '/cycles/new' });
    await fillBasics(user);
    fireEvent.change(screen.getByLabelText('Initiation date'), { target: { value: '2026-10-01' } });
    await user.click(await screen.findByRole('button', { name: 'Derive windows' }));
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    expect(await screen.findByText('Code must be unique')).toBeInTheDocument();
    expect(screen.getByLabelText(/Cycle name/)).toHaveValue('CSQ 2026 H2');
  });

  it('auto-lists an airport’s operators, warns on shares ≠ 100 and surfaces publish problems with links', async () => {
    const { calls } = mockApi([
      ...reference,
      { method: 'POST', path: '/cycles', reply: ({ body }) => ({ status: 201, body: one(cycleDetail({ id: 'cy9', code: (body as { code: string }).code }, 'DRAFT')) }) },
      {
        method: 'POST',
        path: '/cycles/cy9/publish',
        reply: () => apiError(412, 'PRECONDITION_FAILED', 'Market shares at BOM (Mumbai) total 80, not 100', { airportId: 'ap-bom', iata: 'BOM', name: 'Mumbai', total: 80 }),
      },
    ]);
    const user = userEvent.setup();
    renderWithProviders(routes, { path: '/cycles/new' });
    await fillBasics(user);
    fireEvent.change(screen.getByLabelText('Initiation date'), { target: { value: '2026-10-01' } });
    await user.click(await screen.findByRole('button', { name: 'Derive windows' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Sampling & reminders: defaults from settings, preview visible.
    expect(await screen.findByLabelText(/Minimum sample size/)).toHaveValue(50);
    expect(screen.getByLabelText('Sampling reminder dates')).toHaveTextContent('4 Oct, 09:00');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Participants: choose DEL and BOM; operators come along; BOM shares warn.
    await user.click(await screen.findByLabelText(/DEL · Delhi/));
    await user.click(screen.getByLabelText(/BOM · Mumbai/));
    const del = screen.getByRole('region', { name: 'DEL operators' });
    expect(within(del).getByLabelText(/Cargo Service Center/)).toBeChecked();
    expect(within(del).getByText('Shares 100 %')).toBeInTheDocument();
    const bom = screen.getByRole('region', { name: 'BOM operators' });
    expect(within(bom).getByText(/Shares 80 % ≠ 100/)).toBeInTheDocument();
    await user.click(within(del).getByLabelText(/Çelebi Delhi Cargo/)); // drop one operator
    expect(screen.getByText('2 selected · 2 operators')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Review → Publish… → confirm → create then publish → 412 with a link.
    expect(await screen.findByRole('region', { name: 'Basics' })).toHaveTextContent('CSQ-26H2');
    await user.click(screen.getByRole('button', { name: 'Publish…' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Publish CSQ-26H2?');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));

    expect(await within(dialog).findByText('Not published yet')).toBeInTheDocument();
    expect(within(dialog).getByText('Market shares at BOM (Mumbai) total 80, not 100')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Fix market shares/ })).toHaveAttribute('href', '/market-share');

    const create = calls.find((c) => c.method === 'POST' && c.path === '/cycles');
    expect(create?.body).toMatchObject({
      code: 'CSQ-26H2',
      type: 'BOTH',
      sampling: { start: '2026-10-01T00:00', end: '2026-10-11T00:00' },
      assessment: { start: '2026-10-11T00:00', end: '2026-11-10T00:00' },
      participatingAirportIds: ['ap-del', 'ap-bom'],
      participatingAcoIds: ['org-csc', 'org-mial'],
    });
    expect(calls.some((c) => c.method === 'POST' && c.path === '/cycles/cy9/publish')).toBe(true);
  });

  it('edits a draft and refuses a published cycle', async () => {
    mockApi([
      ...reference,
      { path: '/cycles/cy1', reply: () => one(cycleDetail({ name: 'Draft one' }, 'DRAFT')) },
      { path: '/cycles/cy2', reply: () => one(cycleDetail({ id: 'cy2' }, 'SAMPLING_OPEN')) },
      { method: 'PATCH', path: '/cycles/cy1', reply: ({ body }) => one(cycleDetail({ name: (body as { name: string }).name }, 'DRAFT')) },
    ]);
    const user = userEvent.setup();
    const first = renderWithProviders(routes, { path: '/cycles/cy1/edit' });
    expect(await screen.findByLabelText(/Cycle name/)).toHaveValue('Draft one');
    expect(screen.getByLabelText(/^Code/)).toHaveValue('CSQ-26H2');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(dateInputs()[0]).toHaveValue('1 Oct 2026'));
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    expect(await screen.findByText('detail cy1')).toBeInTheDocument();
    first.unmount();

    renderWithProviders(routes, { path: '/cycles/cy2/edit' });
    expect(await screen.findByText('This cycle is already published')).toBeInTheDocument();
  });
});
