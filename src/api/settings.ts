import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import { type Settings, type SettingsPatch } from './types';

export const settingsKeys = {
  all: ['settings'] as const,
};

export function useSettings(enabled = true) {
  return useQuery({ queryKey: settingsKeys.all, queryFn: ({ signal }) => api.get<Settings>('/settings', { signal }), enabled });
}

/** Pure: the settings document after a PATCH body is merged section by section (used for the optimistic update). */
export function applySettingsPatch(current: Settings, patch: SettingsPatch): Settings {
  const { reminders, ...defaults } = patch.defaults ?? {};
  return {
    ...current,
    scoring: { ...current.scoring, ...patch.scoring },
    defaults: {
      ...current.defaults,
      ...defaults,
      reminders: {
        sampling: { ...current.defaults.reminders.sampling, ...reminders?.sampling },
        assessment: { ...current.defaults.reminders.assessment, ...reminders?.assessment },
      },
    },
    branding: { ...current.branding, ...patch.branding },
    revealAssessorIdentity: patch.revealAssessorIdentity ?? current.revealAssessorIdentity,
  };
}

/** PATCH /settings with an optimistic cache update and rollback on error (§5; the settings page saves per section). */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => api.patch<Settings>('/settings', { body: patch }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: settingsKeys.all });
      const previous = qc.getQueryData<Settings>(settingsKeys.all);
      if (previous) qc.setQueryData(settingsKeys.all, applySettingsPatch(previous, patch));
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) qc.setQueryData(settingsKeys.all, context.previous);
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(settingsKeys.all, data);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
