import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { COMPARISON_REPORT, CYCLE_OPTIONS, CYCLE_OPTIONS_IMPORT_EXPORT } from '@/api/reports.fixtures';
import { type ComparisonReport } from '@/api/reports.types';

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

import ComparisonPage from './ComparisonPage';
import { ACO_SESSION, mockApi, renderPage } from './testUtils';

const PATH = '/reports/comparison';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ComparisonPage', () => {
  it('compares the two newest cycles side by side with deltas', async () => {
    const fetchMock = mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/comparison': COMPARISON_REPORT });
    renderPage(<ComparisonPage />, { session: ACO_SESSION, path: PATH });

    expect(await screen.findByText('Side by side')).toBeInTheDocument();
    expect(screen.getByText(/Shared with your organisation only/)).toBeInTheDocument();
    // Overall: 3.85 → 4.15.
    expect(screen.getByTitle('overall change, later minus earlier cycle')).toHaveTextContent('+0.3');
    expect(screen.getByText(/Rank 5 of 13/)).toBeInTheDocument();
    expect(screen.getByText(/Rank 3 of 14/)).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Comparison · categories' });
    const pro = within(table).getByText('Processes & turnaround').closest('tr');
    if (!pro) throw new Error('row missing');
    // 3.52 → 3.74: +0.22, shown to 1 dp like every rating.
    expect(within(pro).getByTitle('later minus earlier cycle')).toHaveTextContent('+0.2');
    const columns = within(table).getAllByRole('columnheader').map((th) => th.textContent);
    expect(columns.indexOf('CSQ 2025 H2')).toBeLessThan(columns.indexOf('CSQ 2026 H1'));

    const call = fetchMock.mock.calls.map(([input]) => String(input)).find((u) => u.includes('/reports/comparison'));
    expect(call).toContain('acoId=org-csc');
    expect(call).toContain('cycleIds=c-26h1%2Cc-25h2');
    expect(call).not.toContain('direction=');
    expect(screen.queryByRole('radiogroup', { name: 'Direction' })).toBeNull();
  });

  it('names the direction each cycle resolved to under its column, when it has one', async () => {
    const withDirection = (direction: 'IMPORT' | 'EXPORT'): ComparisonReport => ({
      ...COMPARISON_REPORT,
      cycles: COMPARISON_REPORT.cycles.map((c) => (c.id === 'c-26h1' ? { ...c, answerMode: 'IMPORT_EXPORT', direction } : c)),
    });
    const fetchMock = mockApi({ '/cycles': CYCLE_OPTIONS_IMPORT_EXPORT, '/reports/comparison': (url: URL) => withDirection(url.searchParams.get('direction') === 'EXPORT' ? 'EXPORT' : 'IMPORT') });
    renderPage(<ComparisonPage />, { session: ACO_SESSION, path: PATH });
    const table = await screen.findByRole('table', { name: 'Comparison · categories' });
    const columns = within(table).getAllByRole('columnheader').map((th) => th.textContent);
    expect(columns).toContain('CSQ 2025 H2');
    expect(columns).toContain('CSQ 2026 H1Import');

    const switcher = screen.getByRole('radiogroup', { name: 'Direction' });
    expect(within(switcher).getByRole('radio', { name: 'Import' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(within(switcher).getByRole('radio', { name: 'Export' }));
    await waitFor(() => expect(within(screen.getByRole('table', { name: 'Comparison · categories' })).getAllByRole('columnheader').map((th) => th.textContent)).toContain('CSQ 2026 H1Export'));
    const calls = fetchMock.mock.calls.map(([input]) => String(input)).filter((u) => u.includes('/reports/comparison'));
    expect(calls[0]).not.toContain('direction=');
    expect(calls.at(-1)).toContain('direction=EXPORT');
  });

  it('switches level to questions', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/comparison': COMPARISON_REPORT });
    renderPage(<ComparisonPage />, { session: ACO_SESSION, path: PATH });
    await screen.findByText('Side by side');
    await userEvent.click(screen.getByRole('radio', { name: 'Questions' }));
    expect(await screen.findByRole('table', { name: 'Comparison · questions' })).toBeInTheDocument();
    expect(screen.getByText('Dwell time from landing to delivery')).toBeInTheDocument();
  });

  it('needs two cycles', async () => {
    mockApi({ '/cycles': CYCLE_OPTIONS.slice(1, 2), '/reports/comparison': COMPARISON_REPORT });
    renderPage(<ComparisonPage />, { session: ACO_SESSION, path: PATH });
    expect(await screen.findByText('Two cycles are needed')).toBeInTheDocument();
  });
});
