import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AirportDetail } from '@/api/airports.types';
import { type MarketShare } from '@/api/marketshare.types';
import { type Operator } from '@/api/operators.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

import MarketSharePage from './MarketSharePage';

/* Mocked fetch for the three reads the page makes plus the save. */

type Reply = { status?: number; body?: unknown };
type Route = { method: string; path: RegExp; reply: (ctx: { url: URL; body: unknown }) => Reply | Promise<Reply> };
type Call = { method: string; path: string; body: unknown; url: URL };

function mockApi(routes: Route[]) {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(urlStr, 'http://localhost');
      const path = url.pathname.replace(/^.*\/api\/v1/, '');
      const method = (init?.method ?? 'GET').toUpperCase();
      const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
      calls.push({ method, path, body, url });
      const route = routes.find((r) => r.method === method && r.path.test(path));
      const res = route ? await route.reply({ url, body }) : { status: 404, body: { error: { code: 'NOT_FOUND', message: `No mock for ${method} ${path}`, requestId: 'req_missing' } } };
      return new Response(JSON.stringify(res.body ?? {}), { status: res.status ?? 200, headers: { 'content-type': 'application/json' } });
    }),
  );
  return calls;
}

const list = <T,>(data: T[]): Reply => ({ body: { data, meta: { page: 1, pageSize: 25, total: data.length } } });
const data = (value: unknown): Reply => ({ body: { data: value } });
const never = (): Promise<Reply> => new Promise(() => undefined);

