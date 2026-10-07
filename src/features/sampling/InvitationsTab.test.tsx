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

import { InvitationsTab } from './InvitationsTab';
import { data, INVITATIONS, list, mockApi, renderPage } from './test-utils';

afterEach(() => vi.unstubAllGlobals());

describe('InvitationsTab', () => {
  it('lists invitations with state pills, masked e-mails, timestamps and reminder counts', async () => {
    const api = mockApi([{ method: 'GET', path: /^\/invitations$/, reply: () => list(INVITATIONS) }]);
    renderPage(<InvitationsTab cycleId="cy-26h2" acoId="" tz="Asia/Kolkata" canResend canRevoke />);
    const table = await screen.findByRole('table', { name: 'Invitations' });
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(4));
    expect(api.calls[0]?.url.searchParams.get('cycleId')).toBe('cy-26h2');
    expect(within(table).getByText('a***@bluewave.example')).toBeInTheDocument();
    expect(within(table).getByText('B*** Logistics Pvt Ltd')).toBeInTheDocument();
    const rows = within(table).getAllByRole('row');
    expect(within(rows[1] as HTMLElement).getByText('Sent')).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).getByText('Submitted')).toBeInTheDocument();
    expect(within(rows[3] as HTMLElement).getByText('Opened')).toBeInTheDocument();
    expect(rows[3]).toHaveTextContent('2'); // reminders for the OPENED row
    expect(screen.getByText('3 invitations')).toBeInTheDocument();
  });

  it('filters by state', async () => {
    const api = mockApi([{ method: 'GET', path: /^\/invitations$/, reply: ({ url }) => list(INVITATIONS.filter((i) => !url.searchParams.get('state') || i.state === url.searchParams.get('state'))) }]);
    renderPage(<InvitationsTab cycleId="cy-26h2" acoId="" tz="Asia/Kolkata" canResend={false} canRevoke={false} />);
    await screen.findByText('3 invitations');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'SUBMITTED');
    expect(await screen.findByText('1 invitation')).toBeInTheDocument();
    expect(api.calls.at(-1)?.url.searchParams.get('state')).toBe('SUBMITTED');
  });

  it('resends from the row menu and revokes after confirmation; submitted rows have no actions', async () => {
    const api = mockApi([
      { method: 'GET', path: /^\/invitations$/, reply: () => list(INVITATIONS) },
      { method: 'POST', path: /^\/invitations\/i1\/resend$/, reply: () => data({ ...INVITATIONS[0], state: 'SENT' }) },
      { method: 'POST', path: /^\/invitations\/i3\/revoke$/, reply: () => data({ ...INVITATIONS[2], state: 'REVOKED' }) },
    ]);
    renderPage(<InvitationsTab cycleId="cy-26h2" acoId="" tz="Asia/Kolkata" canResend canRevoke />);
    const table = await screen.findByRole('table', { name: 'Invitations' });
    await waitFor(() => expect(within(table).getAllByRole('button', { name: 'Row actions' })).toHaveLength(3));
    const menus = within(table).getAllByRole('button', { name: 'Row actions' });

    await userEvent.click(menus[0] as HTMLElement);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resend invitation' }));
    await waitFor(() => expect(api.calls.find((c) => c.path === '/invitations/i1/resend')?.method).toBe('POST'));
    expect(await screen.findByText('Invitation re-sent to a***@bluewave.example')).toBeInTheDocument();

    await userEvent.click(menus[1] as HTMLElement);
    const none = await screen.findByRole('menuitem', { name: 'No actions available' });
    expect(none).toBeDisabled();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(menus[2] as HTMLElement);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Revoke' }));
    const dialog = await screen.findByRole('dialog', { name: 'Revoke this invitation?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(api.calls.find((c) => c.path === '/invitations/i3/revoke')?.method).toBe('POST'));
    expect(await screen.findByText('Invitation for M*** Brokers revoked')).toBeInTheDocument();
  });
});
