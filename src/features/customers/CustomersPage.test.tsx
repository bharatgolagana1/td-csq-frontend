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

import CustomersPage from './CustomersPage';
import { apiError, CUSTOMERS, customer, list, mockApi, OPERATOR_SESSION, PARTICIPATION, PLATFORM_SESSION, renderPage, VIEWER_SESSION } from './test-utils';

afterEach(() => vi.unstubAllGlobals());

const listRoute = (rows = CUSTOMERS) => ({ method: 'GET' as const, path: /^\/customers$/, reply: () => list(rows) });

describe('CustomersPage', () => {
  it('shows skeletons while loading, then the directory with pills, last sampled and tags', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    mockApi([{ method: 'GET', path: /^\/customers$/, reply: async () => (await gate, list(CUSTOMERS)) }]);
    renderPage(<CustomersPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    release();

    expect(await screen.findByRole('button', { name: 'Bluewave Logistics Pvt Ltd' })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Customers' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    const first = rows[0];
    if (!first) throw new Error('no row');
    expect(within(first).getByText('FF')).toBeInTheDocument();
    expect(within(first).getByText('Domestic')).toBeInTheDocument();
    expect(within(first).getByText('Active')).toBeInTheDocument();
    expect(within(first).getByText('CSQ-25H2')).toBeInTheDocument();
    expect(within(first).getByRole('button', { name: 'Filter by tag priority' })).toBeInTheDocument();
    expect(within(table).getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('3 customers')).toBeInTheDocument();
  });

  it('renders the empty state with the one primary action for managers', async () => {
    mockApi([listRoute([])]);
    renderPage(<CustomersPage />);
    expect(await screen.findByText('No customers yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add the first customer' })).toBeInTheDocument();
  });

  it('shows the error with the request id and retries', async () => {
    let attempt = 0;
    mockApi([
      {
        method: 'GET',
        path: /^\/customers$/,
        reply: () => {
          attempt += 1;
          return attempt === 1 ? apiError(500, 'INTERNAL', 'Database unavailable') : list(CUSTOMERS);
        },
      },
    ]);
    renderPage(<CustomersPage />);
    expect(await screen.findByText('Could not load customers')).toBeInTheDocument();
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Bluewave Logistics Pvt Ltd' })).toBeInTheDocument();
  });

  it('sends filters, search and sort as query parameters', async () => {
    const api = mockApi([listRoute()]);
    renderPage(<CustomersPage />);
    await screen.findByRole('button', { name: 'Bluewave Logistics Pvt Ltd' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'CB');
    await waitFor(() => expect(api.calls.at(-1)?.url.searchParams.get('type')).toBe('CB'));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Survey type' }), 'INTERNATIONAL');
    await waitFor(() => expect(api.calls.at(-1)?.url.searchParams.get('surveyType')).toBe('INTERNATIONAL'));
    await userEvent.click(screen.getByRole('button', { name: 'Filter by tag priority' }));
    await waitFor(() => expect(api.calls.at(-1)?.url.searchParams.get('tag')).toBe('priority'));
    expect(api.calls.at(-1)?.url.searchParams.get('sort')).toBe('name');
    expect(api.calls.at(-1)?.url.searchParams.get('acoId')).toBeNull();
  });

  it('bulk-deactivates the selected customers', async () => {
    const api = mockApi([
      listRoute(),
      { method: 'POST', path: /^\/customers\/([^/]+)\/deactivate$/, reply: ({ match }) => ({ body: { data: customer({ id: match[1] ?? '', status: 'INACTIVE' }) } }) },
    ]);
    renderPage(<CustomersPage />);
    await screen.findByRole('button', { name: 'Bluewave Logistics Pvt Ltd' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 2' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(api.calls.filter((c) => c.method === 'POST' && c.path.endsWith('/deactivate'))).toHaveLength(2));
    expect(await screen.findByText('2 customers deactivated')).toBeInTheDocument();
  });

  it('opens the detail drawer with the participation history', async () => {
    mockApi([listRoute(), { method: 'GET', path: /^\/customers\/c1\/participation$/, reply: () => ({ body: { data: PARTICIPATION } }) }]);
    renderPage(<CustomersPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Bluewave Logistics Pvt Ltd' }));
    const drawer = await screen.findByRole('dialog', { name: 'Bluewave Logistics Pvt Ltd' });
    expect(within(drawer).getByText('Participation history')).toBeInTheDocument();
    expect(await within(drawer).findByText('CSQ 2025 H2 · CSQ-25H2')).toBeInTheDocument();
    expect(within(drawer).getByText('Submitted')).toBeInTheDocument();
    expect(within(drawer).getByText('Not submitted')).toBeInTheDocument();
    expect(within(drawer).getByText('+91 98765 43210')).toBeInTheDocument();
  });

  it('hides the manage actions for viewers', async () => {
    mockApi([listRoute()]);
    renderPage(<CustomersPage />, { session: VIEWER_SESSION });
    await screen.findByRole('button', { name: 'Bluewave Logistics Pvt Ltd' });
    expect(screen.queryByRole('button', { name: 'Add customer' })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Select all rows' })).toBeNull();
  });

  it('asks PLATFORM users to pick an operator and then scopes the list with acoId', async () => {
    const api = mockApi([
      { method: 'GET', path: /^\/operators$/, reply: () => list([{ id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 6, customerCount: 212 }]) },
      listRoute(),
    ]);
    renderPage(<CustomersPage />, { session: PLATFORM_SESSION });
    expect(await screen.findByText('Choose an operator')).toBeInTheDocument();
    const picker = screen.getByRole('combobox', { name: 'Operator' });
    await waitFor(() => expect(picker).toBeEnabled());
    await userEvent.selectOptions(picker, 'org-csc');
    await screen.findByRole('button', { name: 'Bluewave Logistics Pvt Ltd' });
    expect(api.calls.find((c) => c.path === '/customers')?.url.searchParams.get('acoId')).toBe('org-csc');
  });

  it('uses the operator session for the page context', async () => {
    mockApi([listRoute()]);
    renderPage(<CustomersPage />, { session: OPERATOR_SESSION });
    expect(await screen.findByText(/Cargo Service Center’s directory/)).toBeInTheDocument();
  });
});
