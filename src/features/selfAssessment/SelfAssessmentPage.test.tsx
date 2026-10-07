import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SelfAssessment } from '@/api/assessments.types';
import { type CurrentCycle } from '@/api/sampling.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';
import { COMPLETE, FORM } from '@/features/assessmentForm/testFixtures';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(),
  forceRefreshToken: vi.fn(),
}));
vi.mock('@/api/sampling', () => ({ useCurrentCycles: vi.fn() }));
vi.mock('@/api/assessments', () => ({
  useSelfAssessment: vi.fn(),
  useSaveSelfAnswers: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue({ lastSavedAt: null }) })),
  useSubmitSelfAssessment: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue({}) })),
}));

import { useSelfAssessment } from '@/api/assessments';
import { useCurrentCycles } from '@/api/sampling';

import SelfAssessmentPage from './SelfAssessmentPage';

const SESSION: Session = {
  user: { id: 'u2', name: 'Priya', email: 'priya@csc.example', status: 'ACTIVE' },
  org: { id: 'org-csc', name: 'Cargo Service Center', type: 'ACO', airportId: 'ap-del' },
  role: { code: 'ACO_ADMIN', scope: 'ACO' },
  scope: { kind: 'ACO', acoId: 'org-csc' },
  tasks: new Set(['assessments.self', 'assessments.view']),
  memberships: [],
};

const CYCLE: CurrentCycle = {
  cycle: {
    id: 'cy1',
    code: 'CSQ-26H2',
    name: 'CSQ 2026 H2',
    type: 'BOTH',
    status: 'SAMPLING_OPEN',
    tz: 'Asia/Kolkata',
    minSampleSize: 30,
    sampling: { start: { wall: '2026-10-01T00:00', utc: '2026-09-30T18:30:00.000Z' }, end: { wall: '2026-10-10T23:59', utc: '2026-10-10T18:29:00.000Z' } },
    assessment: { start: { wall: '2026-10-15T00:00', utc: '2026-10-14T18:30:00.000Z' }, end: { wall: '2026-11-14T23:59', utc: '2026-11-14T18:29:00.000Z' } },
  },
  participant: {
    cycleId: 'cy1',
    acoId: 'org-csc',
    surveyTypes: ['DOMESTIC', 'INTERNATIONAL'],
    requiredSampleSize: 30,
    sampling: { status: 'IN_PROGRESS', selectedCount: 12, lockedAt: null, lockedBy: null, unlockedAt: null, unlockedBy: null, unlockReason: null },
  },
  nextDeadline: null,
};

function self(status: 'DRAFT' | 'SUBMITTED'): SelfAssessment {
  return {
    ...FORM,
    assessment: {
      id: 'a1',
      cycleId: 'cy1',
      acoId: 'org-csc',
      airportId: 'ap-del',
      surveyId: 's1',
      surveyType: 'DOMESTIC',
      kind: 'SELF',
      customerType: null,
      invitationId: null,
      userId: 'u2',
      status,
      progress: { answered: status === 'SUBMITTED' ? 4 : 0, total: 4, pct: status === 'SUBMITTED' ? 100 : 0 },
      startedAt: '2026-10-02T04:00:00.000Z',
      lastSavedAt: null,
      submittedAt: status === 'SUBMITTED' ? '2026-10-05T06:34:00.000Z' : null,
    },
    progress: { answered: 0, total: 4, pct: 0 },
    answers: status === 'SUBMITTED' ? COMPLETE : [],
  };
}

function mount(path = '/self-assessment') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider session={SESSION}>
            <SelfAssessmentPage />
          </AuthProvider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const current = vi.mocked(useCurrentCycles);
const selfQuery = vi.mocked(useSelfAssessment);

describe('SelfAssessmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selfQuery.mockReturnValue({ isPending: true } as unknown as ReturnType<typeof useSelfAssessment>);
  });

  it('shows skeletons while the current cycle loads', () => {
    current.mockReturnValue({ isPending: true, isError: false } as unknown as ReturnType<typeof useCurrentCycles>);
    mount();
    expect(screen.getByRole('heading', { level: 1, name: 'Self-assessment' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loading the current cycle')).toHaveAttribute('aria-busy', 'true');
  });

  it('explains when there is no cycle to act on', () => {
    current.mockReturnValue({ isPending: false, isError: false, data: [] } as unknown as ReturnType<typeof useCurrentCycles>);
    mount();
    expect(screen.getByText('No cycle in progress')).toBeInTheDocument();
    expect(screen.getByText(/never enter the published rating/)).toBeInTheDocument();
  });

  it('offers History once the window has closed', () => {
    current.mockReturnValue({ isPending: false, isError: false, data: [{ ...CYCLE, cycle: { ...CYCLE.cycle, status: 'SCORED' } }] } as unknown as ReturnType<typeof useCurrentCycles>);
    mount();
    expect(screen.getByText('Self-assessment closed for CSQ 2026 H2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View in history' })).toBeInTheDocument();
  });

  it('renders the stepper for an open draft with one tab per survey type', () => {
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE] } as unknown as ReturnType<typeof useCurrentCycles>);
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: self('DRAFT') } as unknown as ReturnType<typeof useSelfAssessment>);
    mount('/self-assessment?type=INTERNATIONAL');
    expect(selfQuery).toHaveBeenLastCalledWith('cy1', 'INTERNATIONAL');
    expect(screen.getByRole('tab', { name: 'International' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'Cargo handling' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(12);
    expect(screen.getByText(/closes 14 Nov 2026, 23:59/)).toBeInTheDocument();
  });

  it('shows the submitted return read-only with its time', () => {
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE] } as unknown as ReturnType<typeof useCurrentCycles>);
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: self('SUBMITTED') } as unknown as ReturnType<typeof useSelfAssessment>);
    mount();
    expect(screen.getByText(/Submitted on 5 Oct 2026, 12:04/)).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 3, name: 'Security' })).toBeInTheDocument();
    expect(screen.getAllByText('Very good').length).toBeGreaterThan(0);
    expect(screen.getByText('NA')).toBeInTheDocument();
  });
});
