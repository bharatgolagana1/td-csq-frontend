import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AuditEntry } from '@/api/audit.types';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: async () => 'tok_test',
  forceRefreshToken: async () => false,
}));

vi.mock('./auditCsv', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  return { ...mod, downloadText: vi.fn() };
});

import AuditPage from './AuditPage';
import { downloadText } from './auditCsv';
import { calledUrls, mockFetch, type MockRoute, PLATFORM_SESSION, renderWithProviders } from './testUtils';

const ROWS: AuditEntry[] = [
  {
    id: 'a1',
    actorUserId: 'u2',
    actorEmail: 'priya@csc.example',
    actorOrgId: 'org-csc',
    orgId: 'org-csc',
    action: 'sample.locked',
    entity: 'sample',
    entityId: 'cp-9',
    before: { status: 'IN_PROGRESS', selectedCount: 37, lockedBy: null },
    after: { status: 'LOCKED', selectedCount: 50, lockedBy: 'u2' },
    ip: '10.0.0.7',
    requestId: 'req_lock_1',
    at: '2026-10-07T09:00:00.000Z',
  },
  {
    id: 'a2',
    actorUserId: null,
    actorEmail: null,
    actorOrgId: null,
    orgId: null,
    action: 'cycle.transitioned',
    entity: 'cycle',
    entityId: 'c1',
    before: 'PUBLISHED',
    after: 'SAMPLING_OPEN',
    ip: '',
    requestId: '',
    at: '2026-10-06T18:30:00.000Z',
  },
];

const OPERATORS = [{ id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 1, customerCount: 2 }];

function routes(list: MockRoute['reply']): MockRoute[] {
  return [
    { path: '/audit', reply: list },
    { path: '/operators', reply: () => ({ body: { data: OPERATORS, meta: { page: 1, pageSize: 200, total: 1 } } }) },
  ];
}
const listOk: MockRoute['reply'] = () => ({ body: { data: ROWS, meta: { page: 1, pageSize: 25, total: 2 } } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(downloadText).mockReset();
});

describe('AuditPage', () => {
  it('shows skeleton rows while loading', () => {
    mockFetch(routes(() => 'pending'));
    renderWithProviders(<AuditPage />);
    expect(screen.getByRole('heading', { name: 'Audit' })).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('shows the empty state', async () => {
    mockFetch(routes(() => ({ body: { data: [], meta: { page: 1, pageSize: 25, total: 0 } } })));
    renderWithProviders(<AuditPage />);
    expect(await screen.findByText('No audit entries yet')).toBeInTheDocument();
  });

  it('renders rows with actor, organisation, action pill, entity and request id', async () => {
    mockFetch(routes(listOk));
    renderWithProviders(<AuditPage />);
    await screen.findAllByText('priya@csc.example');
    const table = screen.getByRole('table', { name: 'Audit log' });
    expect(within(table).getAllByText('System')).toHaveLength(2);
    expect(within(table).getByText('Sample locked')).toBeInTheDocument();
    expect(within(table).getByText('Cycle transitioned')).toBeInTheDocument();
    expect(within(table).getByText('req_lock_1')).toBeInTheDocument();
    // Resolved org name: the Organisation column plus the actor sub-line shown at narrow widths.
    expect(await within(table).findAllByText('Cargo Service Center')).toHaveLength(2);
    expect(screen.getByText('2 entries')).toBeInTheDocument();
  });

  it('opens the drawer with a before/after diff and highlights the changed rows', async () => {
    mockFetch(routes(listOk));
    renderWithProviders(<AuditPage />);
    await userEvent.click((await screen.findAllByText('priya@csc.example'))[0] as HTMLElement);
    const drawer = screen.getByRole('dialog', { name: 'Audit entry' });
    expect(within(drawer).getByText('10.0.0.7')).toBeInTheDocument();
    expect(within(drawer).getByText('3 changes · 3 fields')).toBeInTheDocument();
    const rows = within(drawer).getAllByRole('row').filter((r) => r.getAttribute('data-changed') === 'true');
    expect(rows.map((r) => within(r).getByRole('rowheader').textContent)).toEqual(['status', 'selectedCount', 'lockedBy']);
    expect(within(rows[0] as HTMLElement).getByText('IN_PROGRESS')).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByText('LOCKED')).toBeInTheDocument();
  });

  it('shows a scalar snapshot as a single row', async () => {
    mockFetch(routes(listOk));
    renderWithProviders(<AuditPage />);
    await userEvent.click((await screen.findAllByText('System'))[0] as HTMLElement);
    const drawer = screen.getByRole('dialog', { name: 'Audit entry' });
    expect(within(drawer).getByText('1 change · 1 field')).toBeInTheDocument();
    expect(within(drawer).getByText('PUBLISHED')).toBeInTheDocument();
    expect(within(drawer).getByText('SAMPLING_OPEN')).toBeInTheDocument();
  });

  it('sends entity, action, organisation and date range filters to the API', async () => {
    const spy = mockFetch(routes(listOk));
    renderWithProviders(<AuditPage />);
    await screen.findAllByText('priya@csc.example');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Entity' }), 'sample');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Action' }), 'sample.locked');
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Organisation' }), 'org-csc');
    await userEvent.type(screen.getByLabelText('From date'), '2026-10-01');
    await userEvent.type(screen.getByLabelText('To date'), '2026-10-07');
    await waitFor(() => {
      const last = calledUrls(spy).filter((u) => u.includes('/audit?')).at(-1) ?? '';
      expect(last).toContain('entity=sample');
      expect(last).toContain('action=sample.locked');
      expect(last).toContain('orgId=org-csc');
      expect(decodeURIComponent(last)).toContain('from=2026-09-30T18:30:00.000Z');
      expect(decodeURIComponent(last)).toContain('to=2026-10-07T18:29:59.999Z');
      expect(last).toContain('page=1');
    });
  });

  it('exports the filtered view as CSV and notes the limit when truncated', async () => {
    const spy = mockFetch(routes((url) => ({ body: { data: ROWS, meta: { page: Number(url.searchParams.get('page') ?? 1), pageSize: Number(url.searchParams.get('pageSize') ?? 25), total: 2 } } })));
    renderWithProviders(<AuditPage />);
    await screen.findAllByText('priya@csc.example');
    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => expect(downloadText).toHaveBeenCalledTimes(1));
    const [filename, text] = vi.mocked(downloadText).mock.calls[0] as [string, string];
    expect(filename).toMatch(/^audit-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/);
    expect(text.split('\r\n')[0]).toContain('at,actorEmail');
    expect(text).toContain('sample.locked');
    expect(text).toContain('Cargo Service Center');
    expect(calledUrls(spy).some((u) => u.includes('/audit?') && u.includes('pageSize=200'))).toBe(true);
    expect(await screen.findByText('Exported 2 entries')).toBeInTheDocument();
  });

  it('hides the organisation filter outside the platform scope', async () => {
    mockFetch(routes(listOk));
    renderWithProviders(<AuditPage />, { ...PLATFORM_SESSION, scope: { kind: 'ACO', acoId: 'org-csc' }, tasks: new Set(['audit.view']) });
    await screen.findAllByText('priya@csc.example');
    expect(screen.queryByRole('combobox', { name: 'Organisation' })).toBeNull();
  });
});
