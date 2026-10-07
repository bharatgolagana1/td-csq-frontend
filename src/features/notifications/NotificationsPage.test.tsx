import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type Notification } from '@/api/notifications.types';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: async () => 'tok_test',
  forceRefreshToken: async () => false,
}));

import NotificationsPage from './NotificationsPage';
import { calledUrls, mockFetch, type MockRoute, PLATFORM_SESSION, renderWithProviders } from './testUtils';

const REFS = { cycleId: 'c1', acoId: 'org-csc', customerId: 'cust-7', invitationId: null, userId: null };

const ROWS: Notification[] = [
  {
    id: 'n1',
    channel: 'LOG',
    template: 'assessment-invitation',
    to: 'ravi@shipper.example',
    subject: 'Your CSQ assessment for Cargo Service Center',
    body: 'Dear Ravi,\n\nPlease rate the service you received.\n\nOpen your assessment: https://csq.example/assess/abc',
    vars: { customerName: 'Ravi' },
    refs: REFS,
    status: 'SENT',
    error: null,
    sentAt: '2026-10-07T09:00:00.000Z',
    resendOf: null,
    createdAt: '2026-10-07T09:00:00.000Z',
  },
  {
    id: 'n2',
    channel: 'EMAIL',
    template: 'sampling-reminder',
    to: 'ops@csc.example',
    subject: 'Sampling closes in 3 days',
    body: 'Minimum required participants: 50. Currently selected: 37.',
    vars: {},
    refs: { ...REFS, customerId: null },
    status: 'FAILED',
    error: 'SMTP 550 mailbox unavailable',
    sentAt: null,
    resendOf: null,
    createdAt: '2026-10-06T04:30:00.000Z',
  },
];

const CYCLES = [{ id: 'c1', code: 'CSQ-26H2', name: 'CSQ 2026 H2', status: 'SAMPLING_OPEN', tz: 'Asia/Kolkata' }];
const OPERATORS = [{ id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 1, customerCount: 2 }];

function routes(list: MockRoute['reply']): MockRoute[] {
  return [
    { path: '/notifications', reply: list },
    { path: '/cycles', reply: () => ({ body: { data: CYCLES, meta: { page: 1, pageSize: 200, total: 1 } } }) },
    { path: '/operators', reply: () => ({ body: { data: OPERATORS, meta: { page: 1, pageSize: 200, total: 1 } } }) },
  ];
}

const listOk: MockRoute['reply'] = () => ({ body: { data: ROWS, meta: { page: 1, pageSize: 25, total: 2 } } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NotificationsPage', () => {
  it('shows skeleton rows while loading', () => {
    mockFetch(routes(() => 'pending'));
    renderWithProviders(<NotificationsPage />);
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows the empty state with a refresh action', async () => {
    mockFetch(routes(() => ({ body: { data: [], meta: { page: 1, pageSize: 25, total: 0 } } })));
    renderWithProviders(<NotificationsPage />);
    expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.queryByText('Logged, not e-mailed')).toBeNull();
  });

  it('shows the inline error with the request id and retries', async () => {
    const spy = mockFetch(routes(() => ({ status: 500, body: { error: { code: 'INTERNAL', message: 'Mongo is down', requestId: 'req_42' } } })));
    renderWithProviders(<NotificationsPage />);
    expect(await screen.findByText('Could not load notifications')).toBeInTheDocument();
    expect(screen.getByText('req_42')).toBeInTheDocument();
    const before = calledUrls(spy).filter((u) => u.includes('/notifications')).length;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(calledUrls(spy).filter((u) => u.includes('/notifications')).length).toBeGreaterThan(before));
  });

  it('renders rows with status pills, ref chips and the LOG banner', async () => {
    mockFetch(routes(listOk));
    renderWithProviders(<NotificationsPage />);
    expect(await screen.findByText('Your CSQ assessment for Cargo Service Center')).toBeInTheDocument();
    expect(screen.getByText('ravi@shipper.example')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Notifications' });
    // The status pill renders in the Status column and (for phone width) inside the Message cell.
    expect(within(table).getAllByText('Sent')).toHaveLength(2);
    expect(within(table).getAllByText('Failed')).toHaveLength(2);
    expect(screen.getByText('2 notifications')).toBeInTheDocument();
    expect(screen.getByText('Logged, not e-mailed')).toBeInTheDocument();
    // Ref chips resolve the cycle and operator names once their lists load.
    expect(await screen.findAllByText('CSQ 2026 H2')).not.toHaveLength(0);
  });

  it('opens the drawer with the rendered body and resends after confirmation', async () => {
    const spy = mockFetch([
      ...routes(listOk),
      { method: 'POST', path: /\/notifications\/n1\/resend$/, reply: () => ({ status: 201, body: { data: { ...ROWS[0], id: 'n3', resendOf: 'n1' } } }) },
    ]);
    renderWithProviders(<NotificationsPage />);
    await userEvent.click(await screen.findByText('Your CSQ assessment for Cargo Service Center'));
    const drawer = screen.getByRole('dialog', { name: 'Notification' });
    expect(within(drawer).getByText(/Please rate the service you received/)).toBeInTheDocument();
    expect(within(drawer).getByText('Subject')).toBeInTheDocument();

    await userEvent.click(within(drawer).getByRole('button', { name: 'Resend' }));
    const confirm = screen.getByRole('dialog', { name: 'Resend this e-mail?' });
    expect(within(confirm).getByText(/ravi@shipper.example/)).toBeInTheDocument();
    await userEvent.click(within(confirm).getByRole('button', { name: 'Resend' }));

    await waitFor(() => expect(calledUrls(spy).some((u) => u.endsWith('/notifications/n1/resend'))).toBe(true));
    expect(await screen.findByText('Resent to ravi@shipper.example')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Resend this e-mail?' })).toBeNull();
  });

  it('shows the delivery error for a failed notification', async () => {
    mockFetch(routes(listOk));
    renderWithProviders(<NotificationsPage />);
    await userEvent.click(await screen.findByText('Sampling closes in 3 days'));
    const drawer = screen.getByRole('dialog', { name: 'Notification' });
    expect(within(drawer).getByText('Delivery error')).toBeInTheDocument();
    expect(within(drawer).getByText('SMTP 550 mailbox unavailable')).toBeInTheDocument();
  });

  it('sends the status and template filters to the API', async () => {
    const spy = mockFetch(routes(listOk));
    renderWithProviders(<NotificationsPage />);
    await screen.findByText('Sampling closes in 3 days');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'FAILED');
    await waitFor(() => expect(calledUrls(spy).some((u) => u.includes('/notifications?') && u.includes('status=FAILED'))).toBe(true));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Template' }), 'sampling-reminder');
    await waitFor(() => expect(calledUrls(spy).some((u) => u.includes('template=sampling-reminder') && u.includes('status=FAILED') && u.includes('page=1'))).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect((screen.getByRole('combobox', { name: 'Status' }) as HTMLSelectElement).value).toBe('');
  });

  it('hides resend when the role lacks notifications.send', async () => {
    mockFetch(routes(listOk));
    renderWithProviders(<NotificationsPage />, { ...PLATFORM_SESSION, tasks: new Set(['notifications.view']) });
    await userEvent.click(await screen.findByText('Sampling closes in 3 days'));
    const drawer = screen.getByRole('dialog', { name: 'Notification' });
    expect(within(drawer).queryByRole('button', { name: 'Resend' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Operator' })).toBeNull();
  });
});
