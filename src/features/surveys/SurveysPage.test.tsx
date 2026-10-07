import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({
  keycloak: { authenticated: false, tokenParsed: undefined },
  initKeycloak: vi.fn(),
  signOutKeycloak: vi.fn(),
  startTokenRefresh: () => () => undefined,
  getAccessToken: vi.fn(),
  forceRefreshToken: vi.fn(),
}));
vi.mock('@/api/client', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  return { ...mod, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), list: vi.fn() } };
});

import { ApiError } from '@/api/client';

import { draftTree, publishedTree, surveyList } from './fixtures';
import { mocked, mockGets, renderSurveys, VIEWER } from './testHarness';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SurveysPage', () => {
  it('shows skeleton cards while loading', () => {
    mocked().get.mockImplementation(() => new Promise(() => undefined));
    renderSurveys('/surveys');
    expect(screen.getByRole('heading', { name: 'Surveys' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loading surveys')).toBeInTheDocument();
  });

  it('shows the error with its request id and retries', async () => {
    mocked().get.mockRejectedValueOnce(new ApiError(500, 'INTERNAL', 'Database unavailable', undefined, 'req_42'));
    mockGets({ '/surveys': surveyList(), '/surveys/s2': publishedTree(), '/surveys/s3': draftTree() });
    renderSurveys('/surveys');
    expect(await screen.findByText('Could not load surveys')).toBeInTheDocument();
    expect(screen.getByText(/Database unavailable/)).toBeInTheDocument();
    expect(screen.getByText('req_42')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('article', { name: 'Domestic survey' })).toBeInTheDocument();
  });

  it('renders one card per type with versions, counts per head and the right actions', async () => {
    mockGets({ '/surveys': surveyList(), '/surveys/s2': publishedTree(), '/surveys/s3': draftTree() });
    renderSurveys('/surveys');

    const domestic = within(await screen.findByRole('article', { name: 'Domestic survey' }));
    expect(domestic.getByText(/v2 · 23 questions/)).toBeInTheDocument();
    expect(domestic.getByText(/Published 2 Oct 2026, 14:30 IST/)).toBeInTheDocument();
    expect(domestic.getByText(/v3 · 4 questions/)).toBeInTheDocument();
    expect(domestic.getByRole('button', { name: 'Open published' })).toBeInTheDocument();
    expect(domestic.getByRole('button', { name: 'Edit draft' })).toBeInTheDocument();
    expect(domestic.getByText('Earlier versions (1)')).toBeInTheDocument();

    // Per-head active counts come from the trees: INFRA 2 (both), SEC 1 (one inactive question).
    const infra = (await domestic.findByRole('row', { name: /INFRA/ })).querySelectorAll('td');
    expect(Array.from(infra).map((td) => td.textContent)).toEqual(['INFRA', 'Infrastructure and facilities', '2', '2']);
    const sec = domestic.getByRole('row', { name: /SEC/ }).querySelectorAll('td');
    expect(Array.from(sec).map((td) => td.textContent)).toEqual(['SEC', 'Security and safety', '1', '1']);

    const international = within(screen.getByRole('article', { name: 'International survey' }));
    expect(international.getByText('Nothing published yet')).toBeInTheDocument();
    expect(international.getByText('No draft')).toBeInTheDocument();
    expect(international.getByRole('button', { name: 'Create draft' })).toBeInTheDocument();
  });

  it('creates the first draft of a type and opens it', async () => {
    const created = draftTree({ survey: { ...draftTree().survey, id: 's9', code: 'INTERNATIONAL', name: 'International Cargo Service Quality Survey', version: 1 } });
    mockGets({ '/surveys': surveyList(), '/surveys/s2': publishedTree(), '/surveys/s3': draftTree(), '/surveys/s9': created });
    mocked().post.mockResolvedValue(created);
    renderSurveys('/surveys');

    const international = within(await screen.findByRole('article', { name: 'International survey' }));
    await userEvent.click(international.getByRole('button', { name: 'Create draft' }));
    await waitFor(() => expect(mocked().post).toHaveBeenCalledWith('/surveys/INTERNATIONAL/versions', { body: {} }));
    expect(await screen.findByRole('heading', { name: 'International survey' })).toBeInTheDocument();
  });

  it('hides editing actions from a viewer', async () => {
    mockGets({ '/surveys': surveyList(), '/surveys/s2': publishedTree(), '/surveys/s3': draftTree() });
    renderSurveys('/surveys', VIEWER);
    const domestic = within(await screen.findByRole('article', { name: 'Domestic survey' }));
    expect(domestic.getByRole('button', { name: 'Open draft' })).toBeInTheDocument();
    expect(domestic.queryByRole('button', { name: 'Edit draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create draft' })).toBeNull();
  });
});
