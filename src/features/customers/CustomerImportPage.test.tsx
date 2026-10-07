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

import CustomerImportPage from './CustomerImportPage';
import { errorsToCsv } from './importCsv';
import { apiError, COMMIT, mockApi, PLATFORM_SESSION, renderPage, VALIDATION } from './test-utils';

afterEach(() => vi.unstubAllGlobals());

const csvFile = () => new File(['Name,Email\nNorthstar,meera@northstar.example\n'], 'customers.csv', { type: 'text/csv' });

function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('file input not rendered');
  return input;
}

describe('CustomerImportPage', () => {
  it('walks template → upload → validate → import → done with a mocked validation', async () => {
    const api = mockApi([
      { method: 'GET', path: /^\/customers\/import\/template$/, reply: () => ({ body: 'Name,Contact person,Email\r\n' }) },
      { method: 'POST', path: /^\/customers\/import\/validate$/, reply: () => ({ status: 201, body: { data: VALIDATION } }) },
      { method: 'POST', path: /^\/customers\/import\/imp1\/commit$/, reply: () => ({ body: { data: COMMIT } }) },
    ]);
    renderPage(<CustomerImportPage />, { route: '/customers/import' });

    // step 1: template
    expect(screen.getByRole('heading', { name: 'Import customers' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Template columns' })).toBeInTheDocument();
    const steps = within(screen.getByRole('list', { name: 'Progress' })).getAllByRole('listitem');
    expect(steps[0]).toHaveAttribute('aria-current', 'step');
    await userEvent.click(screen.getByRole('button', { name: 'I have a file' }));

    // step 2: upload
    expect(screen.getByRole('button', { name: 'Validate file' })).toBeDisabled();
    await userEvent.upload(fileInput(), csvFile());
    expect(screen.getByText('customers.csv')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Validate file' }));

    // step 3: validate
    expect(await screen.findByText('3 · Review before importing')).toBeInTheDocument();
    const validate = api.calls.find((c) => c.path === '/customers/import/validate');
    expect(validate?.body).toMatchObject({ file: expect.any(File) });
    expect(validate?.url.searchParams.get('fileName')).toBe('customers.csv');
    expect(screen.getByText('Rows').nextElementSibling).toHaveTextContent('4');
    expect(screen.getByText('Accepted').nextElementSibling).toHaveTextContent('3');
    expect(screen.getByText('Rejected', { selector: 'span.label' }).nextElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Some columns were ignored')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    const errors = screen.getByRole('table', { name: 'Validation errors' });
    expect(within(errors).getByText('Phone must be a 10-digit Indian mobile or an international number starting with +')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download errors' })).toBeInTheDocument();
    const preview = screen.getByRole('table', { name: 'Preview rows' });
    expect(within(preview).getAllByRole('row')).toHaveLength(5);
    expect(within(preview).getAllByText('Create')).toHaveLength(2);
    expect(within(preview).getByText('Update')).toBeInTheDocument();
    expect(within(preview).getByText('Rejected')).toBeInTheDocument();

    // step 4 + 5: commit, done
    await userEvent.click(screen.getByRole('button', { name: 'Import 3 customers' }));
    expect(await screen.findByText('Import complete')).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === '/customers/import/imp1/commit')?.method).toBe('POST');
    expect(screen.getByText('Created').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Updated').nextElementSibling).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'View customers' })).toBeInTheDocument();
  });

  it('refuses non-CSV files and blocks the import when nothing was accepted', async () => {
    const rejectedAll = { ...VALIDATION, accepted: 0, rejected: 4, preview: VALIDATION.preview.map((r) => ({ ...r, action: 'REJECT' as const })) };
    mockApi([{ method: 'POST', path: /^\/customers\/import\/validate$/, reply: () => ({ status: 201, body: { data: rejectedAll } }) }]);
    renderPage(<CustomerImportPage />, { route: '/customers/import' });
    await userEvent.click(screen.getByRole('button', { name: 'I have a file' }));

    await userEvent.upload(fileInput(), new File(['x'], 'customers.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), { applyAccept: false });
    expect(await screen.findByText(/customers\.xlsx is not a CSV file/)).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('button', { name: 'Validate file' })).toBeDisabled();

    await userEvent.upload(fileInput(), csvFile());
    await userEvent.click(screen.getByRole('button', { name: 'Validate file' }));
    expect(await screen.findByText('Nothing to import')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import 0 customers' })).toBeDisabled();
  });

  it('shows the validation error with its request id and stays on the upload step', async () => {
    mockApi([{ method: 'POST', path: /^\/customers\/import\/validate$/, reply: () => apiError(400, 'VALIDATION', 'Provide a CSV file (multipart "file") or a text/csv body') }]);
    renderPage(<CustomerImportPage />, { route: '/customers/import' });
    await userEvent.click(screen.getByRole('button', { name: 'I have a file' }));
    await userEvent.upload(fileInput(), csvFile());
    await userEvent.click(screen.getByRole('button', { name: 'Validate file' }));
    expect(await screen.findByText(/Provide a CSV file/)).toHaveAttribute('role', 'alert');
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate file' })).toBeEnabled();
  });

  it('passes acoId for PLATFORM users once an operator is chosen', async () => {
    const api = mockApi([
      { method: 'GET', path: /^\/operators$/, reply: () => ({ body: { data: [{ id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 6, customerCount: 212 }], meta: { page: 1, pageSize: 200, total: 1 } } }) },
      { method: 'POST', path: /^\/customers\/import\/validate$/, reply: () => ({ status: 201, body: { data: VALIDATION } }) },
    ]);
    renderPage(<CustomerImportPage />, { session: PLATFORM_SESSION, route: '/customers/import' });
    expect(await screen.findByText('Choose an operator')).toBeInTheDocument();
    const picker = screen.getByRole('combobox', { name: 'Operator' });
    await waitFor(() => expect(picker).toBeEnabled());
    await userEvent.selectOptions(picker, 'org-csc');
    await userEvent.click(await screen.findByRole('button', { name: 'I have a file' }));
    await userEvent.upload(fileInput(), csvFile());
    await userEvent.click(screen.getByRole('button', { name: 'Validate file' }));
    await screen.findByText('3 · Review before importing');
    expect(api.calls.find((c) => c.path === '/customers/import/validate')?.url.searchParams.get('acoId')).toBe('org-csc');
  });

  it('serialises the errors as CSV for download', () => {
    expect(errorsToCsv(VALIDATION.errors)).toBe('row,field,message\r\n4,phone,Phone must be a 10-digit Indian mobile or an international number starting with +');
  });
});
