import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SelfAssessment } from '@/api/assessments.types';
import { type CurrentCycle } from '@/api/sampling.types';
import { AuthProvider, type Session } from '@/auth/session';
import { ToastProvider } from '@/design/primitives';
import { COMPLETE, FORM, REMARKS } from '@/features/assessmentForm/testFixtures';

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
  useSaveSelfRemarks: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue({ sectionRemarks: [], lastSavedAt: null }) })),
  useSubmitSelfAssessment: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue({}) })),
}));

import { useSaveSelfRemarks, useSelfAssessment } from '@/api/assessments';
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
    sectionRemarks: status === 'SUBMITTED' ? REMARKS : [],
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
    expect(screen.getByRole('textbox', { name: 'Remarks for Cargo handling' })).toHaveValue('');
    expect(screen.getByText(/closes 14 Nov 2026, 23:59/)).toBeInTheDocument();
  });

  it('an operator in two open cycles chooses which self-assessment to answer, kept in the URL; the current one first', async () => {
    const second: CurrentCycle = {
      ...CYCLE,
      cycle: { ...CYCLE.cycle, id: 'cy2', code: 'CSQ-26X', name: 'CSQ 2026 Express', type: 'DOMESTIC', status: 'ASSESSMENT_OPEN' },
      participant: { ...CYCLE.participant, cycleId: 'cy2', surveyTypes: ['DOMESTIC'] },
    };
    const published: CurrentCycle = { ...CYCLE, cycle: { ...CYCLE.cycle, id: 'cy3', code: 'CSQ-27H1', name: 'CSQ 2027 H1', status: 'PUBLISHED' } };
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE, second, published] } as unknown as ReturnType<typeof useCurrentCycles>);
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: self('DRAFT') } as unknown as ReturnType<typeof useSelfAssessment>);
    mount('/self-assessment?type=INTERNATIONAL');
    const picker = screen.getByRole('combobox', { name: 'Cycle' });
    // The open cycles only; the current one (first open) is shown first.
    expect(within(picker).getAllByRole('option').map((o) => o.textContent)).toEqual(['CSQ 2026 H2 · CSQ-26H2 · Sampling open', 'CSQ 2026 Express · CSQ-26X · Assessment open']);
    expect(picker).toHaveValue('cy1');
    expect(selfQuery).toHaveBeenLastCalledWith('cy1', 'INTERNATIONAL');

    await userEvent.selectOptions(picker, 'cy2');
    expect(selfQuery).toHaveBeenLastCalledWith('cy2', 'DOMESTIC');
    expect(screen.getByRole('combobox', { name: 'Cycle' })).toHaveValue('cy2');
    expect(screen.getByText(/CSQ 2026 Express · closes/)).toBeInTheDocument();
    // One survey type in that cycle: no tabs.
    expect(screen.queryByRole('tab', { name: 'International' })).toBeNull();
  });

  it('opens the cycle named in ?cycleId=, and offers no choice with a single open cycle', () => {
    const second: CurrentCycle = { ...CYCLE, cycle: { ...CYCLE.cycle, id: 'cy2', code: 'CSQ-26X', name: 'CSQ 2026 Express', status: 'ASSESSMENT_OPEN' }, participant: { ...CYCLE.participant, cycleId: 'cy2' } };
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE, second] } as unknown as ReturnType<typeof useCurrentCycles>);
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: self('DRAFT') } as unknown as ReturnType<typeof useSelfAssessment>);
    const { unmount } = mount('/self-assessment?cycleId=cy2');
    expect(selfQuery).toHaveBeenLastCalledWith('cy2', 'DOMESTIC');
    expect(screen.getByRole('combobox', { name: 'Cycle' })).toHaveValue('cy2');
    unmount();

    const published: CurrentCycle = { ...CYCLE, cycle: { ...CYCLE.cycle, id: 'cy3', status: 'PUBLISHED' } };
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE, published] } as unknown as ReturnType<typeof useCurrentCycles>);
    mount();
    expect(screen.queryByRole('combobox', { name: 'Cycle' })).toBeNull();
    expect(selfQuery).toHaveBeenLastCalledWith('cy1', 'DOMESTIC');
  });

  it('a reopened draft says when it was last saved', () => {
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE] } as unknown as ReturnType<typeof useCurrentCycles>);
    const draft = self('DRAFT');
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: { ...draft, assessment: { ...draft.assessment, lastSavedAt: '2026-10-05T06:30:00.000Z' } } } as unknown as ReturnType<typeof useSelfAssessment>);
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('Last saved 5 Oct 2026, 12:00 IST');
  });

  it('autosaves a section remark through the self-assessment remarks PATCH', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ sectionRemarks: [], lastSavedAt: '2026-10-07T06:35:00.000Z' });
    vi.mocked(useSaveSelfRemarks).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useSaveSelfRemarks>);
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE] } as unknown as ReturnType<typeof useCurrentCycles>);
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: { ...self('DRAFT'), sectionRemarks: [{ categoryId: 'c2', remark: 'Screening is thorough.' }] } } as unknown as ReturnType<typeof useSelfAssessment>);
    mount();
    expect(useSaveSelfRemarks).toHaveBeenLastCalledWith('cy1', 'DOMESTIC');
    await userEvent.type(screen.getByRole('textbox', { name: 'Remarks for Cargo handling' }), 'Our acceptance desk is quick.');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith([{ categoryId: 'c1', remark: 'Our acceptance desk is quick.' }]), { timeout: 2000 });
    // The saved remark of the other section is loaded, not re-sent.
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('textbox', { name: 'Remarks for Security' })).toHaveValue('Screening is thorough.');
    expect(mutateAsync).toHaveBeenCalledTimes(1);
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
    // Each section's remark, read-only, under its answers.
    expect(within(screen.getByRole('region', { name: 'Cargo handling' })).getByText('Acceptance is quick; paperwork could be lighter.')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Security' })).getByText('Screening is thorough.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('follows the assessment’s IMPORT_EXPORT mode, open and submitted', () => {
    current.mockReturnValue({ isPending: false, isError: false, data: [CYCLE] } as unknown as ReturnType<typeof useCurrentCycles>);
    const draft = self('DRAFT');
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: { ...draft, assessment: { ...draft.assessment, answerMode: 'IMPORT_EXPORT' } } } as unknown as ReturnType<typeof useSelfAssessment>);
    const { unmount } = mount();
    // Two questions in the first section, each rated for import and export.
    expect(screen.getAllByRole('radio')).toHaveLength(24);
    expect(screen.getByRole('radiogroup', { name: 'How would you rate shipment acceptance? — Export' })).toBeInTheDocument();
    // Each question has one optional comment shared by import and export.
    expect(screen.getAllByPlaceholderText('Add a comment (optional)')).toHaveLength(2);
    unmount();

    const submitted = self('SUBMITTED');
    const answers = COMPLETE.flatMap((a) => [{ ...a, direction: 'IMPORT' as const }, { ...a, direction: 'EXPORT' as const, rating: 2 as const, na: false }]);
    selfQuery.mockReturnValue({ isPending: false, isError: false, data: { ...submitted, assessment: { ...submitted.assessment, answerMode: 'IMPORT_EXPORT' }, answers } } as unknown as ReturnType<typeof useSelfAssessment>);
    mount();
    expect(screen.getAllByRole('group', { name: 'Import answer' })).toHaveLength(4);
    expect(screen.getAllByRole('group', { name: 'Export answer' })).toHaveLength(4);
    expect(screen.getAllByText('Fair')).toHaveLength(4);
    expect(screen.getAllByText('4/4')).toHaveLength(2);
  });
});
