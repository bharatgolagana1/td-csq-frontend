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

import { type CreateCycleInput, type CycleDetail, type PatchCycleInput, type WindowInput } from '@/api/cycles.types';

import CycleBuilderPage from './CycleBuilderPage';
import { deriveWindows } from './derive';
import { AIRPORTS, cycleDetail, OPERATORS, SETTINGS, window as cycleWindow } from './fixtures';
import { apiError, list, type MockRoute, mockApi, one, renderInDataRouter } from './testSupport';

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
    <Route path="/market-share" element={<p>market share page</p>} />
  </>
);

/** An airport nobody operates at: its shares total 0, so it must not be offered. */
const PORT_BLAIR = { ...AIRPORTS[1], id: 'ap-ixz', iata: 'IXZ', icao: 'VOPB', name: 'Port Blair', operatorCount: 0 };

const reference: MockRoute[] = [
  { path: '/cycles', reply: () => list([]) },
  { path: '/settings', reply: () => one(SETTINGS) },
  { path: '/airports', reply: () => list([...AIRPORTS, PORT_BLAIR]) },
  { path: '/operators', reply: () => list(OPERATORS) },
  // What publishing checks: BOM's current shares total 80.
  {
    path: '/market-share/totals',
    reply: ({ url }) => one((url.searchParams.get('airportIds') ?? '').split(',').map((airportId) => ({ airportId, total: airportId === 'ap-bom' ? 80 : 100, entries: 1 }))),
  },
];

function windowOf(w: WindowInput | undefined, fallback: WindowInput) {
  return cycleWindow(w?.start ?? fallback.start, w?.end ?? fallback.end);
}

/** A small stateful API for the new draft: POST creates cy9 (windows derived like the server's), PATCH merges into it. */
function draftServer() {
  const state: { cycle: CycleDetail | null; creates: CreateCycleInput[]; patches: PatchCycleInput[] } = { cycle: null, creates: [], patches: [] };
  const create: MockRoute = {
    method: 'POST',
    path: '/cycles',
    reply: ({ body }) => {
      const input = body as CreateCycleInput;
      state.creates.push(input);
      const derived = deriveWindows(input.initiationDate ?? '2026-10-01', SETTINGS.defaults);
      state.cycle = cycleDetail(
        {
          id: 'cy9',
          name: input.name,
          code: input.code,
          type: input.type,
          answerMode: input.answerMode ?? 'SINGLE',
          tz: input.tz ?? 'Asia/Kolkata',
          sampling: windowOf(input.sampling, derived.sampling),
          assessment: windowOf(input.assessment, derived.assessment),
          minSampleSize: input.minSampleSize,
          participatingAirportIds: input.participatingAirportIds,
          participatingAcoIds: input.participatingAcoIds,
        },
        'DRAFT',
      );
      return { status: 201, body: one(state.cycle) };
    },
  };
  const patch: MockRoute = {
    method: 'PATCH',
    path: '/cycles/cy9',
    reply: ({ body }) => {
      const p = body as PatchCycleInput;
      state.patches.push(p);
      const c = state.cycle as CycleDetail;
      const { sampling, assessment, initiationDate: _ignored, surveyVersions: _versions, ...rest } = p;
      state.cycle = {
        ...c,
        ...rest,
        sampling: sampling ? windowOf(sampling as WindowInput, { start: c.sampling.start.wall, end: c.sampling.end.wall }) : c.sampling,
        assessment: assessment ? windowOf(assessment as WindowInput, { start: c.assessment.start.wall, end: c.assessment.end.wall }) : c.assessment,
      } as CycleDetail;
      return one(state.cycle);
    },
  };
  return { state, create, routes: [create, patch] };
}

afterEach(() => vi.unstubAllGlobals());

const SLOW = { timeout: 3000 };
/** These walk several steps and wait out the autosave pause. */
const LONG = 20_000;

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/Cycle name/), 'CSQ 2026 H2');
  await user.type(screen.getByLabelText(/^Code/), 'csq-26h2');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByLabelText('Initiation date');
}

async function deriveFrom(user: ReturnType<typeof userEvent.setup>, date: string) {
  fireEvent.change(screen.getByLabelText('Initiation date'), { target: { value: date } });
  await user.click(await screen.findByRole('button', { name: 'Derive windows' }));
}

function dateInputs() {
  return screen.getAllByLabelText('Date') as HTMLInputElement[];
}

