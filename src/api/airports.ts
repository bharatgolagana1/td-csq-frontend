import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/auth/keycloak';

import { type Airport, type AirportDetail, type AirportImportResult, type CreateAirportInput, type PatchAirportInput } from './airports.types';
import { api, ApiError, buildUrl, NetworkError } from './client';
import { readSelectedOrg } from './selectedOrg';
import { type ListQuery } from './types';

/* airports module hooks (§6 airports). Keys: ['airports', ...]. */

export const airportKeys = {
  all: ['airports'] as const,
  list: (query: ListQuery) => ['airports', 'list', query] as const,
  detail: (id: string) => ['airports', id] as const,
};

export function useAirports(query: ListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: airportKeys.list(query),
    queryFn: ({ signal }) => api.list<Airport>('/airports', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAirport(id: string | undefined) {
  return useQuery({
    queryKey: airportKeys.detail(id ?? ''),
    queryFn: ({ signal }) => api.get<AirportDetail>(`/airports/${id}`, { signal }),
    enabled: Boolean(id),
  });
}

export function useCreateAirport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAirportInput) => api.post<Airport>('/airports', { body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: airportKeys.all }),
  });
}

export function useUpdateAirport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: PatchAirportInput & { id: string }) => api.patch<Airport>(`/airports/${id}`, { body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: airportKeys.all }),
  });
}

type ErrorBody = { error?: { code?: string; message?: string; details?: unknown; requestId?: string } };

/**
 * POST /airports/import takes the CSV as a raw `text/csv` body (or multipart);
 * the JSON client cannot send that, so this is the one hand-rolled request.
 * Same headers and error mapping as client.ts; no 401 refresh-and-retry.
 */
export async function postCsv<T>(path: string, csv: string): Promise<T> {
  const headers = new Headers({ Accept: 'application/json', 'Content-Type': 'text/csv' });
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const org = readSelectedOrg();
  if (org) headers.set('x-csq-org', org);
  let res: Response;
  try {
    res = await fetch(buildUrl(path), { method: 'POST', headers, body: csv, credentials: 'omit' });
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) {
    let body: ErrorBody = {};
    try {
      body = (await res.json()) as ErrorBody;
    } catch {
      /* non-JSON error */
    }
    const requestId = body.error?.requestId ?? res.headers.get('x-request-id') ?? undefined;
    throw new ApiError(res.status, body.error?.code ?? 'INTERNAL', body.error?.message ?? `Request failed (${res.status})`, body.error?.details, requestId);
  }
  const json = (await res.json()) as { data?: T };
  return (json.data !== undefined ? json.data : json) as T;
}

export function useImportAirports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (csv: string) => postCsv<AirportImportResult>('/airports/import', csv),
    onSuccess: () => qc.invalidateQueries({ queryKey: airportKeys.all }),
  });
}
