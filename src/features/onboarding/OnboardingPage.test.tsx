import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OnboardingPage from './OnboardingPage';
import { suggestCode } from './ReviewForm';
import { apiError, APPROVED, data, DEL, list, mockApi, never, OPEN_LINK, renderPage, SUBMITTED, SUBMITTED_DETAIL, USED_LINK } from './testUtils';

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
    expect(await within(dialog).findByText('After approval')).toBeInTheDocument();
    expect(within(dialog).getByText('110 %')).toBeInTheDocument();
    expect(within(dialog).getByText('10 % over 100')).toBeInTheDocument();

    // The preview follows the share the reviewer is about to approve.
    const share = within(dialog).getByLabelText(/Market share/);
    await userEvent.clear(share);
    await userEvent.type(share, '0');
    expect(await within(dialog).findByText('Totals 100 %')).toBeInTheDocument();

    const code = within(dialog).getByLabelText(/Organisation code/);
    expect(code).toHaveValue('DCH-DEL');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve and invite administrator' }));
    expect(await screen.findByText('Delhi Cargo Handlers approved')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ code: 'DCH-DEL', marketSharePct: 0 });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(submitted).getByText('Approved')).toBeInTheDocument();
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
