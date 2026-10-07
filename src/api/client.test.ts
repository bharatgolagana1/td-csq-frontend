import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const keycloakMock = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => Promise<string | null>>(),
  forceRefreshToken: vi.fn<() => Promise<boolean>>(),
}));

vi.mock('@/auth/keycloak', () => keycloakMock);
vi.mock('./selectedOrg', () => ({ readSelectedOrg: () => 'org-csc', writeSelectedOrg: () => undefined }));

import { api, ApiError, buildUrl, NetworkError } from './client';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

describe('api client', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    keycloakMock.getAccessToken.mockResolvedValue('tok_1');
    keycloakMock.forceRefreshToken.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds URLs with the base and a query, skipping empty values', () => {
    expect(buildUrl('/users', { page: 2, q: '', status: undefined, active: true })).toBe('http://localhost:4000/api/v1/users?page=2&active=true');
    expect(buildUrl('me')).toBe('http://localhost:4000/api/v1/me');
  });

  it('sends bearer, x-csq-org and link token headers and unwraps { data }', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { id: 'u1' } }));
    const result = await api.get<{ id: string }>('/me', { linkToken: 'lnk_9' });
    expect(result).toEqual({ id: 'u1' });
    const [, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer tok_1');
    expect(headers.get('x-csq-org')).toBe('org-csc');
    expect(headers.get('x-csq-link-token')).toBe('lnk_9');
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('serialises JSON bodies', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { data: { ok: true } }));
    await api.post('/users', { body: { name: 'A' } });
    const [, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"A"}');
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });

  it('throws ApiError with code, message and requestId', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: { code: 'FORBIDDEN', message: 'No CSQ account for this sign-in', requestId: 'req_7' } }));
    const err = await api.get('/me').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const apiErr = err as ApiError;
    expect(apiErr.code).toBe('FORBIDDEN');
    expect(apiErr.status).toBe(403);
    expect(apiErr.requestId).toBe('req_7');
    expect(apiErr.message).toBe('No CSQ account for this sign-in');
  });

  it('throws NetworkError when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(api.get('/me')).rejects.toBeInstanceOf(NetworkError);
  });

  it('refreshes the token once on 401 and retries', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: { code: 'UNAUTHENTICATED', message: 'expired' } }));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { id: 'u1' } }));
    keycloakMock.forceRefreshToken.mockResolvedValueOnce(true);
    keycloakMock.getAccessToken.mockResolvedValueOnce('tok_1').mockResolvedValueOnce('tok_2');

    const result = await api.get<{ id: string }>('/me');
    expect(result).toEqual({ id: 'u1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, retryInit] = fetchMock.mock.calls[1] as [RequestInfo, RequestInit];
    expect(new Headers(retryInit.headers).get('Authorization')).toBe('Bearer tok_2');
  });

  it('does not retry twice when the refresh fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: { code: 'UNAUTHENTICATED', message: 'expired' } }));
    await expect(api.get('/me')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns { data, meta } for lists', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: [{ id: 1 }], meta: { page: 1, pageSize: 25, total: 1 } }));
    const page = await api.list<{ id: number }>('/users', { q: 'a' });
    expect(page.meta.total).toBe(1);
    expect(page.data).toHaveLength(1);
    expect(String((fetchMock.mock.calls[0] as [string])[0])).toContain('/users?q=a');
  });
});
