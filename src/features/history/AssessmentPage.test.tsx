import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type AssessmentDetail } from '@/api/assessments.types';
import { AuthProvider, type Session } from '@/auth/session';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(),
  forceRefreshToken: vi.fn(),
}));
vi.mock('@/api/cycles', () => ({ useCycle: vi.fn(() => ({ data: { id: 'cy1', tz: 'Asia/Kolkata' } })) }));
vi.mock('@/api/assessments', () => ({ useAssessment: vi.fn() }));

import { useAssessment } from '@/api/assessments';

import AssessmentPage from './AssessmentPage';

const SESSION: Session = {
  user: { id: 'u1', name: 'Anita', email: 'anita@acfi.example', status: 'ACTIVE' },
  org: { id: 'org-acfi', name: 'Air Cargo Forum India', type: 'ACFI' },
  role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
  scope: { kind: 'PLATFORM' },
  tasks: new Set(['assessments.view', 'cycles.view']),
  memberships: [],
};

const DETAIL: AssessmentDetail = {
  id: 'a1',
  cycle: { id: 'cy1', code: 'CSQ-26H2', name: 'CSQ 2026 H2' },
  operator: { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center' },
  kind: 'CUSTOMER',
  surveyType: 'DOMESTIC',
  customerType: 'CB',
  customerId: null,
  assessorName: 'A*** R***',
  assessorEmailMasked: 'a***@delcargo.test',
  assessor: { name: 'A*** R***', email: 'a***@delcargo.test', revealed: false },
  status: 'SUBMITTED',
  progress: { answered: 2, total: 2, pct: 100 },
  startedAt: '2026-10-02T04:00:00.000Z',
  submittedAt: '2026-10-05T06:34:00.000Z',
  score: 3,
  survey: { id: 's1', code: 'DOMESTIC', name: 'Domestic survey', version: 3 },
  answers: [
    { questionId: 'q1', code: 'Q1', text: 'Shipment acceptance', category: { id: 'c1', code: 'H', name: 'Cargo handling' }, subcategory: { id: 's', code: 'S', name: 'Acceptance' }, rating: 2, na: false, comment: 'Queues at the gate', followUp: ['Queues'] },
    { questionId: 'q2', code: 'Q2', text: 'Security screening', category: { id: 'c2', code: 'S', name: 'Security' }, subcategory: null, rating: 4, na: false, comment: null, followUp: [] },
  ],
};

function mount() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/history/a1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider session={SESSION}>
          <Routes>
            <Route path="/history/:id" element={<AssessmentPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const detail = vi.mocked(useAssessment);

describe('AssessmentPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a skeleton while loading', () => {
    detail.mockReturnValue({ isPending: true, isError: false } as unknown as ReturnType<typeof useAssessment>);
    mount();
    expect(screen.getByLabelText('Loading the assessment')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('link', { name: 'Back to history' })).toHaveAttribute('href', '/');
  });

  it('renders the read-only return by category with rating pills, follow-ups and comments', () => {
    detail.mockReturnValue({ isPending: false, isError: false, data: DETAIL } as unknown as ReturnType<typeof useAssessment>);
    mount();
    expect(detail).toHaveBeenCalledWith('a1');
    expect(screen.getByRole('heading', { level: 1, name: 'Customer assessment' })).toBeInTheDocument();
    expect(screen.getByText('Identity masked')).toBeInTheDocument();
    expect(screen.getByText('a***@delcargo.test')).toBeInTheDocument();
    expect(screen.getByText('Customs broker')).toBeInTheDocument();
    expect(screen.getByText('5 Oct 2026, 12:04 IST (UTC+05:30)')).toBeInTheDocument();
    expect(screen.getByText('3.0')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Cargo handling' })).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Very good')).toBeInTheDocument();
    expect(screen.getByText('Queues')).toBeInTheDocument();
    expect(screen.getByText('Queues at the gate')).toBeInTheDocument();
  });
});
