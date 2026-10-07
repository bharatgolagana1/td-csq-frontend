import { forceRefreshToken, getAccessToken } from '@/auth/keycloak';

import { readSelectedOrg } from './selectedOrg';
import { type ListQuery, type Page } from './types';

/* fetch wrapper (ARCHITECTURE §5): base URL, bearer, x-csq-org, link token, JSON,
   AbortSignal, ApiError / NetworkError, one refresh-and-retry on 401. */

export type ApiErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'RATE_LIMITED'
  | 'LINK_EXPIRED'
  | 'OTP_INVALID'
  | 'INTERNAL'
  | (string & {});

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export class NetworkError extends Error {
  readonly offline: boolean;
  constructor(message = 'Could not reach the server', offline = typeof navigator !== 'undefined' && navigator.onLine === false) {
    super(message);
    this.name = 'NetworkError';
    this.offline = offline;
  }
}

export function isApiError(e: unknown, code?: ApiErrorCode): e is ApiError {
  return e instanceof ApiError && (code === undefined || e.code === code);
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof NetworkError) return e.offline ? 'You are offline' : e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

export function errorRequestId(e: unknown): string | undefined {
  return e instanceof ApiError ? e.requestId : undefined;
}

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** `x-csq-link-token` for the public participant/registration flows. */
  linkToken?: string;
  headers?: Record<string, string>;
};

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

type ErrorBody = { error?: { code?: string; message?: string; details?: unknown; requestId?: string } };

async function parseError(res: Response): Promise<ApiError> {
  let body: ErrorBody = {};
  try {
    body = (await res.json()) as ErrorBody;
  } catch {
    /* non-JSON error */
  }
  const requestId = body.error?.requestId ?? res.headers.get('x-request-id') ?? undefined;
  return new ApiError(res.status, body.error?.code ?? (res.status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL'), body.error?.message ?? `Request failed (${res.status})`, body.error?.details, requestId);
}

async function buildHeaders(opts: RequestOptions, hasBody: boolean): Promise<Headers> {
  const headers = new Headers(opts.headers);
  headers.set('Accept', 'application/json');
  if (hasBody) headers.set('Content-Type', 'application/json');
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const org = readSelectedOrg();
  if (org) headers.set('x-csq-org', org);
  if (opts.linkToken) headers.set('x-csq-link-token', opts.linkToken);
  return headers;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const hasBody = opts.body !== undefined;
  const headers = await buildHeaders(opts, hasBody);
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      credentials: 'omit',
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new NetworkError();
  }

  if (res.status === 401 && !retried) {
    const refreshed = await forceRefreshToken();
    if (refreshed) return request<T>(method, path, opts, true);
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  const json = JSON.parse(text) as { data?: T };
  return (json.data !== undefined ? json.data : json) as T;
}

/** Returns the full `{ data, meta }` envelope for [list] endpoints. */
async function list<T>(path: string, query?: ListQuery, opts: Omit<RequestOptions, 'query' | 'body'> = {}): Promise<Page<T>> {
  const hasBody = false;
  const headers = await buildHeaders(opts, hasBody);
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), { method: 'GET', headers, signal: opts.signal, credentials: 'omit' });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new NetworkError();
  }
  if (res.status === 401) {
    const refreshed = await forceRefreshToken();
    if (refreshed) {
      const retryHeaders = await buildHeaders(opts, hasBody);
      res = await fetch(buildUrl(path, query), { method: 'GET', headers: retryHeaders, signal: opts.signal, credentials: 'omit' });
    }
  }
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as Partial<Page<T>>;
  return { data: json.data ?? [], meta: json.meta ?? { page: 1, pageSize: json.data?.length ?? 0, total: json.data?.length ?? 0 } };
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>('PATCH', path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>('PUT', path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  list,
};
