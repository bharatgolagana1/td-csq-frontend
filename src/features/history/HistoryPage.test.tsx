import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type HistoryRow } from '@/api/assessments.types';
import { ApiError } from '@/api/client';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(),
  forceRefreshToken: vi.fn(),
}));
vi.mock('@/api/cycles', () => ({ useCycles: vi.fn(() => ({ data: { data: [{ id: 'cy1', code: 'CSQ-26H2', name: 'CSQ 2026 H2', tz: 'Asia/Kolkata' }], meta: { page: 1, pageSize: 100, total: 1 } } })) }));
vi.mock('@/api/assessments', () => ({
  useAssessments: vi.fn(),
  useExportAssessments: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

import { useAssessments } from '@/api/assessments';

import HistoryPage from './HistoryPage';

const SESSION: Session = {
  user: { id: 'u2', name: 'Priya', email: 'priya@csc.example', status: 'ACTIVE' },
  org: { id: 'org-csc', name: 'Cargo Service Center', type: 'ACO', airportId: 'ap-del' },
  role: { code: 'ACO_ADMIN', scope: 'ACO' },
  scope: { kind: 'ACO', acoId: 'org-csc' },
  tasks: new Set(['assessments.view', 'cycles.view']),
  memberships: [],
};

const ROWS: HistoryRow[] = [
  {
    id: 'a1',
    cycle: { id: 'cy1', code: 'CSQ-26H2', name: 'CSQ 2026 H2' },
    operator: { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center' },
    kind: 'CUSTOMER',
    surveyType: 'DOMESTIC',
    customerType: 'FF',
    customerId: null,
    assessorName: 'A*** R***',
    assessorEmailMasked: 'a***@delcargo.test',
    assessor: { name: 'A*** R***', email: 'a***@delcargo.test', revealed: false },
    status: 'SUBMITTED',
    progress: { answered: 23, total: 23, pct: 100 },
    startedAt: '2026-10-02T04:00:00.000Z',
    submittedAt: '2026-10-05T06:34:00.000Z',
    score: 4.25,
  },
  {
    id: 'a2',
    cycle: { id: 'cy1', code: 'CSQ-26H2', name: 'CSQ 2026 H2' },
    operator: { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center' },
    kind: 'SELF',
    surveyType: 'DOMESTIC',
    customerType: null,
    customerId: null,
    assessorName: 'Priya Natarajan',
    assessorEmailMasked: 'p***@csc.example',
    assessor: { name: 'Priya Natarajan', email: 'priya@csc.example', revealed: true },
    status: 'DRAFT',
    progress: { answered: 9, total: 23, pct: 39 },
    startedAt: '2026-10-03T04:00:00.000Z',
    submittedAt: null,
    score: null,
  },
];

function Detail() {
  const { id } = useParams();
  return <p>detail {id}</p>;
}

function mount(path = '/history') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider session={SESSION}>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:id" element={<Detail />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const list = vi.mocked(useAssessments);

describe('HistoryPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows skeleton rows while loading', () => {
    list.mockReturnValue({ isPending: true, isError: false } as unknown as ReturnType<typeof useAssessments>);
    mount();
    expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('has a real empty state, and a filtered one with a clear action', async () => {
    list.mockReturnValue({ isPending: false, isError: false, data: { data: [], meta: { page: 1, pageSize: 25, total: 0 } } } as unknown as ReturnType<typeof useAssessments>);
    mount();
    expect(screen.getByText('No assessments yet')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Kind'), 'SELF');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'SELF', page: 1 }));
    expect(screen.getByText('No assessments match these filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(list).toHaveBeenLastCalledWith(expect.not.objectContaining({ kind: 'SELF' }));
  });

  it('lists rows with masked e-mail, status pill and 1 dp score, and opens the return on click', async () => {
    list.mockReturnValue({ isPending: false, isError: false, data: { data: ROWS, meta: { page: 1, pageSize: 25, total: 2 } } } as unknown as ReturnType<typeof useAssessments>);
    mount();
    expect(screen.getByText('2 assessments')).toBeInTheDocument();
    const customerRow = screen.getByRole('row', { name: /A\*\*\* R\*\*\*/ });
    expect(within(customerRow).getByText('a***@delcargo.test')).toBeInTheDocument();
    expect(within(customerRow).getByText('4.3')).toBeInTheDocument();
    expect(within(customerRow).getByText('Submitted')).toBeInTheDocument();
    expect(within(customerRow).getByText('5 Oct 2026, 12:04 IST')).toBeInTheDocument();
    const selfRow = screen.getByRole('row', { name: /Priya Natarajan/ });
    expect(within(selfRow).getByText('Draft')).toBeInTheDocument();
    // No customer type, no submitted time, no score yet.
    expect(within(selfRow).getAllByText('—')).toHaveLength(3);

    await userEvent.selectOptions(screen.getByLabelText('Cycle'), 'cy1');
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();

    await userEvent.click(screen.getByText('A*** R***'));
    expect(await screen.findByText('detail a1')).toBeInTheDocument();
  });

  it('shows the request id and a retry when the list fails', async () => {
    const refetch = vi.fn();
    list.mockReturnValue({ isPending: false, isError: true, error: new ApiError(503, 'INTERNAL', 'Service unavailable', undefined, 'req_9'), refetch } as unknown as ReturnType<typeof useAssessments>);
    mount();
    expect(screen.getByText('Could not load assessments')).toBeInTheDocument();
    expect(screen.getByText('req_9')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });
});
