import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getAccessToken } from '@/auth/keycloak';
import { useSession } from '@/auth/session';

import { api, ApiError, buildUrl, NetworkError, type QueryValue } from './client';
import {
  type CreateCustomerInput,
  type Customer,
  type CustomerListQuery,
  type ImportCommit,
  type ImportValidation,
  type Participation,
  type PatchCustomerInput,
} from './customers.types';
import { readSelectedOrg } from './selectedOrg';

/* customers module hooks (§6 customers). Stable keys; mutations invalidate precisely. */

export const customerKeys = {
  all: ['customers'] as const,
  list: (query: CustomerListQuery) => ['customers', 'list', query] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
  participation: (id: string) => ['customers', 'participation', id] as const,
};

/**
 * The operator whose directory the page reads. ACO users act for their own
 * organisation; PLATFORM users pick one, kept in `?acoId=` so the choice
 * survives navigation between Customers, Import and Sampling.
 */
export function useAcoScope() {
  const { scope } = useSession();
  const [params, setParams] = useSearchParams();
  const isPlatform = scope.kind === 'PLATFORM';
  const acoId = isPlatform ? (params.get('acoId') ?? '') : scope.kind === 'ACO' ? scope.acoId : '';
  const setAcoId = useCallback(
    (id: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('acoId', id);
          else next.delete('acoId');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return { isPlatform, acoId, setAcoId, ready: acoId !== '' };
}

export function useCustomers(query: CustomerListQuery, enabled = true) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: ({ signal }) => api.list<Customer>('/customers', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: ({ signal }) => api.get<Customer>(`/customers/${id}`, { signal }),
    enabled: id !== null,
  });
}

export function useCustomerParticipation(id: string | null) {
  return useQuery({
    queryKey: customerKeys.participation(id ?? ''),
    queryFn: ({ signal }) => api.get<Participation>(`/customers/${id}/participation`, { signal }),
    enabled: id !== null,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => api.post<Customer>('/customers', { body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: PatchCustomerInput & { id: string }) => api.patch<Customer>(`/customers/${id}`, { body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

/** Deactivate or reactivate one customer; the bulk bar calls this per id. */
export function useSetCustomerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      api.post<Customer>(`/customers/${id}/${status === 'INACTIVE' ? 'deactivate' : 'reactivate'}`),
    onSettled: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

// --- CSV import ---------------------------------------------------------------
// The CSV goes up as multipart and the template comes down as a file, so these
// two bypass the JSON-only `api.*` methods and build the same headers.

async function authHeaders(): Promise<Headers> {
  const headers = new Headers({ Accept: 'application/json, text/csv' });
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const org = readSelectedOrg();
  if (org) headers.set('x-csq-org', org);
  return headers;
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: { error?: { code?: string; message?: string; details?: unknown; requestId?: string } } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* non-JSON error */
  }
  const requestId = body.error?.requestId ?? res.headers.get('x-request-id') ?? undefined;
  return new ApiError(res.status, body.error?.code ?? 'INTERNAL', body.error?.message ?? `Request failed (${res.status})`, body.error?.details, requestId);
}

async function rawFetch(path: string, init: RequestInit, query?: Record<string, QueryValue>): Promise<Response> {
  const headers = await authHeaders();
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), { ...init, headers, credentials: 'omit' });
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) throw await toApiError(res);
  return res;
}

/** GET /customers/import/template → the CSV text (the caller saves it). */
export async function fetchImportTemplate(acoId?: string): Promise<string> {
  const res = await rawFetch('/customers/import/template', { method: 'GET' }, { acoId });
  return res.text();
}

/** POST /customers/import/validate (multipart `file`). */
export async function validateImportFile(file: File, acoId?: string): Promise<ImportValidation> {
  const form = new FormData();
  form.append('file', file, file.name);
  const res = await rawFetch('/customers/import/validate', { method: 'POST', body: form }, { acoId, fileName: file.name });
  const json = (await res.json()) as { data: ImportValidation };
  return json.data;
}

export function useValidateImport() {
  return useMutation({ mutationFn: ({ file, acoId }: { file: File; acoId?: string }) => validateImportFile(file, acoId) });
}

export function useCommitImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ importId, acoId }: { importId: string; acoId?: string }) =>
      api.post<ImportCommit>(`/customers/import/${importId}/commit`, { query: { acoId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
