import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AIRPORT_OPTIONS, AIRPORT_REPORT, AIRPORT_REPORT_FOR_OPERATOR, CYCLE_OPTIONS } from '@/api/reports.fixtures';

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

import AirportReportPage from './AirportReportPage';
import { ACO_SESSION, AIRPORT_SESSION, mockApi, PENDING, PLATFORM_SESSION, renderPage } from './testUtils';

const PATH = '/reports/airport';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AirportReportPage', () => {
  it('shows a skeleton while loading', () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/airport/ap-del': PENDING });
    renderPage(<AirportReportPage />, { session: AIRPORT_SESSION, path: PATH });
    expect(screen.getByRole('heading', { name: 'Airport report' })).toBeInTheDocument();
    expect(screen.getByTestId('report-skeleton')).toBeInTheDocument();
  });

  it('shows the operators table and market-share weighting to airport users', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/airport/ap-del': AIRPORT_REPORT });
    renderPage(<AirportReportPage />, { session: AIRPORT_SESSION, path: PATH });
    expect(await screen.findByRole('heading', { name: 'Delhi · DEL' })).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent?.replace(/\s+/g, ' ').trim() === 'Rank 3 of 12')).toBeInTheDocument();
    expect(screen.getByText(/Market share applied · 100 %/)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Ranking' })).toBeInTheDocument();
    expect(screen.getByText('Cargo Service Center')).toBeInTheDocument();
    expect(screen.getByText('Çelebi Delhi Cargo')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Airport' })).toBeNull();
  });

  it('hides operator figures from an operator and says why', async () => {
    const fetchMock = mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/airport/ap-del': AIRPORT_REPORT_FOR_OPERATOR });
    renderPage(<AirportReportPage />, { session: ACO_SESSION, path: PATH });
    expect(await screen.findByText('Operator figures are shared with the airport and ACFI only')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Ranking' })).toBeNull();
    expect(screen.getByText(/Equal weights — no market-share snapshot · 55 %/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([input]) => String(input)).some((u) => u.includes('/reports/airport/ap-del'))).toBe(true);
  });

  it('lets platform users pick the airport', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/airports': AIRPORT_OPTIONS, '/reports/airport/ap-bom': { ...AIRPORT_REPORT, airport: { id: 'ap-bom', iata: 'BOM', name: 'Mumbai' } } });
    renderPage(<AirportReportPage />, { session: PLATFORM_SESSION, path: PATH });
    expect(await screen.findByRole('combobox', { name: 'Airport' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Mumbai · BOM' })).toBeInTheDocument();
  });

  it('shows an empty state without a reportable cycle', async () => {
    mockApi({ '/cycles': [] });
    renderPage(<AirportReportPage />, { session: AIRPORT_SESSION, path: PATH });
    expect(await screen.findByText('No cycle to report on yet')).toBeInTheDocument();
  });
});
