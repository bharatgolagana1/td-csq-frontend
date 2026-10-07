import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import {
  type CreateCycleInput,
  type CycleDetail,
  type CycleListQuery,
  type CycleMonitoring,
  type CycleParticipant,
  type CycleSummary,
  type ParticipantListQuery,
  type PatchCycleInput,
  type ReminderRun,
  type SendRemindersInput,
  type TransitionInput,
  type UnlockSampleInput,
} from './cycles.types';

/* cycles module hooks (§6 cycles). Stable keys under ['cycles', …]; mutations
   invalidate precisely. The operator strip (`GET /cycles/current`) is served by
   `useCurrentCycles` in ./sampling, keyed ['cycles', 'current', acoId] so a lock
   or unlock refreshes it; neighbouring reads (airports, operators, surveys,
   notifications, audit, registrations, settings) use their own module's hooks. */

export const cycleKeys = {
  all: ['cycles'] as const,
  list: (query: CycleListQuery) => ['cycles', 'list', query] as const,
  detail: (id: string) => ['cycles', id] as const,
  participants: (id: string, query: ParticipantListQuery) => ['cycles', id, 'participants', query] as const,
  monitoring: (id: string) => ['cycles', id, 'monitoring'] as const,
  current: ['cycles', 'current'] as const,
};

export function useCycles(query: CycleListQuery, enabled = true) {
  return useQuery({
    queryKey: cycleKeys.list(query),
    queryFn: ({ signal }) => api.list<CycleSummary>('/cycles', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCycle(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: cycleKeys.detail(id ?? ''),
    queryFn: ({ signal }) => api.get<CycleDetail>(`/cycles/${id}`, { signal }),
    enabled: enabled && Boolean(id),
  });
}

export function useCycleParticipants(id: string, query: ParticipantListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: cycleKeys.participants(id, query),
    queryFn: ({ signal }) => api.list<CycleParticipant>(`/cycles/${id}/participants`, query, { signal }),
    placeholderData: keepPreviousData,
    enabled: enabled && id !== '',
  });
}

export function useCycleMonitoring(id: string, enabled = true) {
  return useQuery({
    queryKey: cycleKeys.monitoring(id),
    queryFn: ({ signal }) => api.get<CycleMonitoring>(`/cycles/${id}/monitoring`, { signal }),
    enabled: enabled && id !== '',
  });
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCycleInput) => api.post<CycleDetail>('/cycles', { body: input }),
    onSuccess: (data) => {
      qc.setQueryData(cycleKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: cycleKeys.all });
    },
  });
}

export function useUpdateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: PatchCycleInput & { id: string }) => api.patch<CycleDetail>(`/cycles/${id}`, { body: patch }),
    onSuccess: (data) => {
      qc.setQueryData(cycleKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: cycleKeys.all });
    },
  });
}

/** Publish snapshots market shares and e-mails ACO admins, so shares and notifications refresh too. */
export function usePublishCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<CycleDetail>(`/cycles/${id}/publish`),
    onSuccess: (data) => {
      qc.setQueryData(cycleKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: cycleKeys.all });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['marketshare'] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useTransitionCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: TransitionInput & { id: string }) => api.post<CycleDetail>(`/cycles/${id}/transition`, { body: input }),
    onSuccess: (data) => {
      qc.setQueryData(cycleKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: cycleKeys.all });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useSendReminders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SendRemindersInput & { id: string }) => api.post<ReminderRun>(`/cycles/${id}/reminders/send`, { body: input }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: cycleKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/** PLATFORM unlock of one operator's locked sample from the cycle detail (sampling.unlock); the operator re-locks through /lock. */
export function useUnlockParticipantSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, ...body }: UnlockSampleInput) => api.post<unknown>(`/sampling/cycles/${cycleId}/unlock`, { body }),
    onSuccess: (_data, { cycleId, acoId }) => {
      void qc.invalidateQueries({ queryKey: cycleKeys.detail(cycleId) });
      void qc.invalidateQueries({ queryKey: ['cycles', 'current', acoId] });
      void qc.invalidateQueries({ queryKey: ['sampling'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
