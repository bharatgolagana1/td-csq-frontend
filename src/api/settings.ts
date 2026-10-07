import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import { type Settings, type SettingsPatch } from './types';

export const settingsKeys = {
  all: ['settings'] as const,
};

export function useSettings(enabled = true) {
  return useQuery({ queryKey: settingsKeys.all, queryFn: ({ signal }) => api.get<Settings>('/settings', { signal }), enabled });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => api.patch<Settings>('/settings', { body: patch }),
    onSuccess: (data) => {
      if (data) qc.setQueryData(settingsKeys.all, data);
      void qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
