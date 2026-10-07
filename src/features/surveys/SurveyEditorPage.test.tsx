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

import { draftTree, previewForm, publishedTree, question } from './fixtures';
import { mocked, mockGets, renderSurveys, VIEWER } from './testHarness';

beforeEach(() => {
  vi.clearAllMocks();
});

const Q1_ROW = { name: /Availability of adequate cargo infrastructure/ };

describe('SurveyEditorPage', () => {
  it('shows the skeleton, then the not-found state', async () => {
    mocked().get.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Survey not found', undefined, 'req_7'));
    renderSurveys('/surveys/nope');
    expect(await screen.findByText('Survey version not found')).toBeInTheDocument();
    expect(screen.getByText('req_7')).toBeInTheDocument();
  });

  it('renders a draft: header, tree and the empty editor', async () => {
    mockGets({ '/surveys/s3': draftTree() });
    renderSurveys('/surveys/s3');
    expect(await screen.findByRole('heading', { name: 'Domestic survey' })).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INFRA Infrastructure and facilities/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SCREEN Screening/ })).toBeInTheDocument();
    expect(screen.getByRole('button', Q1_ROW)).toBeInTheDocument();
    expect(screen.getByText('Nothing selected')).toBeInTheDocument();
  });

  it('opens a question from a deep link, saves an edit and maps server validation onto the field', async () => {
    mockGets({ '/surveys/s3': draftTree() });
    const q1 = draftTree().categories[0]?.questions[0];
    mocked().patch.mockResolvedValueOnce(question({ ...q1, id: 'q1', categoryId: 'c1', code: 'ACFI.INFRA.CARGO_STORAGE_CAPACITY', text: 'Adequate cargo infrastructure', order: 1 }));
    renderSurveys('/surveys/s3?node=question:q1');

    const form = within(await screen.findByRole('form', { name: 'Question ACFI.INFRA.CARGO_STORAGE_CAPACITY' }));
    expect(form.getByRole('button', { name: 'Save' })).toBeDisabled();
    const text = form.getByLabelText(/^Question/);
    await userEvent.clear(text);
    await userEvent.type(text, 'Adequate cargo infrastructure');
    await userEvent.click(form.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mocked().patch).toHaveBeenCalledTimes(1));
    const [path, opts] = mocked().patch.mock.calls[0] ?? [];
    expect(path).toBe('/surveys/s3/questions/q1');
    expect(opts?.body).toMatchObject({ text: 'Adequate cargo infrastructure', categoryId: 'c1', subcategoryId: null, help: 'Storage areas and warehouses.', stakeholderTypes: ['FF', 'CB'] });

    // A zod VALIDATION error lands on its field; a CONFLICT lands on the code.
    mocked().patch.mockRejectedValueOnce(new ApiError(400, 'VALIDATION', 'Invalid body', { in: 'body', issues: [{ path: 'code', message: 'must be 1-80 characters' }] }, 'req_1'));
    await userEvent.type(form.getByLabelText(/^Code/), 'X');
    await userEvent.click(form.getByRole('button', { name: 'Save' }));
    expect(await form.findByText('must be 1-80 characters')).toBeInTheDocument();

    mocked().patch.mockRejectedValueOnce(new ApiError(409, 'CONFLICT', 'Question code ACFI.INFRA.USER_AMENITIES already exists in this survey'));
    await userEvent.click(form.getByRole('button', { name: 'Save' }));
    expect(await form.findByText('Question code ACFI.INFRA.USER_AMENITIES already exists in this survey')).toBeInTheDocument();
  });

  it('asks before discarding a dirty form', async () => {
    mockGets({ '/surveys/s3': draftTree() });
    renderSurveys('/surveys/s3');
    await userEvent.click(await screen.findByRole('button', Q1_ROW));
    const form = within(await screen.findByRole('form', { name: 'Question ACFI.INFRA.CARGO_STORAGE_CAPACITY' }));
    await userEvent.type(form.getByLabelText(/^Question/), ' and more');
    await userEvent.click(screen.getByRole('button', { name: /User amenities/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Discard unsaved changes?' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('form', { name: 'Question ACFI.INFRA.CARGO_STORAGE_CAPACITY' })).toBeInTheDocument();
  });

  it('moves a question with the keyboard buttons and saves the order in one PUT', async () => {
    mockGets({ '/surveys/s3': draftTree() });
    mocked().put.mockResolvedValue(draftTree());
    renderSurveys('/surveys/s3');
    await userEvent.click(await screen.findByRole('button', { name: 'Move question USER_AMENITIES up' }));
    expect(screen.getByText('Order changed in 1 group · not saved')).toBeInTheDocument();
    const rows = within(screen.getAllByRole('list', { name: 'Questions' })[0] as HTMLElement).getAllByRole('button', { name: /Availability|User amenities/ });
    expect(rows[0]).toHaveAccessibleName(/User amenities/);

    await userEvent.click(screen.getByRole('button', { name: 'Save order' }));
    await waitFor(() => expect(mocked().put).toHaveBeenCalledTimes(1));
    const [path, opts] = mocked().put.mock.calls[0] ?? [];
    expect(path).toBe('/surveys/s3/order');
    expect(opts?.body).toEqual({
      categories: [
        { id: 'c1', order: 1, questions: [{ id: 'q2', order: 1 }, { id: 'q1', order: 2 }], subcategories: [] },
        { id: 'c2', order: 2, questions: [], subcategories: [{ id: 'sub1', order: 1, questions: [{ id: 'q3', order: 1 }, { id: 'q4', order: 2 }] }] },
      ],
    });
    await waitFor(() => expect(screen.queryByText(/not saved/)).toBeNull());
  });

  it('lists what blocks publishing and disables the confirm', async () => {
    mockGets({ '/surveys/s3': draftTree({ issues: [{ path: 'categories', message: 'categories weights must total 100 (got 90)' }] }) });
    renderSurveys('/surveys/s3');
    await userEvent.click(await screen.findByRole('button', { name: 'Publish' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Publish v3?' }));
    expect(dialog.getByText('categories weights must total 100 (got 90)')).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Publish' })).toBeDisabled();
    expect(mocked().post).not.toHaveBeenCalled();
  });

  it('publishes a clean draft after confirmation', async () => {
    mockGets({ '/surveys/s3': draftTree() });
    mocked().post.mockResolvedValue({ ...draftTree().survey, status: 'PUBLISHED', publishedAt: '2026-10-07T10:00:00.000Z' });
    renderSurveys('/surveys/s3');
    await userEvent.click(await screen.findByRole('button', { name: 'Publish' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Publish v3?' }));
    expect(dialog.getByText(/Ready to publish/)).toBeInTheDocument();
    expect(dialog.getByText(/3 of 4/)).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(mocked().post.mock.calls[0]?.[0]).toBe('/surveys/s3/publish'));
    expect(await screen.findByText('Domestic v3 published')).toBeInTheDocument();
  });

  it('renders a published version read-only with "Edit as new draft"', async () => {
    mockGets({ '/surveys/s2': publishedTree(), '/surveys/s3': draftTree() });
    mocked().post.mockRejectedValue(new ApiError(409, 'CONFLICT', 'DOMESTIC already has a draft (version 3)', { draftId: 's3' }));
    renderSurveys('/surveys/s2');
    expect(await screen.findByText('Domestic v2 is published and read-only.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Move / })).toBeNull();

    await userEvent.click(screen.getByRole('button', Q1_ROW));
    const form = within(await screen.findByRole('form', { name: 'Question ACFI.INFRA.CARGO_STORAGE_CAPACITY' }));
    expect(form.getByLabelText(/^Question/)).toBeDisabled();
    expect(form.queryByRole('button', { name: 'Save' })).toBeNull();

    // The API allows one draft per type: a conflict opens the existing one.
    await userEvent.click(screen.getByRole('button', { name: 'Edit as new draft' }));
    expect(await screen.findByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('keeps a draft read-only for a viewer', async () => {
    mockGets({ '/surveys/s3': draftTree() });
    renderSurveys('/surveys/s3', VIEWER);
    expect(await screen.findByText('You can view this draft but not change it.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Category' })).toBeNull();
  });

  it('previews the form per stakeholder type', async () => {
    mocked().get.mockImplementation(async (path, opts) => {
      if (path === '/surveys/s3') return draftTree();
      if (path === '/surveys/s3/preview') return { ...previewForm(), stakeholderType: opts?.query?.stakeholderType };
      throw new Error(`Unmocked GET ${path}`);
    });
    renderSurveys('/surveys/s3');
    await userEvent.click(await screen.findByRole('button', { name: 'Preview' }));
    const drawer = within(await screen.findByRole('dialog', { name: 'Preview' }));
    expect(await drawer.findByText('3 questions · scale Poor / Fair / Good / Very Good / Excellent + NA')).toBeInTheDocument();
    expect(drawer.getByText('On Fair or Poor: What slowed it down?')).toBeInTheDocument();
    await userEvent.click(drawer.getByRole('tab', { name: 'Customs brokers' }));
    await waitFor(() => expect(mocked().get).toHaveBeenCalledWith('/surveys/s3/preview', expect.objectContaining({ query: { stakeholderType: 'CB' } })));
  });
});