describe('CycleBuilderPage · autosave', () => {
  it('creates the draft when the user moves on from a valid Basics, then saves every change after a pause', async () => {
    const server = draftServer();
    mockApi([...reference, ...server.routes]);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/new' });

    // Nothing is created while Basics is incomplete; the header says so.
    await user.type(await screen.findByLabelText(/Cycle name/), 'CSQ 2026 H2');
    expect(screen.getByText('Not saved yet — a draft is created once Basics is complete')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Code/), 'csq-26h2');
    expect(server.state.creates).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByLabelText('Initiation date');
    expect(await screen.findByText(/Draft saved ·/)).toBeInTheDocument();
    expect(server.state.creates).toHaveLength(1);
    const created = server.state.creates[0];
    expect(created).toMatchObject({ name: 'CSQ 2026 H2', code: 'CSQ-26H2', type: 'BOTH', answerMode: 'IMPORT_EXPORT', tz: 'Asia/Kolkata', minSampleSize: 50, participatingAirportIds: [], participatingAcoIds: [] });
    // No windows chosen yet: the server derives them from today and the step shows them.
    expect(created).not.toHaveProperty('sampling');
    expect(created?.initiationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await waitFor(() => expect(dateInputs()[0]?.value).not.toBe(''));

    // Deriving other windows is saved after a pause (PATCH, only what changed).
    await deriveFrom(user, '2026-10-01');
    expect(dateInputs().map((i) => i.value)).toEqual(['1 Oct 2026', '11 Oct 2026', '11 Oct 2026', '10 Nov 2026']);
    expect(screen.getByText('Sampling · 10 d')).toBeInTheDocument();
    expect(screen.getByText('Assessment · 30 d')).toBeInTheDocument();
    await waitFor(() => expect(server.state.patches).toHaveLength(1), SLOW);
    expect(server.state.patches[0]).toEqual({ sampling: { start: '2026-10-01T00:00', end: '2026-10-11T00:00' }, assessment: { start: '2026-10-11T00:00', end: '2026-11-10T00:00' } });

    // A step change saves at once.
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const size = await screen.findByLabelText(/Minimum sample size/);
    await user.clear(size);
    await user.type(size, '40');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(server.state.patches.at(-1)).toEqual({ minSampleSize: 40 }));
    expect(server.state.creates).toHaveLength(1);
  }, LONG);

  it('refuses to move on while the windows are out of order, and does not save them', async () => {
    const server = draftServer();
    mockApi([...reference, ...server.routes]);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/new' });
    await fillBasics(user);
    await deriveFrom(user, '2026-10-01');
    await waitFor(() => expect(server.state.patches).toHaveLength(1), SLOW);

    // Assessment opens before sampling closes.
    const [, , assessmentStart] = dateInputs();
    fireEvent.change(assessmentStart as HTMLInputElement, { target: { value: '2026-10-05' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Assessment cannot start before sampling has ended')).toBeInTheDocument();
    expect(screen.getByLabelText('Initiation date')).toBeInTheDocument(); // still on the windows step
    expect(screen.getByText('Some changes are not saved — fix the highlighted fields')).toBeInTheDocument();
    expect(server.state.patches).toHaveLength(1);
  }, LONG);

  it('shows a refused create on its field: VALIDATION on the field, 409 on the code, then Retry', async () => {
    const server = draftServer();
    let attempts = 0;
    mockApi([
      ...reference,
      {
        method: 'POST',
        path: '/cycles',
        reply: (ctx) => {
          attempts += 1;
          if (attempts === 1) return apiError(400, 'VALIDATION', 'Invalid', { issues: [{ path: 'body.name', message: 'Name is reserved' }] });
          if (attempts === 2) return apiError(409, 'CONFLICT', 'Cycle code CSQ-26H2 already exists');
          return server.create.reply(ctx);
        },
      },
      ...server.routes.slice(1),
    ]);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/new' });
    await user.type(await screen.findByLabelText(/Cycle name/), 'CSQ 2026 H2');
    await user.type(screen.getByLabelText(/^Code/), 'csq-26h2');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    // Back on Basics with the server's message on the field.
    expect(await screen.findByText('Name is reserved')).toBeInTheDocument();
    expect(screen.getByLabelText(/Cycle name/)).toHaveValue('CSQ 2026 H2');
    expect(screen.getByText(/Couldn’t save/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Cycle code CSQ-26H2 already exists')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Code/)).toHaveAttribute('aria-invalid', 'true');

    const code = screen.getByLabelText(/^Code/);
    await user.clear(code);
    await user.type(code, 'csq-26h2b');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/Draft saved ·/)).toBeInTheDocument();
    expect(server.state.creates.map((c) => c.code)).toEqual(['CSQ-26H2B']);
  }, LONG);

  it('asks for the answer mode, Import & Export by default; Save as draft saves and stays', async () => {
    const server = draftServer();
    mockApi([...reference, ...server.routes]);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/new' });
    const modes = await screen.findByRole('radiogroup', { name: 'Answer mode' });
    expect(within(modes).getByRole('radio', { name: /Import & Export/ })).toBeChecked();
    expect(within(modes).getByRole('radio', { name: /Single rating/ })).toBeEnabled();
    await user.click(within(modes).getByRole('radio', { name: /Single rating/ }));
    await fillBasics(user);
    await deriveFrom(user, '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    expect(await screen.findByText('Draft CSQ-26H2 saved')).toBeInTheDocument();
    expect(screen.getByLabelText('Initiation date')).toBeInTheDocument(); // still in the builder
    expect(server.state.creates[0]).toMatchObject({ code: 'CSQ-26H2', answerMode: 'SINGLE' });
    expect(server.state.patches).toEqual([{ sampling: { start: '2026-10-01T00:00', end: '2026-10-11T00:00' }, assessment: { start: '2026-10-11T00:00', end: '2026-11-10T00:00' } }]);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  }, LONG);

  it('autosaves an existing draft and refuses a published cycle', async () => {
    const patches: unknown[] = [];
    mockApi([
      ...reference,
      { path: '/cycles/cy1', reply: () => one(cycleDetail({ name: 'Draft one', answerMode: 'SINGLE' }, 'DRAFT')) },
      { path: '/cycles/cy2', reply: () => one(cycleDetail({ id: 'cy2' }, 'SAMPLING_OPEN')) },
      {
        method: 'PATCH',
        path: '/cycles/cy1',
        reply: ({ body }) => {
          patches.push(body);
          return one(cycleDetail({ name: (body as { name?: string }).name ?? 'Draft one', answerMode: 'SINGLE' }, 'DRAFT'));
        },
      },
    ]);
    const user = userEvent.setup();
    const first = renderInDataRouter(routes, { path: '/cycles/cy1/edit' });
    const name = await screen.findByLabelText(/Cycle name/);
    expect(name).toHaveValue('Draft one');
    expect(screen.getByLabelText(/^Code/)).toHaveValue('CSQ-26H2');
    // A draft's mode can still change.
    expect(screen.getByRole('radio', { name: /Single rating/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Import & Export/ })).toBeEnabled();

    await user.clear(name);
    await user.type(name, 'Draft two');
    await waitFor(() => expect(patches).toEqual([{ name: 'Draft two' }]), SLOW);
    expect(await screen.findByText(/Draft saved ·/)).toBeInTheDocument();
    // Moving on with nothing new sends nothing more.
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(dateInputs()[0]).toHaveValue('1 Oct 2026'));
    expect(patches).toHaveLength(1);
    first.unmount();

    renderInDataRouter(routes, { path: '/cycles/cy2/edit' });
    expect(await screen.findByText('This cycle is already published')).toBeInTheDocument();
  }, LONG);
});

describe('CycleBuilderPage · leaving', () => {
  it('asks before leaving an unsaved cycle (in the app and on unload), and lets a saved one go', async () => {
    const server = draftServer();
    mockApi([...reference, ...server.routes]);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/new' });
    await user.type(await screen.findByLabelText(/Cycle name/), 'CSQ');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const prompt = await screen.findByRole('dialog', { name: 'Leave without saving?' });
    expect(prompt).toHaveTextContent('This cycle has not been saved yet');
    await user.click(within(prompt).getByRole('button', { name: 'Stay' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByLabelText(/Cycle name/)).toHaveValue('CSQ');

    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    await user.type(screen.getByLabelText(/^Code/), 'csq-1');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText(/Draft saved ·/)).toBeInTheDocument();
    const saved = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(saved);
    expect(saved.defaultPrevented).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByText('cycles list')).toBeInTheDocument();
  }, LONG);

  it('discards on request', async () => {
    mockApi(reference);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/new' });
    await user.type(await screen.findByLabelText(/Cycle name/), 'Not this one');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const prompt = await screen.findByRole('dialog', { name: 'Leave without saving?' });
    await user.click(within(prompt).getByRole('button', { name: 'Leave without saving' }));
    expect(await screen.findByText('cycles list')).toBeInTheDocument();
  }, LONG);

  it('a failed save says so with Retry; leaving pushes pending changes out and goes once they land', async () => {
    let calls = 0;
    const patches: unknown[] = [];
    mockApi([
      ...reference,
      { path: '/cycles/cy1', reply: () => one(cycleDetail({ name: 'Draft one' }, 'DRAFT')) },
      {
        method: 'PATCH',
        path: '/cycles/cy1',
        reply: ({ body }) => {
          calls += 1;
          if (calls === 1) return apiError(500, 'INTERNAL', 'Database unavailable');
          patches.push(body);
          return one(cycleDetail({ name: (body as { name?: string }).name ?? 'Draft one' }, 'DRAFT'));
        },
      },
    ]);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/cy1/edit' });
    const name = await screen.findByLabelText(/Cycle name/);
    await user.type(name, ' A');
    expect(await screen.findByText(/Couldn’t save/, undefined, SLOW)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/Draft saved ·/)).toBeInTheDocument();
    expect(patches).toEqual([{ name: 'Draft one A' }]);

    // Leave right after typing: the edit is saved first, then the page goes.
    await user.type(name, 'B');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByText('detail cy1')).toBeInTheDocument();
    expect(patches).toEqual([{ name: 'Draft one A' }, { name: 'Draft one AB' }]);
  }, LONG);
});

