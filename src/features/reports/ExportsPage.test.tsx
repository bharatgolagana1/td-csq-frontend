import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CYCLE_OPTIONS, CYCLE_OPTIONS_IMPORT_EXPORT } from '@/api/reports.fixtures';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(async () => null),
  forceRefreshToken: vi.fn(async () => false),
}));

import ExportsPage from './ExportsPage';
import { ACO_SESSION, mockApi, renderPage } from './testUtils';

const PATH = '/reports/exports';
const csv = () => new Response('level,code,mean\n', { status: 200, headers: { 'Content-Type': 'text/csv' } });

function exportCalls(fetchMock: ReturnType<typeof mockApi>): URL[] {
  return fetchMock.mock.calls.map(([input]) => new URL(String(input), 'http://localhost')).filter((u) => u.pathname.endsWith('/reports/export'));
}

beforeEach(() => {
  // jsdom has no object URLs and no navigation: the download itself is a no-op here.
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:csv'), configurable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ExportsPage', () => {
  it('exports a SINGLE cycle without a direction', async () => {
    const fetchMock = mockApi({ '/cycles': CYCLE_OPTIONS, '/reports/export': csv });
    renderPage(<ExportsPage />, { session: ACO_SESSION, path: PATH });
    const download = await screen.findByRole('button', { name: 'Download CSV' });
    await waitFor(() => expect(download).toBeEnabled());
    expect(screen.queryByRole('radiogroup', { name: 'Direction' })).toBeNull();
    expect(screen.queryByText('Direction')).toBeNull();

    await userEvent.click(download);
    expect(await screen.findByText('Downloaded csq-operator-CSQ-26H1-domestic.csv')).toBeInTheDocument();
    expect(exportCalls(fetchMock)[0]?.searchParams.has('direction')).toBe(false);
  });

  it('IMPORT_EXPORT: names and sends the direction, import unless export is picked', async () => {
    const fetchMock = mockApi({ '/cycles': CYCLE_OPTIONS_IMPORT_EXPORT, '/reports/export': csv });
    renderPage(<ExportsPage />, { session: ACO_SESSION, path: PATH });
    const switcher = await screen.findByRole('radiogroup', { name: 'Direction' });
    expect(within(switcher).getByRole('radio', { name: 'Import' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Direction').nextElementSibling).toHaveTextContent('Import');

    await userEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(await screen.findByText('Downloaded csq-operator-CSQ-26H1-domestic-import.csv')).toBeInTheDocument();
    expect(exportCalls(fetchMock)[0]?.searchParams.get('direction')).toBe('IMPORT');

    await userEvent.click(within(switcher).getByRole('radio', { name: 'Export' }));
    expect(screen.getByText('Direction').nextElementSibling).toHaveTextContent('Export');
    await userEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(await screen.findByText('Downloaded csq-operator-CSQ-26H1-domestic-export.csv')).toBeInTheDocument();
    expect(exportCalls(fetchMock)[1]?.searchParams.get('direction')).toBe('EXPORT');
  });
});
