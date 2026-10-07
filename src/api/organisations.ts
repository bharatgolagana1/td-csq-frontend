import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { airportKeys } from './airports';
import { api } from './client';
import { marketShareKeys } from './marketshare';
import { type CreateOperatorInput, type Operator, type PatchOperatorInput } from './operators.types';
import { type ListQuery } from './types';

/* organisations module: operators (§6 organisations). `useOperators` also
   feeds the invite-user drawer and every organisation picker. Keys: ['operators', ...]. */

export const organisationKeys = {
  operators: ['operators'] as const,
  operatorsList: (query: ListQuery) => ['operators', 'list', query] as const,
  operator: (id: string) => ['operators', id] as const,
};

export function useOperators(query: ListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: organisationKeys.operatorsList(query),
    queryFn: ({ signal }) => api.list<Operator>('/operators', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOperator(id: string | undefined) {
  return useQuery({
    queryKey: organisationKeys.operator(id ?? ''),
    queryFn: ({ signal }) => api.get<Operator>(`/operators/${id}`, { signal }),
    enabled: Boolean(id),
  });
}

/** Operator changes move airport operator counts and (optionally) the airport's current shares. */
function invalidateOperatorSideEffects(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: organisationKeys.operators });
  void qc.invalidateQueries({ queryKey: airportKeys.all });
  void qc.invalidateQueries({ queryKey: marketShareKeys.all });
}

export function useCreateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOperatorInput) => api.post<Operator>('/operators', { body: input }),
    onSuccess: () => invalidateOperatorSideEffects(qc),
  });
}

export function useUpdateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: PatchOperatorInput & { id: string }) => api.patch<Operator>(`/operators/${id}`, { body: patch }),
    onSuccess: (data) => {
      qc.setQueryData(organisationKeys.operator(data.id), data);
      invalidateOperatorSideEffects(qc);
    },
  });
}

export function useDeactivateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Operator>(`/operators/${id}/deactivate`),
    onSuccess: (data) => {
      qc.setQueryData(organisationKeys.operator(data.id), data);
      invalidateOperatorSideEffects(qc);
    },
  });
}
