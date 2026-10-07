import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configure, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type PublicOnboardingLink } from '@/api/onboarding.types';
import { ToastProvider } from '@/design/primitives';

import RegisterPage from './RegisterPage';

/* The public form has no session; only the two public endpoints are mocked. */

type Reply = { status?: number; body?: unknown };
type Call = { method: string; path: string; body: unknown };

function mockApi(get: () => Reply | Promise<Reply>, post: (body: unknown) => Reply = () => ({ status: 201, body: { data: { registrationId: 'reg-42' } } })) {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(urlStr, 'http://localhost').pathname.replace(/^.*\/api\/v1/, '');
      const method = (init?.method ?? 'GET').toUpperCase();
      const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
      calls.push({ method, path, body });
      const res = method === 'POST' ? post(body) : await get();
      return new Response(JSON.stringify(res.body ?? {}), { status: res.status ?? 200, headers: { 'content-type': 'application/json' } });
    }),
  );
  return calls;
}

const LINK: PublicOnboardingLink = { orgType: 'ACO', airport: { id: 'ap-del', iata: 'DEL', name: 'Indira Gandhi International Airport' }, expiresAt: new Date(Date.now() + 5 * 86_400_000).toISOString(), used: false };
const apiError = (status: number, code: string, message: string): Reply => ({ status, body: { error: { code, message, requestId: 'req_abc123' } } });

function renderPage(token = 'tok_abc') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/register/${token}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/register/:token" element={<RegisterPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

// The stepper walks type into a dozen fields; under a loaded full-suite run that outgrows the defaults.
configure({ asyncUtilTimeout: 4000 });
const LONG = { timeout: 30_000 };

afterEach(() => vi.unstubAllGlobals());

describe('RegisterPage states', () => {
  it('shows a loading card first', () => {
    mockApi(() => new Promise<Reply>(() => undefined));
    renderPage();
    expect(screen.getByText('Checking your link')).toBeInTheDocument();
  });

  it('404 → invalid link', async () => {
    mockApi(() => apiError(404, 'NOT_FOUND', 'Onboarding link not found'));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'This link isn’t valid' })).toBeInTheDocument();
  });

  it('410 → expired link', async () => {
    mockApi(() => apiError(410, 'LINK_EXPIRED', 'This onboarding link has expired'));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeInTheDocument();
  });

  it('used → already registered', async () => {
    mockApi(() => ({ body: { data: { ...LINK, used: true } } }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Already registered' })).toBeInTheDocument();
  });

  it('other errors → retry with the request id', async () => {
    mockApi(() => apiError(500, 'INTERNAL', 'Database unavailable'));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Could not check your link' })).toBeInTheDocument();
    expect(screen.getByText('Request req_abc123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('RegisterPage form', () => {
  it('walks the four steps, validating each, and submits the registration', LONG, async () => {
    const calls = mockApi(() => ({ body: { data: LINK } }));
    renderPage();
    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { level: 1, name: 'Indira Gandhi International Airport (DEL)' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();

    // Step 1 — Organisation: cannot continue without a name.
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Enter your organisation’s name')).toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
    await user.type(screen.getByLabelText(/Organisation name/), 'Delhi Cargo Handlers');
    await user.type(screen.getByLabelText(/Market share/), '10');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 2 — Address & contact.
    expect(await screen.findByRole('heading', { level: 2, name: 'Address & contact' })).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Address line 1/), 'Plot 7, Cargo Complex');
    await user.type(screen.getByLabelText(/City/), 'New Delhi');
    await user.type(screen.getByLabelText(/^State/), 'Delhi');
    await user.type(screen.getByLabelText(/PIN code/), '110037');
    await user.type(screen.getByLabelText(/Contact person/), 'Rahul Verma');
    await user.type(screen.getByLabelText(/E-mail/), 'rahul@dch.example');
    await user.type(screen.getByLabelText(/Phone/), '+91 9876543210');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 3 — Administrator: copy from the contact, then change the e-mail.
    expect(await screen.findByRole('heading', { level: 2, name: 'Administrator' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Same as contact' }));
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Rahul Verma');
    const adminEmail = screen.getByLabelText(/E-mail/);
    await user.clear(adminEmail);
    await user.type(adminEmail, 'admin@dch.example');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 4 — Review, then submit.
    expect(await screen.findByRole('heading', { level: 2, name: 'Review' })).toBeInTheDocument();
    const review = screen.getByRole('heading', { level: 2, name: 'Review' }).parentElement as HTMLElement;
    expect(within(review).getByText('Delhi Cargo Handlers')).toBeInTheDocument();
    expect(within(review).getByText('admin@dch.example')).toBeInTheDocument();
    expect(within(review).getByText('10 %')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Administrator' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(await screen.findByRole('button', { name: 'Submit registration' }));

    expect(await screen.findByRole('heading', { name: 'Request received' })).toBeInTheDocument();
    expect(screen.getByText('Reference reg-42')).toBeInTheDocument();
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/public/onboarding/tok_abc');
    expect(post?.body).toEqual({
      organisation: {
        name: 'Delhi Cargo Handlers',
        address: { line1: 'Plot 7, Cargo Complex', line2: null, city: 'New Delhi', state: 'Delhi', pincode: '110037' },
        contact: { name: 'Rahul Verma', email: 'rahul@dch.example', phone: '+91 9876543210' },
      },
      admin: { name: 'Rahul Verma', email: 'admin@dch.example', phone: '+91 9876543210' },
      operations: { domestic: true, international: false },
      marketSharePct: 10,
    });
  });

  it('shows "already registered" when the link was used meanwhile (409)', LONG, async () => {
    mockApi(
      () => ({ body: { data: LINK } }),
      () => apiError(409, 'CONFLICT', 'This onboarding link has already been used'),
    );
    renderPage();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Organisation name/), 'Delhi Cargo Handlers');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Address & contact' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Address line 1/), 'Plot 7');
    await user.type(screen.getByLabelText(/City/), 'New Delhi');
    await user.type(screen.getByLabelText(/^State/), 'Delhi');
    await user.type(screen.getByLabelText(/PIN code/), '110037');
    await user.type(screen.getByLabelText(/Contact person/), 'Rahul Verma');
    await user.type(screen.getByLabelText(/E-mail/), 'rahul@dch.example');
    await user.type(screen.getByLabelText(/Phone/), '+91 9876543210');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Administrator' }, { timeout: 4000 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Same as contact' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Review' }, { timeout: 4000 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit registration' }));
    expect(await screen.findByRole('heading', { name: 'Already registered' })).toBeInTheDocument();
  });
});
