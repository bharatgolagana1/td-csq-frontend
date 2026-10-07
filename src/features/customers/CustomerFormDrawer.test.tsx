import { screen, waitFor } from '@testing-library/react';
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

import { CustomerFormDrawer, parseTags } from './CustomerFormDrawer';
import { formatPhone, normalisePhone } from './phone';
import { apiError, customer, mockApi, renderPage } from './test-utils';

afterEach(() => vi.unstubAllGlobals());

describe('phone normaliser', () => {
  it('accepts Indian mobiles in every common spelling and rejects the rest', () => {
    expect(normalisePhone('98765 43210')).toEqual({ ok: true, value: '+919876543210' });
    expect(normalisePhone('098765-43210')).toEqual({ ok: true, value: '+919876543210' });
    expect(normalisePhone('91 9876543210')).toEqual({ ok: true, value: '+919876543210' });
    expect(normalisePhone('+1 (415) 555 0100')).toEqual({ ok: true, value: '+14155550100' });
    expect(normalisePhone('0044 20 7946 0958')).toEqual({ ok: true, value: '+442079460958' });
    expect(normalisePhone('12345')).toMatchObject({ ok: false });
    expect(normalisePhone('+911234567890')).toMatchObject({ ok: false, message: 'Indian mobile numbers start with 6, 7, 8 or 9' });
    expect(normalisePhone('')).toMatchObject({ ok: false, message: 'Phone is required' });
    expect(formatPhone('+919876543210')).toBe('+91 98765 43210');
    expect(formatPhone('+14155550100')).toBe('+14155550100');
  });

  it('parses tags, trimming and de-duplicating case-insensitively', () => {
    expect(parseTags('ops; Priority, delhi ,ops, PRIORITY')).toEqual(['ops', 'Priority', 'delhi']);
    expect(parseTags('')).toEqual([]);
  });
});

describe('CustomerFormDrawer', () => {
  it('validates the required fields before sending anything', async () => {
    const api = mockApi([]);
    renderPage(<CustomerFormDrawer open onClose={() => undefined} customer={null} acoId="org-csc" isPlatform={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add customer' }));
    expect(await screen.findByText('Enter the organisation name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid e-mail address')).toBeInTheDocument();
    expect(screen.getByText('Phone is required')).toBeInTheDocument();
    expect(api.calls).toHaveLength(0);
  });

  it('previews the normalised phone and posts the cleaned body', async () => {
    const api = mockApi([{ method: 'POST', path: /^\/customers$/, reply: ({ body }) => ({ status: 201, body: { data: customer(body as object) } }) }]);
    const onClose = vi.fn();
    renderPage(<CustomerFormDrawer open onClose={onClose} customer={null} acoId="org-csc" isPlatform={false} />);
    await userEvent.type(screen.getByRole('textbox', { name: /Organisation name/ }), 'Northstar Cargo');
    await userEvent.type(screen.getByRole('textbox', { name: /E-mail/ }), 'Meera@Northstar.example');
    await userEvent.type(screen.getByRole('textbox', { name: /Phone/ }), '98111 11111');
    expect(screen.getByText('Will be saved as +91 98111 11111')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Stakeholder type/ }), 'CB');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Survey type/ }), 'BOTH');
    await userEvent.type(screen.getByRole('textbox', { name: /Tags/ }), 'new; priority, new');
    await userEvent.click(screen.getByRole('button', { name: 'Add customer' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const post = api.calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({ name: 'Northstar Cargo', contactPerson: '', email: 'meera@northstar.example', phone: '+919811111111', type: 'CB', surveyType: 'BOTH', tags: ['new', 'priority'] });
  });

  it('puts a duplicate e-mail (409) on the e-mail field', async () => {
    mockApi([{ method: 'POST', path: /^\/customers$/, reply: () => apiError(409, 'CONFLICT', 'A customer with this e-mail already exists for this operator') }]);
    const onClose = vi.fn();
    renderPage(<CustomerFormDrawer open onClose={onClose} customer={null} acoId="org-csc" isPlatform={false} />);
    await userEvent.type(screen.getByRole('textbox', { name: /Organisation name/ }), 'Bluewave');
    await userEvent.type(screen.getByRole('textbox', { name: /E-mail/ }), 'asha@bluewave.example');
    await userEvent.type(screen.getByRole('textbox', { name: /Phone/ }), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: 'Add customer' }));
    expect(await screen.findByText('A customer with this e-mail already exists for this operator')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /E-mail/ })).toHaveAttribute('aria-invalid', 'true');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('maps server VALIDATION details onto fields', async () => {
    mockApi([{ method: 'POST', path: /^\/customers$/, reply: () => apiError(400, 'VALIDATION', 'Validation failed', { issues: [{ path: ['body', 'phone'], message: 'Phone must be + followed by 8 to 15 digits' }] }) }]);
    renderPage(<CustomerFormDrawer open onClose={() => undefined} customer={null} acoId="org-csc" isPlatform={false} />);
    await userEvent.type(screen.getByRole('textbox', { name: /Organisation name/ }), 'Bluewave');
    await userEvent.type(screen.getByRole('textbox', { name: /E-mail/ }), 'asha@bluewave.example');
    await userEvent.type(screen.getByRole('textbox', { name: /Phone/ }), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: 'Add customer' }));
    expect(await screen.findByText('Phone must be + followed by 8 to 15 digits')).toBeInTheDocument();
  });

  it('edits an existing customer with PATCH and confirms before discarding changes', async () => {
    const api = mockApi([{ method: 'PATCH', path: /^\/customers\/c1$/, reply: ({ body }) => ({ body: { data: customer(body as object) } }) }]);
    const onClose = vi.fn();
    renderPage(<CustomerFormDrawer open onClose={onClose} customer={customer()} acoId="org-csc" isPlatform={false} />);
    const name = screen.getByRole('textbox', { name: /Organisation name/ });
    expect(name).toHaveValue('Bluewave Logistics Pvt Ltd');
    await userEvent.clear(name);
    await userEvent.type(name, 'Bluewave Logistics Ltd');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.calls.find((c) => c.method === 'PATCH')?.body).toMatchObject({ name: 'Bluewave Logistics Ltd', phone: '+919876543210' });
  });
});
