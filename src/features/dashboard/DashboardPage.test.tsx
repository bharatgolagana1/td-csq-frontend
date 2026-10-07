import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CYCLE_OPTIONS, OPERATOR_REPORT, OPERATOR_REPORT_PROVISIONAL, OPERATOR_REPORT_SUPPRESSED } from '@/api/reports.fixtures';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(async () => null),
  forceRefreshToken: vi.fn(async () => false),
}));

// jsdom has no canvas: the echarts surface is replaced by a marker element.
vi.mock('@/design/charts/echarts', () => ({
  echarts: {},
  ReactEChartsCore: () => <div data-testid="echart" />,
  baseOption: () => ({ tooltip: {}, legend: {} }),
  axisStyle: () => ({ axisLabel: {} }),
}));

import DashboardPage from './DashboardPage';
import { ACO_SESSION, mockApi, OPERATORS, PENDING, PLATFORM_SESSION, renderPage, SETTINGS } from './testUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DashboardPage', () => {
  it('shows the context strip and the layout skeleton while the report loads, with the confidentiality line', () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc': PENDING });
    renderPage(<DashboardPage />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText(/Shared with your organisation only/)).toBeInTheDocument();
    const strip = screen.getByRole('region', { name: 'Dashboard scope' });
    expect(within(strip).getByText('Cargo Service Quality')).toBeInTheDocument();
    expect(within(strip).getByText('Pan-India')).toBeInTheDocument();
    expect(within(strip).getByRole('combobox', { name: 'Cycle' })).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('shows an empty state when no cycle is reportable', async () => {
    const fetchMock = mockApi({ '/cycles': [], '/settings': SETTINGS, '/reports/operator/org-csc': OPERATOR_REPORT });
    renderPage(<DashboardPage />);
    expect(await screen.findByText('No cycle to report on yet')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/reports/operator'))).toBe(false);
  });

  it('renders the scored dashboard: hero, bands, paired bars and the ranking with the operator’s own airport highlighted', async () => {
    const fetchMock = mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc': OPERATOR_REPORT });
    renderPage(<DashboardPage />);

    // Hero: operator, airport, rating, rank pill, counts, FF / CB tiles.
    const hero = await screen.findByRole('region', { name: 'Selected operator' });
    expect(within(hero).getByRole('heading', { name: 'Cargo Service Center' })).toBeInTheDocument();
    expect(within(hero).getByText('Delhi · DEL')).toBeInTheDocument();
    expect(within(hero).getByText('Overall rating').parentElement).toHaveTextContent(/^4\.2/);
    expect(within(hero).getByText((_, el) => el?.tagName === 'SPAN' && el.textContent?.replace(/\s+/g, ' ').trim() === 'Rank 3 of 14')).toBeInTheDocument();
    expect(within(hero).getByText('129 assessments · 1 self · 128 customer')).toBeInTheDocument();
    expect(within(hero).getByTitle('vs CSQ 2025 H2')).toHaveTextContent('+0.3');
    expect(within(hero).getByText('Very good')).toBeInTheDocument();
    expect(within(hero).getByText('Freight forwarders')).toBeInTheDocument();
    expect(within(hero).getByText('Customs brokers')).toBeInTheDocument();

    // Feedback band: every band with count and share in the legend grid.
    expect(screen.getByText('3,250 answers across the questionnaire')).toBeInTheDocument();
    expect(screen.getByText('Excellent').closest('li')).toHaveTextContent('1,040 · 32 %');
    expect(screen.getByText('NA').closest('li')).toHaveTextContent('64 · 2 %');

    // Overall ratings: the honest caption while overall equals this cycle.
    expect(screen.getByText(/Overall = this cycle until more cycles are scored/)).toBeInTheDocument();

    // Category ratings: paired bars with value, delta chip and the self marker.
    expect(screen.getByText('6 categories · 23 parameters · customer rating against the previous cycle, self as a marker')).toBeInTheDocument();
    const bars = screen.getByRole('group', { name: 'Customer rating per category, current over previous, self as a marker' });
    expect(within(bars).getByText('Infrastructure & facilities')).toBeInTheDocument();
    expect(within(bars).getByRole('button', { name: 'Self 4.6' })).toBeInTheDocument();
    // Five deltas; the category new this cycle has no previous figure and no chip title.
    expect(within(bars).getAllByTitle('vs previous')).toHaveLength(5);
    expect(within(bars).getByText('Digital & information').closest('li')).toHaveTextContent('4.0');
    expect(within(bars).getByLabelText('No change figure vs previous')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Open sampling/ })).toHaveAttribute('href', '/sampling');
    expect(screen.getByRole('link', { name: /Question-level table/ })).toHaveAttribute('href', expect.stringContaining('/reports/operator/org-csc/questions'));

    // All-India: ranked rows, own row highlighted, the unranked airports in the footnote.
    const ranking = screen.getByRole('table', { name: 'Ranking' });
    expect(within(ranking).getAllByRole('row')).toHaveLength(13);
    const own = within(ranking).getByText('Delhi').closest('tr');
    expect(own).toHaveClass('highlight');
    expect(own).toHaveAttribute('aria-current', 'true');
    expect(within(own as HTMLElement).getByText('You')).toBeInTheDocument();
    expect(within(ranking).getByText('Mumbai').closest('tr')).not.toHaveClass('highlight');
    expect(within(ranking).queryByText('Kolkata')).toBeNull();
    expect(screen.getByText('Kolkata, Nagpur live under Phase I · not rated this cycle')).toBeInTheDocument();
    expect(screen.getByText(/other operators’ figures are never shared/)).toBeInTheDocument();
    expect(screen.queryByText('Provisional')).toBeNull();

    // The selection the cycle list resolved (newest SCORED) is what was requested.
    const reportCall = fetchMock.mock.calls.map(([input]) => String(input)).find((u) => u.includes('/reports/operator/org-csc'));
    expect(reportCall).toContain('cycleId=c-26h1');
    expect(reportCall).toContain('surveyType=DOMESTIC');
  });

  it('switches the category card between levels and the table twin', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc': OPERATOR_REPORT });
    renderPage(<DashboardPage />);
    await screen.findByRole('region', { name: 'Selected operator' });

    await userEvent.click(screen.getByRole('radio', { name: 'Subcategories' }));
    const bars = screen.getByRole('group', { name: /Customer rating per category/ });
    expect(within(bars).getAllByRole('listitem')).toHaveLength(23);
    expect(within(bars).getByText('Truck docks & parking')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Table' }));
    const table = screen.getByRole('table', { name: 'Category ratings' });
    expect(within(table).getAllByRole('row')).toHaveLength(24);
    expect(within(table).getByText('Truck docks & parking')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Customer rating per category/ })).toBeNull();
  });

  it('explains a suppressed score with the minimum from settings', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc': OPERATOR_REPORT_SUPPRESSED });
    renderPage(<DashboardPage />);
    expect(await screen.findByText(/Not enough customer responses to publish a score/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/minimum/).textContent).toContain('3'));
    expect(screen.getAllByText('Suppressed').length).toBeGreaterThan(0);
    expect(screen.getByText('No answers to show')).toBeInTheDocument();
  });

  it('flags a live cycle as provisional', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc': OPERATOR_REPORT_PROVISIONAL });
    renderPage(<DashboardPage />, { path: '/dashboard?cycleId=c-26h2' });
    expect(await screen.findByText('41 assessments · 0 self · 41 customer')).toBeInTheDocument();
    expect(screen.getAllByText('Provisional').length).toBeGreaterThan(1);
    expect(screen.getByText('Not ranked')).toBeInTheDocument();
    expect(screen.getByText('Ranked once the cycle is scored')).toBeInTheDocument();
  });

  it('shows the request id and a retry on failure', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS });
    renderPage(<DashboardPage />);
    expect(await screen.findByText('No figures for this selection')).toBeInTheDocument();
    expect(screen.getByText(/req_test/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });

  it('gives platform users an operator selector and follows it', async () => {
    mockApi({
      '/cycles': CYCLE_OPTIONS,
      '/settings': SETTINGS,
      '/operators': OPERATORS,
      '/reports/operator/org-csc': OPERATOR_REPORT,
      '/reports/operator/org-celebi': {
        ...OPERATOR_REPORT,
        operator: { ...OPERATOR_REPORT.operator, id: 'org-celebi', name: 'Çelebi Delhi Cargo' },
        overall: { ...OPERATOR_REPORT.overall, customer: { mean: 4.0, n: 102 } },
        assessments: { total: 103, customer: 102, self: 1 },
      },
    });
    renderPage(<DashboardPage />, { session: PLATFORM_SESSION });
    const select = await screen.findByRole('combobox', { name: 'Operator' });
    expect(await screen.findByText('129 assessments · 1 self · 128 customer')).toBeInTheDocument();
    expect(screen.queryByText(/Shared with your organisation only/)).toBeNull();

    await userEvent.selectOptions(select, 'org-celebi');
    expect(await screen.findByText('103 assessments · 1 self · 102 customer')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Çelebi Delhi Cargo' })).toBeInTheDocument();
  });

  it('keeps ACO users on their own operator without a selector', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/settings': SETTINGS, '/reports/operator/org-csc': OPERATOR_REPORT });
    renderPage(<DashboardPage />, { session: ACO_SESSION, path: '/dashboard?acoId=org-celebi' });
    expect(await screen.findByText('129 assessments · 1 self · 128 customer')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Operator' })).toBeNull();
  });
});
