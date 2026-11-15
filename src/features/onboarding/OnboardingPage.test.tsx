import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OnboardingPage from './OnboardingPage';
import { suggestCode } from './ReviewForm';
import { apiError, APPROVED, data, DEL, FIRST_AT_AIRPORT, list, mockApi, never, OPEN_LINK, renderPage, SUBMITTED, SUBMITTED_DETAIL, USED_LINK } from './testUtils';

afterEach(() => vi.unstubAllGlobals());

const registrations = (rows = [SUBMITTED, APPROVED]) => ({ method: 'GET', path: /^\/registrations$/, reply: ({ url }: { url: URL }) => list(url.searchParams.get('status') === 'SUBMITTED' ? rows.filter((r) => r.status === 'SUBMITTED') : rows) });

describe('OnboardingPage · Links', () => {
  it('shows skeleton rows while loading', () => {
    mockApi([{ method: 'GET', path: /^\/onboarding\/links$/, reply: never }, { method: 'GET', path: /^\/registrations$/, reply: never }]);
    renderPage(<OnboardingPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Onboarding' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Links/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows the empty state with the create action', async () => {
    mockApi([{ method: 'GET', path: /^\/onboarding\/links$/, reply: () => list([]) }, registrations([])]);
    renderPage(<OnboardingPage />);
    expect(await screen.findByText('No onboarding links')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a link' })).toBeInTheDocument();
  });

  it('lists links with their status and the pending-request count on the Requests tab', async () => {
    mockApi([{ method: 'GET', path: /^\/onboarding\/links$/, reply: () => list([OPEN_LINK, USED_LINK]) }, registrations()]);
    renderPage(<OnboardingPage />);
    const open = (await screen.findByText('For the new terminal operator')).closest('tr') as HTMLElement;
    expect(within(open).getByText('Open')).toBeInTheDocument();
    expect(within(open).getByText('Anita Desai')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows.some((r) => within(r).queryByText('Used') !== null)).toBe(true);
    expect(await screen.findByRole('tab', { name: /Requests.*1/ })).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    mockApi([{ method: 'GET', path: /^\/onboarding\/links$/, reply: () => apiError(500, 'INTERNAL', 'Database unavailable') }, registrations([])]);
    renderPage(<OnboardingPage />);
    expect(await screen.findByText('Could not load links')).toBeInTheDocument();
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
  });

  it('creates a link and shows the URL once', async () => {
    const { calls } = mockApi([
      { method: 'GET', path: /^\/onboarding\/links$/, reply: () => list([]) },
      registrations([]),
      { method: 'GET', path: /^\/airports$/, reply: () => list([DEL]) },
      { method: 'POST', path: /^\/onboarding\/links$/, reply: () => data({ ...OPEN_LINK, url: 'https://csq.example/register/tok_abc' }, 201) },
    ]);
    renderPage(<OnboardingPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Create link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create onboarding link' });
    await userEvent.selectOptions(await within(dialog).findByRole('combobox', { name: /Airport/ }), 'ap-del');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create link' }));
    expect(await screen.findByTestId('created-link-url')).toHaveTextContent('https://csq.example/register/tok_abc');
    expect(screen.getByText('Shown only once')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ orgType: 'ACO', airportId: 'ap-del', expiresInDays: 14 });
  });
});

describe('OnboardingPage · Requests', () => {
  it('lists requests and reviews one with the after-approval share preview', async () => {
    // A tiny stateful server: approval flips the stored status so the refetch after settling agrees.
    const store = { rows: [SUBMITTED, APPROVED], detail: SUBMITTED_DETAIL };
    const { calls } = mockApi([
      { method: 'GET', path: /^\/onboarding\/links$/, reply: () => list([]) },
      { method: 'GET', path: /^\/registrations$/, reply: ({ url }) => list(url.searchParams.get('status') === 'SUBMITTED' ? store.rows.filter((r) => r.status === 'SUBMITTED') : store.rows) },
      { method: 'GET', path: /^\/registrations\/reg-1$/, reply: () => data(store.detail) },
      {
        method: 'POST',
        path: /^\/registrations\/reg-1\/approve$/,
        reply: ({ body }) => {
          store.detail = { ...SUBMITTED_DETAIL, status: 'APPROVED', reviewedAt: '2026-10-07T10:00:00.000Z', reviewNote: (body as { note?: string }).note ?? null };
          store.rows = store.rows.map((r) => (r.id === 'reg-1' ? { ...r, status: 'APPROVED' as const } : r));
          return data(store.detail);
        },
      },
    ]);
    renderPage(<OnboardingPage />, { route: '/onboarding?tab=requests' });
    const submitted = (await screen.findByRole('button', { name: 'Delhi Cargo Handlers' })).closest('tr') as HTMLElement;
    expect(within(submitted).getByText('Awaiting review')).toBeInTheDocument();
    const approved = (await screen.findByRole('button', { name: 'Mumbai Air Cargo' })).closest('tr') as HTMLElement;
    expect(within(approved).getByText('Approved')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delhi Cargo Handlers' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delhi Cargo Handlers' });

    // The airport's operators and the new one, editable, prefilled with the current and the requested shares.
    const shares = await within(dialog).findByRole('region', { name: 'Market share after approval' });
    expect(within(shares).getByLabelText('Share for Cargo Service Center')).toHaveValue('55');
    expect(within(shares).getByLabelText('Share for Çelebi Delhi Cargo')).toHaveValue('45');
    expect(within(shares).getByLabelText('Share for Delhi Cargo Handlers')).toHaveValue('10');
    expect(within(shares).getByTestId('approval-total')).toHaveTextContent('110 %');
    expect(within(shares).getByText('10 % over 100')).toBeInTheDocument();
    const approveButton = within(dialog).getByRole('button', { name: 'Approve and invite administrator' });
    expect(approveButton).toBeDisabled();
    expect(within(dialog).getByText('Approve once the shares total exactly 100 %.')).toBeInTheDocument();

    // One click makes room: the others shrink in proportion.
    await userEvent.click(within(shares).getByRole('button', { name: 'Scale the others to fit' }));
    expect(within(shares).getByLabelText('Share for Cargo Service Center')).toHaveValue('49.5');
    expect(within(shares).getByLabelText('Share for Çelebi Delhi Cargo')).toHaveValue('40.5');
    expect(within(shares).getByTestId('approval-total')).toHaveTextContent('100 %');
    expect(within(shares).getByText('Totals 100 %')).toBeInTheDocument();
    expect(approveButton).toBeEnabled();

    // Typing off 100 holds the approval again; back on 100 releases it.
    const own = within(shares).getByLabelText('Share for Delhi Cargo Handlers');
    await userEvent.clear(own);
    await userEvent.type(own, '12');
    expect(approveButton).toBeDisabled();
    await userEvent.clear(own);
    await userEvent.type(own, '10');
    expect(approveButton).toBeEnabled();

    const code = within(dialog).getByLabelText(/Organisation code/);
    expect(code).toHaveValue('DCH-DEL');
    await userEvent.click(approveButton);
    expect(await screen.findByText('Delhi Cargo Handlers approved')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      code: 'DCH-DEL',
      marketSharePct: 10,
      shares: [
        { acoId: 'org-clb', sharePct: 40.5 },
        { acoId: 'org-csc', sharePct: 49.5 },
      ],
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(submitted).getByText('Approved')).toBeInTheDocument();
  });

  it('the first operator at an airport is approved at 100 %; a share problem from the server is shown', async () => {
    const { calls } = mockApi([
      { method: 'GET', path: /^\/onboarding\/links$/, reply: () => list([]) },
      registrations([{ ...SUBMITTED, id: 'reg-2', organisation: FIRST_AT_AIRPORT.organisation }]),
      { method: 'GET', path: /^\/registrations\/reg-2$/, reply: () => data(FIRST_AT_AIRPORT) },
      {
        method: 'POST',
        path: /^\/registrations\/reg-2\/approve$/,
        reply: () => apiError(400, 'VALIDATION', 'Market shares at DEL must total 100 with JCS-DEL', { issues: [{ path: 'shares', message: 'No share given for NEW-DEL (New Cargo), active at DEL' }] }),
      },
    ]);
    renderPage(<OnboardingPage />, { route: '/registrations/reg-2', path: '/registrations/:id' });
    const dialog = await screen.findByRole('dialog', { name: 'Jaipur Cargo Services' });
    const shares = await within(dialog).findByRole('region', { name: 'Market share after approval' });
    expect(within(shares).getByText(/will be the only active operator at DEL, so it holds 100 %/)).toBeInTheDocument();
    expect(within(shares).getByLabelText('Share for Jaipur Cargo Services')).toHaveValue('40');
    const approveButton = within(dialog).getByRole('button', { name: 'Approve and invite administrator' });
    expect(approveButton).toBeDisabled();
    await userEvent.click(within(shares).getByRole('button', { name: 'Give it 100 %' }));
    expect(within(shares).getByLabelText('Share for Jaipur Cargo Services')).toHaveValue('100');
    expect(approveButton).toBeEnabled();

    // Someone added an operator meanwhile: the server says which one, and the request stays open.
    await userEvent.click(approveButton);
    expect(await within(dialog).findByRole('alert', { name: 'Market share problems' })).toHaveTextContent('No share given for NEW-DEL (New Cargo), active at DEL');
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ code: 'JCS-DEL', marketSharePct: 100, shares: [] });
  });

  it('opens the request from the reviewer URL and requires a reason to reject', async () => {
    mockApi([
      { method: 'GET', path: /^\/onboarding\/links$/, reply: () => list([]) },
      registrations(),
      { method: 'GET', path: /^\/registrations\/reg-1$/, reply: () => data(SUBMITTED_DETAIL) },
    ]);
    renderPage(<OnboardingPage />, { route: '/registrations/reg-1', path: '/registrations/:id' });
    const dialog = await screen.findByRole('dialog', { name: 'Delhi Cargo Handlers' });
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Reject instead…' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject request' }));
    expect(await within(dialog).findByText('Tell the applicant why')).toBeInTheDocument();
  });
});

describe('suggestCode', () => {
  it('builds a code from the initials and the airport', () => {
    expect(suggestCode('Delhi Cargo Handlers', 'DEL')).toBe('DCH-DEL');
    expect(suggestCode('Çelebi', 'DEL')).toBe('CELEBI-DEL');
    expect(suggestCode('9 Lives Logistics', undefined)).toBe('X9LL');
  });
});
