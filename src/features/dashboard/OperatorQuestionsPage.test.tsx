import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CYCLE_OPTIONS, OPERATOR_QUESTIONS } from '@/api/reports.fixtures';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(async () => null),
  forceRefreshToken: vi.fn(async () => false),
}));

vi.mock('@/design/charts/echarts', () => ({
  echarts: {},
  ReactEChartsCore: () => <div data-testid="echart" />,
  baseOption: () => ({ tooltip: {}, legend: {} }),
  axisStyle: () => ({ axisLabel: {} }),
}));

import OperatorQuestionsPage from './OperatorQuestionsPage';
import { sortQuestions } from './QuestionsTable';
import { mockApi, PENDING, renderPage, SETTINGS } from './testUtils';

const ROUTE = { path: '/reports/operator/org-csc/questions?cycleId=c-26h1', routePath: '/reports/operator/:acoId/questions' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OperatorQuestionsPage', () => {
  it('shows table skeleton rows while loading', () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc/questions': PENDING });
    renderPage(<OperatorQuestionsPage />, ROUTE);
    expect(screen.getByRole('heading', { name: 'Questions' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Questions' })).toBeInTheDocument();
  });

  it('lists every question with its figures and filters by search and category', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc/questions': OPERATOR_QUESTIONS });
    renderPage(<OperatorQuestionsPage />, ROUTE);
    expect(await screen.findByText('Availability of truck docks at peak hours')).toBeInTheDocument();
    expect(screen.getByText('13 of 13 questions')).toBeInTheDocument();
    expect(screen.getByText('Suppressed')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'PRO');
    expect(await screen.findByText('4 of 13 questions')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Questions' });
    expect(within(table).queryByText('Availability of truck docks at peak hours')).toBeNull();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search questions' }), 'dwell');
    expect(await screen.findByText('1 of 13 questions')).toBeInTheDocument();
  });

  it('sorts by change with unknown deltas last', () => {
    const rows = sortQuestions(OPERATOR_QUESTIONS.questions, { id: 'delta', dir: 'desc' });
    expect(rows[0]?.code).toBe('CUS-1.1');
    expect(rows[rows.length - 1]?.code).toBe('CUS-1.2');
    const byComments = sortQuestions(OPERATOR_QUESTIONS.questions, { id: 'comments', dir: 'desc' });
    expect(byComments[0]?.code).toBe('PRO-1.1');
  });
});
