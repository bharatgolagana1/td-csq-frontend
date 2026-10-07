import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type Settings } from '@/api/types';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: async () => 'tok_test',
  forceRefreshToken: async () => false,
}));

import SettingsPage from './SettingsPage';
import { mockFetch, type MockRoute, patchBodies, PLATFORM_SESSION, renderWithProviders } from './testUtils';

const SETTINGS: Settings = {
  scoring: { minResponses: 3, weightingMode: 'EQUAL' },
  defaults: { samplingDays: 10, assessmentDays: 30, reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 10, everyDays: 2 } }, tz: 'Asia/Kolkata' },
  branding: { orgName: 'Air Cargo Forum India' },
  revealAssessorIdentity: false,
  rbacVersion: 4,
};

/** A stateful mock: PATCH merges into the document that later GETs return (the hook refetches after saving). */
function routes(patch?: MockRoute['reply']): MockRoute[] {
  let current = SETTINGS;
  return [
    { path: '/settings', reply: () => ({ body: { data: current } }) },
    {
      method: 'PATCH',
      path: '/settings',
      reply:
        patch ??
        ((_url, body) => {
          current = { ...current, ...(body as Partial<Settings>) };
          return { body: { data: current } };
        }),
    },
  ];
}

const scoringForm = () => screen.getByRole('form', { name: 'Scoring' });
const minResponses = () => within(scoringForm()).getByLabelText(/Minimum responses/);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SettingsPage', () => {
  it('shows skeleton cards while loading', () => {
    mockFetch([{ path: '/settings', reply: () => 'pending' }]);
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('renders every section from GET /settings', async () => {
    mockFetch(routes());
    renderWithProviders(<SettingsPage />);
    expect(await screen.findByRole('form', { name: 'Scoring' })).toBeInTheDocument();
    expect(minResponses()).toHaveValue(3);
    expect(within(scoringForm()).getByLabelText(/Weighting/)).toHaveValue('EQUAL');
    const defaults = screen.getByRole('form', { name: 'Cycle defaults' });
    expect(within(defaults).getByLabelText(/Sampling window/)).toHaveValue(10);
    expect(within(defaults).getByLabelText(/Assessment window/)).toHaveValue(30);
    expect(within(defaults).getByLabelText(/Time zone/)).toHaveValue('Asia/Kolkata');
    expect(within(screen.getByRole('form', { name: 'Branding' })).getByLabelText(/Organisation name/)).toHaveValue('Air Cargo Forum India');
    expect(screen.getByRole('switch', { name: /Reveal assessor identity to operators/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('RBAC version')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Save' }).every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('saves one section with only its slice in the PATCH body', async () => {
    const spy = mockFetch(routes());
    renderWithProviders(<SettingsPage />);
    await screen.findByRole('form', { name: 'Scoring' });
    await userEvent.clear(minResponses());
    await userEvent.type(minResponses(), '5');
    expect(within(scoringForm().closest('section') as HTMLElement).getByText('Unsaved changes')).toBeInTheDocument();
    await userEvent.click(within(scoringForm().closest('section') as HTMLElement).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(patchBodies(spy)).toEqual([{ scoring: { minResponses: 5, weightingMode: 'EQUAL' } }]));
    expect(await screen.findByText('Scoring saved')).toBeInTheDocument();
    await waitFor(() => expect(within(scoringForm().closest('section') as HTMLElement).getByText('Saved')).toBeInTheDocument());
    expect(minResponses()).toHaveValue(5);
  });

  it('saves the privacy switch as a top-level field', async () => {
    const spy = mockFetch(routes());
    renderWithProviders(<SettingsPage />);
    await screen.findByRole('form', { name: 'Privacy' });
    await userEvent.click(screen.getByRole('switch', { name: /Reveal assessor identity to operators/ }));
    expect(screen.getByText(/operator users see the customer name/)).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('form', { name: 'Privacy' }).closest('section') as HTMLElement).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(patchBodies(spy)).toEqual([{ revealAssessorIdentity: true }]));
    expect(await screen.findByText('Privacy saved')).toBeInTheDocument();
  });

  it('keeps the edits and shows the request id when the save fails (cache rolled back)', async () => {
    mockFetch(routes(() => ({ status: 500, body: { error: { code: 'INTERNAL', message: 'Mongo is down', requestId: 'req_500' } } })));
    const { qc } = renderWithProviders(<SettingsPage />);
    await screen.findByRole('form', { name: 'Scoring' });
    await userEvent.clear(minResponses());
    await userEvent.type(minResponses(), '7');
    await userEvent.click(within(scoringForm().closest('section') as HTMLElement).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/Could not save scoring: Mongo is down/)).toBeInTheDocument();
    expect(screen.getByText('req_500')).toBeInTheDocument();
    expect(minResponses()).toHaveValue(7);
    expect(within(scoringForm().closest('section') as HTMLElement).getByText('Unsaved changes')).toBeInTheDocument();
    await waitFor(() => expect(qc.getQueryData<Settings>(['settings'])?.scoring.minResponses).toBe(3));
  });

  it('maps server validation details onto the field', async () => {
    mockFetch(routes(() => ({ status: 400, body: { error: { code: 'VALIDATION', message: 'Validation failed', details: { issues: [{ path: ['body', 'scoring', 'minResponses'], message: 'Too many for this platform' }] }, requestId: 'req_400' } } })));
    renderWithProviders(<SettingsPage />);
    await screen.findByRole('form', { name: 'Scoring' });
    await userEvent.clear(minResponses());
    await userEvent.type(minResponses(), '900');
    await userEvent.click(within(scoringForm().closest('section') as HTMLElement).getByRole('button', { name: 'Save' }));
    expect(await within(scoringForm()).findByText('Too many for this platform')).toBeInTheDocument();
  });

  it('validates locally before sending', async () => {
    const spy = mockFetch(routes());
    renderWithProviders(<SettingsPage />);
    await screen.findByRole('form', { name: 'Scoring' });
    await userEvent.clear(minResponses());
    await userEvent.type(minResponses(), '0');
    await userEvent.click(within(scoringForm().closest('section') as HTMLElement).getByRole('button', { name: 'Save' }));
    expect(await within(scoringForm()).findByText('At least 1 response')).toBeInTheDocument();
    expect(patchBodies(spy)).toEqual([]);
  });

  it('discards a section back to the saved values', async () => {
    mockFetch(routes());
    renderWithProviders(<SettingsPage />);
    const branding = within((await screen.findByRole('form', { name: 'Branding' })).closest('section') as HTMLElement);
    await userEvent.type(branding.getByLabelText(/Organisation name/), ' Ltd');
    expect(branding.getByLabelText(/Organisation name/)).toHaveValue('Air Cargo Forum India Ltd');
    await userEvent.click(branding.getByRole('button', { name: 'Discard' }));
    expect(branding.getByLabelText(/Organisation name/)).toHaveValue('Air Cargo Forum India');
    expect(branding.getByText('Saved')).toBeInTheDocument();
  });

  it('guards navigation while a section is dirty', async () => {
    mockFetch(routes());
    const { router } = renderWithProviders(<SettingsPage />);
    await screen.findByRole('form', { name: 'Scoring' });
    await userEvent.clear(minResponses());
    await userEvent.type(minResponses(), '6');
    await userEvent.click(screen.getByRole('link', { name: 'Users' }));
    const prompt = await screen.findByRole('dialog', { name: 'Leave without saving?' });
    expect(within(prompt).getByText(/Scoring has unsaved changes/)).toBeInTheDocument();
    await userEvent.click(within(prompt).getByRole('button', { name: 'Stay' }));
    expect(router.state.location.pathname).toBe('/settings');
    expect(minResponses()).toHaveValue(6);

    await userEvent.click(screen.getByRole('link', { name: 'Users' }));
    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Leave without saving?' })).getByRole('button', { name: 'Discard and leave' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/users'));
    expect(screen.getByRole('heading', { name: 'Users page' })).toBeInTheDocument();
  });

  it('is read-only without settings.manage', async () => {
    mockFetch(routes());
    renderWithProviders(<SettingsPage />, { ...PLATFORM_SESSION, tasks: new Set(['settings.view']) });
    await screen.findByRole('form', { name: 'Scoring' });
    expect(screen.getByText(/You can view these settings/)).toBeInTheDocument();
    expect(minResponses()).toBeDisabled();
    expect(screen.getByRole('switch', { name: /Reveal assessor identity to operators/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Role → Task matrix/ })).toBeNull();
  });

  it('links to the Role → Task matrix when the role may view it', async () => {
    mockFetch(routes());
    const { router } = renderWithProviders(<SettingsPage />);
    await screen.findByRole('form', { name: 'Scoring' });
    await userEvent.click(screen.getByRole('button', { name: /Open the Role → Task matrix/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/users/roles'));
  });
});
