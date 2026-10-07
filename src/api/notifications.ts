import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import { type CycleOption, type Notification, type NotificationListQuery } from './notifications.types';

/* notifications module hooks (§6 notifications). Stable keys; the resend
   invalidates the whole list because it inserts a new row at the top. */

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: NotificationListQuery) => ['notifications', 'list', query] as const,
};

export type UseNotificationsOptions = {
  /** Poll every N ms (the page's auto-refresh toggle); `false` disables polling. */
  refetchInterval?: number | false;
  enabled?: boolean;
};

export function useNotifications(query: NotificationListQuery, { refetchInterval = false, enabled = true }: UseNotificationsOptions = {}) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: ({ signal }) => api.list<Notification>('/notifications', query, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval,
    enabled,
  });
}

export function useResendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Notification>(`/notifications/${id}/resend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

/* Minimal cycle options for the cycle filter, mirroring how `organisations.ts`
   carries a minimal `useOperators`. Keyed under `['cycles', …]` so the cycles
   module's invalidations refresh it; the cycles feature's own hooks live in
   `api/cycles.ts`. */

export const cycleOptionKeys = {
  options: ['cycles', 'options'] as const,
};

export function useCycleOptions(enabled = true) {
  return useQuery({
    queryKey: cycleOptionKeys.options,
    queryFn: async ({ signal }) => (await api.list<CycleOption>('/cycles', { pageSize: 200, sort: '-createdAt' }, { signal })).data,
    enabled,
    staleTime: 5 * 60_000,
  });
}
