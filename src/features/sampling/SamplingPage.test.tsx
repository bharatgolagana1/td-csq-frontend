import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: true, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: async () => 'token',
  forceRefreshToken: async () => false,
}));

import SamplingPage from './SamplingPage';
import { apiError, data, IN_PROGRESS, LOCKABLE, LOCKED, mockApi, OPERATOR_SESSION, PLATFORM_SESSION, renderPage, samplingRoutes, SHORTFALL } from './test-utils';

afterEach(() => vi.unstubAllGlobals());

const footer = () => screen.getByRole('region', { name: 'Lock the sample' });

describe('SamplingPage', () => {
  it('shows the header counter, the deadline, the minimum banner and why locking is refused', async () => {
    mockApi(samplingRoutes(IN_PROGRESS));
    renderPage(<SamplingPage />);
    expect(await screen.findByRole('heading', { name: 'CSQ 2026 H2' })).toBeInTheDocument();
    expect(screen.getByLabelText('37 of 50 selected')).toHaveTextContent('37 / 50');
    expect(screen.getByText('Sampling closes in 3 days')).toBeInTheDocument();
    expect(screen.getByText('Minimum 50 customers are required. If fewer are available, select all.')).toBeInTheDocument();
    expect(screen.getByText('Sampling open')).toBeInTheDocument();

    const lock = within(footer()).getByRole('button', { name: 'Lock sample' });
    expect(lock).toBeDisabled();
    expect(within(footer()).getByText('Select 13 more to reach the minimum of 50.')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Invitations/ })).toBeNull();

    // eligible table: BOTH customer appears once per survey type, selected rows are checked
    const table = await screen.findByRole('table', { name: 'Eligible customers' });
    await waitFor(() => expect(within(table).getAllByText('Zenith Freight')).toHaveLength(2));
    expect(screen.getByText('5 entries')).toBeInTheDocument();
    expect(within(table).getByRole('checkbox', { name: 'Select row 1' })).toBeChecked();
  });

  it('sends a PUT with the toggled entry and reports rejected items', async () => {
    const api = mockApi(
      samplingRoutes(IN_PROGRESS, [
        {
          method: 'PUT',
          path: /^\/sampling\/cycles\/cy-26h2\/selection$/,
          reply: ({ body }) => {
            const input = body as { add: { customerId: string; surveyType: string }[]; remove: unknown[] };
            return data({ added: [], removed: [], rejected: input.add.map((i) => ({ ...i, op: 'add', reason: 'INACTIVE_CUSTOMER', message: 'Customer is inactive' })), state: IN_PROGRESS });
          },
        },
      ]),
    );
    renderPage(<SamplingPage />);
    const table = await screen.findByRole('table', { name: 'Eligible customers' });
    await waitFor(() => expect(within(table).getAllByRole('checkbox', { name: /Select row/ })).toHaveLength(5));
    const harbor = within(table).getByRole('checkbox', { name: 'Select row 2' });
    expect(harbor).not.toBeChecked();
    await userEvent.click(harbor);
    await waitFor(() => expect(api.calls.find((c) => c.method === 'PUT')).toBeDefined());
    expect(api.calls.find((c) => c.method === 'PUT')?.body).toEqual({ acoId: 'org-csc', add: [{ customerId: 'c2', surveyType: 'INTERNATIONAL' }], remove: [] });
    expect(await screen.findByText('1 change was not applied — Harbor Customs Services: Customer is inactive')).toBeInTheDocument();
  });

  it('locks through the confirm dialog and then shows the Invitations tab', async () => {
    let state = LOCKABLE;
    const api = mockApi([
      { method: 'GET', path: /^\/sampling\/cycles\/cy-26h2$/, reply: () => data(state) },
      ...samplingRoutes(LOCKABLE, [
        {
          method: 'POST',
          path: /^\/sampling\/cycles\/cy-26h2\/lock$/,
          reply: () => {
            state = LOCKED;
            return data(LOCKED);
          },
        },
      ]),
    ]);
    renderPage(<SamplingPage />);
    const lock = await within(await screen.findByRole('region', { name: 'Lock the sample' })).findByRole('button', { name: 'Lock sample' });
    expect(lock).toBeEnabled();
    expect(screen.getAllByText('Ready to lock').length).toBeGreaterThan(0);
    await userEvent.click(lock);
    const dialog = await screen.findByRole('dialog', { name: 'Lock the sample?' });
    expect(within(dialog).getByText(/50 customers will be invited/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lock sample' }));
    await waitFor(() => expect(api.calls.find((c) => c.path.endsWith('/lock'))?.method).toBe('POST'));
    expect(await screen.findByText('Sample locked. Invitations go out when the assessment opens.')).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /Invitations/ })).toBeInTheDocument();
  });

  it('offers "Select all eligible" only under the shortfall rule', async () => {
    const api = mockApi(samplingRoutes(SHORTFALL, [{ method: 'POST', path: /^\/sampling\/cycles\/cy-26h2\/select-all$/, reply: () => data({ added: [], removed: [], rejected: [], state: { ...SHORTFALL, selectedCount: 42, lockable: true, reason: null } }) }]));
    renderPage(<SamplingPage />);
    const button = await screen.findByRole('button', { name: 'Select all eligible (42)' });
    expect(screen.getByText('Only 42 customers are eligible, fewer than the 50 required — select all of them to lock.')).toBeInTheDocument();
    await userEvent.click(button);
    await waitFor(() => expect(api.calls.find((c) => c.path.endsWith('/select-all'))?.method).toBe('POST'));
    expect(await screen.findByText('All 42 eligible customers selected')).toBeInTheDocument();
  });

  it('renders the locked state read-only for operators with the request-unlock copy', async () => {
    mockApi(samplingRoutes(LOCKED));
    renderPage(<SamplingPage />, { session: OPERATOR_SESSION });
    expect(await screen.findByText(/^Sample locked on .* by u2$/)).toBeInTheDocument();
    expect(screen.getByText('The selection is read-only. To change the sample, ask ACFI to unlock it.')).toBeInTheDocument();
    expect(within(footer()).queryByRole('button', { name: 'Lock sample' })).toBeNull();
    expect(within(footer()).queryByRole('button', { name: 'Unlock' })).toBeNull();
    expect(screen.getByRole('tab', { name: /Invitations/ })).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Eligible customers' });
    await waitFor(() => expect(within(table).getAllByText('Zenith Freight')).toHaveLength(1));
    expect(within(table).queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByRole('combobox', { name: 'Show' })).toHaveValue('selected');
  });

  it('lets PLATFORM users unlock with a reason', async () => {
    const api = mockApi(samplingRoutes(LOCKED, [{ method: 'POST', path: /^\/sampling\/cycles\/cy-26h2\/unlock$/, reply: () => data(IN_PROGRESS) }]));
    renderPage(<SamplingPage />, { session: PLATFORM_SESSION, route: '/sampling?acoId=org-csc' });
    const unlock = await within(await screen.findByRole('region', { name: 'Lock the sample' })).findByRole('button', { name: 'Unlock' });
    await userEvent.click(unlock);
    const dialog = await screen.findByRole('dialog', { name: 'Unlock the sample?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Unlock sample' }));
    expect(await within(dialog).findByText('Give a reason of at least 3 characters.')).toBeInTheDocument();
    expect(api.calls.find((c) => c.path.endsWith('/unlock'))).toBeUndefined();
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Reason/ }), 'Two customers closed down');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Unlock sample' }));
    await waitFor(() => expect(api.calls.find((c) => c.path.endsWith('/unlock'))?.body).toEqual({ acoId: 'org-csc', reason: 'Two customers closed down' }));
    expect(await screen.findByText('Sample unlocked. Pending invitations were revoked.')).toBeInTheDocument();
  });

  it('shows the empty state when there is no current cycle and the error state with a request id', async () => {
    mockApi([{ method: 'GET', path: /^\/cycles\/current$/, reply: () => data([]) }]);
    renderPage(<SamplingPage />);
    expect(await screen.findByText('No cycle to sample for')).toBeInTheDocument();
    vi.unstubAllGlobals();

    mockApi([{ method: 'GET', path: /^\/cycles\/current$/, reply: () => apiError(500, 'INTERNAL', 'Database unavailable') }]);
    renderPage(<SamplingPage />);
    expect(await screen.findByText('Could not load the current cycle')).toBeInTheDocument();
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
  });

  it('asks PLATFORM users to choose an operator first', async () => {
    mockApi(samplingRoutes(IN_PROGRESS));
    renderPage(<SamplingPage />, { session: PLATFORM_SESSION });
    expect(await screen.findByText('Choose an operator')).toBeInTheDocument();
    const picker = screen.getByRole('combobox', { name: 'Operator' });
    await waitFor(() => expect(picker).toBeEnabled());
    await userEvent.selectOptions(picker, 'org-csc');
    expect(await screen.findByRole('heading', { name: 'CSQ 2026 H2' })).toBeInTheDocument();
  });
});
