import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CYCLE_OPTIONS, NATIONAL_REPORT } from '@/api/reports.fixtures';

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

import NationalReportPage from './NationalReportPage';
import { mockApi, PENDING, renderPage } from './testUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NationalReportPage', () => {
  it('shows a skeleton while loading', () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/national': PENDING });
    renderPage(<NationalReportPage />);
    expect(screen.getByRole('heading', { name: 'National report' })).toBeInTheDocument();
    expect(screen.getByTestId('report-skeleton')).toBeInTheDocument();
  });

  it('renders the funnel, the airport and operator rankings and category averages', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/national': NATIONAL_REPORT });
    renderPage(<NationalReportPage />);
    expect(await screen.findByText('Participation')).toBeInTheDocument();
    expect(screen.getByText('1,040')).toBeInTheDocument();
    expect(screen.getByText('78 %')).toBeInTheDocument();
    const tables = screen.getAllByRole('table', { name: 'Ranking' });
    expect(tables).toHaveLength(2);
    const airports = tables[0];
    const operators = tables[1];
    if (!airports || !operators) throw new Error('expected two ranking tables');
    expect(within(airports).getByText('Mumbai')).toBeInTheDocument();
    expect(within(airports).getByText('1 / 12')).toBeInTheDocument();
    expect(within(operators).getByText('Mumbai Cargo Terminal')).toBeInTheDocument();
    expect(within(operators).getByText('2 · suppressed')).toBeInTheDocument();
    expect(screen.getByText('Category averages')).toBeInTheDocument();
  });

  it('shows an empty state without a reportable cycle', async () => {
    mockApi({ '/cycles': [] });
    renderPage(<NationalReportPage />);
    expect(await screen.findByText('No cycle to report on yet')).toBeInTheDocument();
  });

  it('offers the survey-type toggle for a BOTH cycle and requests it', async () => {
    const fetchMock = mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/national': NATIONAL_REPORT });
    renderPage(<NationalReportPage />, { path: '/reports/national?surveyType=INTERNATIONAL' });
    expect(await screen.findByRole('radio', { name: 'International' })).toHaveAttribute('aria-checked', 'true');
    await screen.findByText('Participation');
    const call = fetchMock.mock.calls.map(([input]) => String(input)).find((u) => u.includes('/reports/national'));
    expect(call).toContain('surveyType=INTERNATIONAL');
  });
});