const SESSION: Session = {
  user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['airports.view', 'cycles.view', 'marketshare.view', 'marketshare.manage']),
  memberships: [{ id: 'm1', orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' }],
};

function renderPage(ui: ReactNode, route: string, session = SESSION) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <AuthProvider session={session}>
          <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {ui}
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const AT = '2026-09-01T06:00:00.000Z';
const CSC: Operator = {
  id: 'org-csc',
  code: 'CSC-DEL',
  name: 'Cargo Service Center',
  legalName: null,
  airport: { id: 'ap-del', iata: 'DEL', name: 'Indira Gandhi International Airport' },
  operations: { domestic: true, international: true },
  address: null,
  contact: null,
  status: 'ACTIVE',
  createdVia: 'ADMIN',
  memberCount: 6,
  customerCount: 212,
  currentShare: 55,
  approvedAt: AT,
  createdAt: AT,
  updatedAt: AT,
};
const CLB: Operator = { ...CSC, id: 'org-clb', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', currentShare: 45 };
const NEW: Operator = { ...CSC, id: 'org-new', code: 'NEW-DEL', name: 'New Operator', currentShare: null };
const SHARE: MarketShare = {
  airportId: 'ap-del',
  cycleId: null,
  entries: [
    { acoId: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', sharePct: 55 },
    { acoId: 'org-clb', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', sharePct: 45 },
  ],
  total: 100,
  frozen: false,
};
const DETAIL: AirportDetail = { id: 'ap-del', iata: 'DEL', icao: 'VIDP', name: 'Indira Gandhi International Airport', city: 'New Delhi', state: 'Delhi', region: 'North', country: 'IN', lat: 28.5, lng: 77.1, active: true, operatorCount: 3, createdAt: AT, updatedAt: AT, operators: [CSC, CLB, NEW], marketShare: SHARE };
const CYCLE = { id: 'cy-26h1', code: 'CSQ-26H1', name: 'CSQ 2026 H1', status: 'SCORED' };

const reads = (share: MarketShare = SHARE): Route[] => [
  { method: 'GET', path: /^\/airports$/, reply: () => list([{ ...DETAIL, operators: undefined, marketShare: undefined }]) },
  { method: 'GET', path: /^\/cycles$/, reply: () => list([CYCLE]) },
  { method: 'GET', path: /^\/airports\/ap-del$/, reply: () => data(DETAIL) },
  { method: 'GET', path: /^\/airports\/ap-del\/market-share$/, reply: ({ url }) => data(url.searchParams.get('cycleId') ? { ...share, cycleId: 'cy-26h1', frozen: true } : share) },
];

afterEach(() => vi.unstubAllGlobals());

describe('MarketSharePage', () => {
  it('asks for an airport when none is chosen', async () => {
    mockApi(reads());
    renderPage(<MarketSharePage />, '/market-share');
    expect(await screen.findByText('Choose an airport')).toBeInTheDocument();
  });

  it('shows a skeleton while the set loads', () => {
    mockApi([{ method: 'GET', path: /^\/airports\/ap-del\/market-share$/, reply: never }, ...reads()]);
    renderPage(<MarketSharePage />, '/market-share?airportId=ap-del');
    expect(screen.getByRole('heading', { level: 1, name: 'Market share' })).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('holds Save until the set is dirty and totals 100, then PUTs the whole set', async () => {
    const calls = mockApi([...reads(), { method: 'PUT', path: /^\/airports\/ap-del\/market-share$/, reply: ({ body }) => data({ ...SHARE, entries: (body as { entries: { acoId: string; sharePct: number }[] }).entries.map((e) => ({ ...e, code: '', name: '' })) }) }]);
    renderPage(<MarketSharePage />, '/market-share?airportId=ap-del');
    expect(await screen.findByText('Totals 100 %')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save shares' });
    expect(save).toBeDisabled();

    // The airport's operator without a saved share gets an (empty) row.
    const newRow = (await screen.findByText('New Operator')).closest('tr') as HTMLElement;
    expect(within(newRow).getByText('Not in this set yet')).toBeInTheDocument();

    const csc = screen.getByRole('textbox', { name: 'Share for Cargo Service Center' });
    await userEvent.clear(csc);
    await userEvent.type(csc, '50');
    expect(screen.getByText('5 % short of 100')).toBeInTheDocument();
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: 'Share for New Operator' }), '5');
    expect(screen.getByText('Totals 100 %')).toBeInTheDocument();
    expect(save).toBeEnabled();

    await userEvent.type(csc, '0');
    expect(csc).toHaveValue('500');
    expect(screen.getByText('Enter 0–100')).toBeInTheDocument();
    expect(screen.getByText('50 % short of 100')).toBeInTheDocument();
    expect(save).toBeDisabled();
    await userEvent.clear(csc);
    await userEvent.type(csc, '150');
    expect(screen.getByText('Enter 0–100')).toBeInTheDocument();
    expect(save).toBeDisabled();
    await userEvent.clear(csc);
    await userEvent.type(csc, '50');

    await userEvent.click(save);
    expect(await screen.findByText('Market shares saved')).toBeInTheDocument();
    const put = calls.find((c) => c.method === 'PUT');
    expect(put?.body).toEqual({
      cycleId: null,
      entries: [
        { acoId: 'org-csc', sharePct: 50 },
        { acoId: 'org-clb', sharePct: 45 },
        { acoId: 'org-new', sharePct: 5 },
      ],
    });
  });

  it('shows the frozen banner and read-only values for a frozen cycle snapshot', async () => {
    mockApi(reads());
    renderPage(<MarketSharePage />, '/market-share?airportId=ap-del&cycleId=cy-26h1');
    expect(await screen.findByText('Frozen')).toBeInTheDocument();
    expect(screen.getByText(/CSQ-26H1 has moved past publishing/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Share for/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save shares' })).toBeNull();
    expect(screen.getByText('55 %')).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    mockApi([{ method: 'GET', path: /^\/airports\/ap-del\/market-share$/, reply: () => ({ status: 500, body: { error: { code: 'INTERNAL', message: 'Database unavailable', requestId: 'req_abc123' } } }) }, ...reads()]);
    renderPage(<MarketSharePage />, '/market-share?airportId=ap-del');
    expect(await screen.findByText('Could not load market shares')).toBeInTheDocument();
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
  });
});
