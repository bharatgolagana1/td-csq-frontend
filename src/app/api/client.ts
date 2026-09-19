import keycloak from '../features/keyCloak/KeyCloak';

/**
 * The single HTTP client. Every call goes through here so the base URL, the
 * bearer token and the error envelope are handled in one place rather than
 * rediscovered per feature.
 */
const BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

export type ApiErrorCode =
  | 'VALIDATION_FAILED' | 'UNAUTHENTICATED' | 'TOKEN_EXPIRED' | 'FORBIDDEN'
  | 'CONSENT_REQUIRED' | 'NOT_FOUND' | 'CONFLICT' | 'PRECONDITION_FAILED'
  | 'WINDOW_CLOSED' | 'WINDOW_NOT_OPEN' | 'RATE_LIMITED' | 'INTERNAL'
  | 'NETWORK';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number,
    /** Quote this to support: it ties a user's report to one server log line. */
    readonly requestId?: string,
    readonly fields?: ReadonlyArray<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /**
   * A sampled assessor has no Keycloak session: their signed link IS the
   * session. Passing a link token switches the call to that credential and
   * deliberately sends no bearer token.
   */
  linkToken?: string;
  signal?: AbortSignal;
}

async function authHeader(linkToken?: string): Promise<Record<string, string>> {
  if (linkToken) return { 'x-csq-link-token': linkToken };
  if (!keycloak.authenticated || !keycloak.token) return {};
  // refresh before expiry rather than waiting for a 401 and retrying
  try {
    await keycloak.updateToken(30);
  } catch {
    // an unrefreshable token is a dead session; let the 401 path handle it
  }
  return { Authorization: `Bearer ${keycloak.token}` };
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, query, linkToken, signal } = opts;

  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      signal,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(await authHeader(linkToken)),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    // a failed fetch is the network, not the API, and must not read as a 500
    throw new ApiError('NETWORK', 'Could not reach the server.', 0, undefined);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const env = parsed as
      | { error?: { code?: string; message?: string; requestId?: string; fields?: Array<{ path: string; message: string }> } }
      | undefined;
    const e = env?.error;
    throw new ApiError(
      (e?.code as ApiErrorCode) ?? 'INTERNAL',
      e?.message ?? res.statusText,
      res.status,
      e?.requestId,
      e?.fields,
    );
  }

  return parsed as T;
}

/**
 * A 404 on a tenant-scoped resource means it does not exist FOR YOU. The API
 * returns it deliberately in place of a 403 so list endpoints cannot be used to
 * enumerate other operators' identifiers, which means the UI must not translate
 * it into a permissions message.
 */
export function isMissing(e: unknown): boolean {
  return e instanceof ApiError && e.code === 'NOT_FOUND';
}

export function isForbidden(e: unknown): boolean {
  return e instanceof ApiError && e.code === 'FORBIDDEN';
}
