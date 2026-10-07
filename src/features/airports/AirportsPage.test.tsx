import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AirportDetailPage from './AirportDetailPage';
import AirportsPage from './AirportsPage';
import { apiError, BOM, CLB, CSC, data, DEL, DEL_DETAIL, list, mockApi, never, renderPage } from './testUtils';

afterEach(() => vi.unstubAllGlobals());

describe('AirportsPage', () => {
  it('shows skeleton rows while loading', () => {
    mockApi([{ method: 'GET', path: /^\/airports$/, reply: never }, { method: 'GET', path: /^\/operators$/, reply: never }]);
    renderPage(<AirportsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Airports' })).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows the empty state with the one primary action', async () => {
    mockApi([{ method: 'GET', path: /^\/airports$/, reply: () => list([]) }, { method: 'GET', path: /^\/operators$/, reply: () => list([]) }]);
    renderPage(<AirportsPage />);
    expect(await screen.findByText('No airports match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add the first airport' })).toBeInTheDocument();
  });

  it('renders rows with the active pill and the operator count, and filters by region', async () => {
    const { calls } = mockApi([
      { method: 'GET', path: /^\/airports$/, reply: ({ url }) => list(url.searchParams.get('region') === 'West' ? [BOM] : [DEL, BOM]) },
      { method: 'GET', path: /^\/operators$/, reply: () => list([CSC, CLB]) },
    ]);
    renderPage(<AirportsPage />);
    const del = (await screen.findByRole('link', { name: DEL.name })).closest('tr');
    expect(del).not.toBeNull();
    expect(within(del as HTMLElement).getByText('DEL')).toBeInTheDocument();
    expect(within(del as HTMLElement).getByText('Active')).toBeInTheDocument();
    expect(await within(del as HTMLElement).findByText('2')).toBeInTheDocument();
    expect(screen.getByText('2 airports')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Region' }), 'West');
    expect(await screen.findByText('1 airport')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: DEL.name })).toBeNull();
    expect(calls.some((c) => c.path === '/airports' && c.url.searchParams.get('region') === 'West')).toBe(true);
  });

  it('shows the error state with the request id and a retry', async () => {
    mockApi([{ method: 'GET', path: /^\/airports$/, reply: () => apiError(500, 'INTERNAL', 'Database unavailable') }, { method: 'GET', path: /^\/operators$/, reply: () => list([]) }]);
    renderPage(<AirportsPage />);
    expect(await screen.findByText('Could not load airports')).toBeInTheDocument();
    expect(screen.getByText('req_abc123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('opens the create drawer and posts the airport', async () => {
    const { calls } = mockApi([
      { method: 'GET', path: /^\/airports$/, reply: () => list([]) },
      { method: 'GET', path: /^\/operators$/, reply: () => list([]) },
      { method: 'POST', path: /^\/airports$/, reply: ({ body }) => data({ ...DEL, ...(body as object) }, 201) },
    ]);
    renderPage(<AirportsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add airport' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add airport' });
    await userEvent.type(within(dialog).getByLabelText(/IATA code/), 'del');
    await userEvent.type(within(dialog).getByLabelText(/Airport name/), DEL.name);
    await userEvent.type(within(dialog).getByLabelText(/City/), 'New Delhi');
    await userEvent.type(within(dialog).getByLabelText(/State/), 'Delhi');
    await userEvent.type(within(dialog).getByLabelText(/Latitude/), '28.5562');
    await userEvent.type(within(dialog).getByLabelText(/Longitude/), '77.1');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add airport' }));
    expect(await screen.findByText(`${DEL.name} added`)).toBeInTheDocument();
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toMatchObject({ iata: 'DEL', name: DEL.name, lat: 28.5562, lng: 77.1, active: true, icao: null });
  });
});

describe('AirportDetailPage', () => {
  it('renders the airport, its operators and the share total', async () => {
    mockApi([{ method: 'GET', path: /^\/airports\/ap-del$/, reply: () => data(DEL_DETAIL) }]);
    renderPage(<AirportDetailPage />, { route: '/airports/ap-del', path: '/airports/:id' });
    expect(await screen.findByRole('heading', { level: 1, name: DEL.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargo Service Center' })).toBeInTheDocument();
    expect(screen.getByText('Totals 100 %')).toBeInTheDocument();
    expect(screen.getByText('2 at this airport')).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown id', async () => {
    mockApi([{ method: 'GET', path: /^\/airports\/nope$/, reply: () => apiError(404, 'NOT_FOUND', 'Airport not found') }]);
    renderPage(<AirportDetailPage />, { route: '/airports/nope', path: '/airports/:id' });
    expect(await screen.findByText('Airport not found')).toBeInTheDocument();
  });
});
