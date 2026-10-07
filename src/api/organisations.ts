import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from './client';
import { type ListQuery, type OperatorSummary } from './types';

/* organisations module: only the operator list for now (invite-user drawer,
   organisation pickers). The operators feature will extend this file. */

export const organisationKeys = {
  operators: ['operators'] as const,
  operatorsList: (query: ListQuery) => ['operators', 'list', query] as const,
};

export function useOperators(query: ListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: organisationKeys.operatorsList(query),
    queryFn: ({ signal }) => api.list<OperatorSummary>('/operators', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