describe('CycleBuilderPage · participants and publishing', () => {
  it('offers only airports with operators, flags shares off 100, and a refused publish keeps the saved draft', async () => {
    const server = draftServer();
    const { calls } = mockApi([
      ...reference,
      ...server.routes,
      {
        method: 'POST',
        path: '/cycles/cy9/publish',
        reply: () => apiError(412, 'PRECONDITION_FAILED', 'Market shares at BOM (Mumbai) total 80, not 100', { airportId: 'ap-bom', iata: 'BOM', name: 'Mumbai', total: 80 }),
      },
    ]);
    const user = userEvent.setup();
    renderInDataRouter(routes, { path: '/cycles/new' });
    await fillBasics(user);
    await deriveFrom(user, '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByLabelText(/Minimum sample size/)).toHaveValue(50);
    expect(screen.getByLabelText('Sampling reminder dates')).toHaveTextContent('4 Oct, 09:00');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Port Blair has no operator: hidden behind the switch, and disabled with the reason when shown.
    await screen.findByLabelText(/DEL · Delhi/);
    expect(screen.queryByLabelText(/IXZ · Port Blair/)).toBeNull();
    await user.click(screen.getByRole('switch', { name: /Show 1 airport without operators/ }));
    expect(screen.getByLabelText(/IXZ · Port Blair/)).toBeDisabled();
    expect(screen.getByText('No active operators — cannot take part')).toBeInTheDocument();

    // The totals come in one request; BOM (80 %) is flagged with a link to its shares, DEL is not.
    expect(calls.filter((c) => c.path === '/market-share/totals').map((c) => c.query['airportIds'])).toEqual(['ap-bom,ap-del']);
    const flags = screen.getAllByRole('link', { name: 'Fix market shares at BOM' });
    expect(flags[0]).toHaveAttribute('href', '/market-share?airportId=ap-bom');
    expect(screen.queryByRole('link', { name: 'Fix market shares at DEL' })).toBeNull();

    await user.click(screen.getByLabelText(/DEL · Delhi/));
    await user.click(screen.getByLabelText(/BOM · Mumbai/));
    const del = screen.getByRole('region', { name: 'DEL operators' });
    expect(within(del).getByLabelText(/Cargo Service Center/)).toBeChecked();
    expect(within(del).getByText('Shares 100 %')).toBeInTheDocument();
    const bom = screen.getByRole('region', { name: 'BOM operators' });
    expect(within(bom).getByText(/Shares total 80 % —/)).toBeInTheDocument();
    await user.click(within(del).getByLabelText(/Çelebi Delhi Cargo/)); // drop one operator
    expect(screen.getByText('2 selected · 2 operators')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Review warns before publishing; Publish… → confirm → 412 with the draft saved and the fix one click away.
    expect(await screen.findByRole('region', { name: 'Basics' })).toHaveTextContent('CSQ-26H2');
    expect(screen.getByText(/Market shares at BOM · Mumbai total 80 %, not 100/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publish…' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Publish CSQ-26H2?');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));

    expect(await within(dialog).findByText('Not published yet')).toBeInTheDocument();
    expect(within(dialog).getByText('Your cycle is saved as a draft — nothing is lost. Fix the items below, then try again.')).toBeInTheDocument();
    expect(within(dialog).getByText('Market shares at BOM (Mumbai) total 80, not 100')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Fix market shares/ })).toHaveAttribute('href', '/market-share?airportId=ap-bom');

    // The server holds the whole draft, created once.
    expect(server.state.creates).toHaveLength(1);
    expect(server.state.cycle).toMatchObject({
      code: 'CSQ-26H2',
      type: 'BOTH',
      answerMode: 'IMPORT_EXPORT',
      sampling: { start: { wall: '2026-10-01T00:00' }, end: { wall: '2026-10-11T00:00' } },
      assessment: { start: { wall: '2026-10-11T00:00' }, end: { wall: '2026-11-10T00:00' } },
      participatingAirportIds: ['ap-del', 'ap-bom'],
      participatingAcoIds: ['org-csc', 'org-mial'],
    });
    expect(calls.some((c) => c.method === 'POST' && c.path === '/cycles/cy9/publish')).toBe(true);

    // Nothing is unsaved, so following the fix leaves without a prompt.
    await user.click(within(dialog).getByRole('link', { name: /Fix market shares/ }));
    expect(await screen.findByText('market share page')).toBeInTheDocument();
  }, LONG);
});
