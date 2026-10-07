import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OperatorDetailPage from './OperatorDetailPage';
import { errorAt } from './operatorForm';
import OperatorsPage from './OperatorsPage';
import { apiError, CLB, CSC, CYCLE, CYCLE_SHARE, data, DEL, list, mockApi, never, renderPage } from './testUtils';

afterEach(() => vi.unstubAllGlobals());

describe('OperatorsPage', () => {
  it('shows skeleton rows while loading', () => {
    mockApi([{ method: 'GET', path: /^\/operators$/, reply: never }, { method: 'GET', path: /^\/airports$/, reply: never }]);
    renderPage(<OperatorsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Operators' })).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows the empty state with the create action', async () => {
    mockApi([{ method: 'GET', path: /^\/operators$/, reply: () => list([]) }, { method: 'GET', path: /^\/airports$/, reply: () => list([DEL]) }]);
    renderPage(<OperatorsPage />);
    expect(await screen.findByText('No operators match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add the first operator' })).toBeInTheDocument();
  });

  it('renders code, airport, operations, status, counts and share; filters by status', async () => {
    const { calls } = mockApi([
      { method: 'GET', path: /^\/operators$/, reply: ({ url }) => list(url.searchParams.get('status') === 'INACTIVE' ? [] : [CSC, CLB]) },
      { method: 'GET', path: /^\/airports$/, reply: () => list([DEL]) },
    ]);
    renderPage(<OperatorsPage />);
    const row = (await screen.findByRole('link', { name: 'Cargo Service Center' })).closest('tr') as HTMLElement;
    expect(within(row).getByText('CSC-DEL')).toBeInTheDocument();
    expect(within(row).getByText('DEL')).toBeInTheDocument();
    expect(within(row).getByText('International')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
    expect(within(row).getByText('212')).toBeInTheDocument();
    expect(within(row).getByText('55 %')).toBeInTheDocument();
    expect(screen.getByText('2 operators')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INACTIVE');
    expect(await screen.findByText('No operators match')).toBeInTheDocument();
    expect(calls.some((c) => c.path === '/operators' && c.url.searchParams.get('status') === 'INACTIVE')).toBe(true);
  });

  it('shows the error state with the request id', async () => {
    mockApi([{ method: 'GET', path: /^\/operators$/, reply: () => apiError(500, 'INTERNAL', 'Database unavailable') }, { method: 'GET', path: /^\/airports$/, reply: () => list([DEL]) }]);
    renderPage(<OperatorsPage />);
    expect(await screen.findByText('Could not load operators')).toBeInTheDocument();
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
  });

  it('validates the create drawer before posting', async () => {
    const { calls } = mockApi([{ method: 'GET', path: /^\/operators$/, reply: () => list([]) }, { method: 'GET', path: /^\/airports$/, reply: () => list([DEL]) }]);
    renderPage(<OperatorsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add operator' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add operator' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create operator' }));
    const alerts = (await within(dialog).findAllByRole('alert')).map((a) => a.textContent);
    expect(alerts).toEqual(expect.arrayContaining(['Choose an airport', 'Enter the operator name', 'Enter the address', 'Enter the 6-digit PIN code']));
    expect(alerts.filter((t) => t === 'Enter a valid e-mail address')).toHaveLength(2);
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });
});

describe('OperatorDetailPage', () => {
  it('renders the overview and the market share history tab', async () => {
    mockApi([
      { method: 'GET', path: /^\/operators\/org-csc$/, reply: () => data(CSC) },
      { method: 'GET', path: /^\/cycles$/, reply: () => list([CYCLE]) },
      { method: 'GET', path: /^\/airports\/ap-del\/market-share$/, reply: () => data(CYCLE_SHARE) },
    ]);
    renderPage(<OperatorDetailPage />, { route: '/operators/org-csc', path: '/operators/:id' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Cargo Service Center' })).toBeInTheDocument();
    expect(screen.getByText('Cargo Service Center India Pvt Ltd')).toBeInTheDocument();
    expect(screen.getByText('priya@csc.example')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Market share history/ }));
    expect(await screen.findByText('Current default')).toBeInTheDocument();
    const cycleRow = (await screen.findByText('CSQ 2026 H1')).closest('tr') as HTMLElement;
    expect(await within(cycleRow).findByText('60 %')).toBeInTheDocument();
    expect(within(cycleRow).getByText('Frozen')).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown id', async () => {
    mockApi([{ method: 'GET', path: /^\/operators\/nope$/, reply: () => apiError(404, 'NOT_FOUND', 'Operator not found') }]);
    renderPage(<OperatorDetailPage />, { route: '/operators/nope', path: '/operators/:id' });
    expect(await screen.findByText('Operator not found')).toBeInTheDocument();
  });
});

describe('errorAt', () => {
  it('reads nested react-hook-form error messages', () => {
    const errors = { address: { line1: { type: 'min', message: 'Enter the address' } }, contact: undefined };
    expect(errorAt(errors, 'address.line1')).toBe('Enter the address');
    expect(errorAt(errors, 'address.city')).toBeUndefined();
    expect(errorAt(errors, 'contact.email')).toBeUndefined();
  });
});
