import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { type DefaultValues, type FieldValues, type Path, type Resolver, useForm } from 'react-hook-form';
import { type z } from 'zod';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useUpdateSettings } from '@/api/settings';
import { type Settings, type SettingsPatch } from '@/api/types';
import { useToast } from '@/design/primitives';

import { useRegisterDirty } from './SettingsDirtyContext';

/* One settings section = one form that saves its own PATCH. The form follows
   the server document while it is clean; while dirty it keeps the user's edits,
   so a failed save (the hook rolls the cache back) leaves the edits in place to
   retry. Server VALIDATION details ("scoring.minResponses") map onto fields. */

export type SectionFormOptions<T extends FieldValues> = {
  /** Registered with the dirty guard and used in messages ("Scoring saved"). */
  id: string;
  label: string;
  schema: z.ZodType<T, T>;
  settings: Settings;
  toForm: (s: Settings) => T;
  toPatch: (v: T) => SettingsPatch;
  /** Server detail path → field name; defaults to the last path segment. */
  pathToField?: Record<string, Path<T>>;
  readOnly?: boolean;
};

type Issue = { path?: (string | number)[] | string; field?: string; message?: string };

function issuesOf(details: unknown): Issue[] {
  if (Array.isArray(details)) return details as Issue[];
  if (details && typeof details === 'object') {
    const d = details as { issues?: Issue[]; errors?: Issue[]; fieldErrors?: Record<string, string[] | string> };
    if (Array.isArray(d.issues)) return d.issues;
    if (Array.isArray(d.errors)) return d.errors;
    if (d.fieldErrors) return Object.entries(d.fieldErrors).map(([field, m]) => ({ field, message: Array.isArray(m) ? m[0] : m }));
  }
  return [];
}

export function useSectionForm<T extends FieldValues>({ id, label, schema, settings, toForm, toPatch, pathToField, readOnly }: SectionFormOptions<T>) {
  const toast = useToast();
  const update = useUpdateSettings();
  const form = useForm<T>({ resolver: zodResolver(schema) as Resolver<T>, defaultValues: toForm(settings) as DefaultValues<T>, disabled: readOnly });
  const { reset, formState, setError, handleSubmit } = form;
  const { isDirty } = formState;

  useRegisterDirty(id, isDirty);

  // Follow the server document (another admin saved, a refetch) while the user is not editing.
  useEffect(() => {
    if (!isDirty) reset(toForm(settings));
  }, [settings, isDirty, reset, toForm]);

  const applyServerIssues = (error: unknown): boolean => {
    if (!isApiError(error, 'VALIDATION')) return false;
    let applied = false;
    issuesOf(error.details).forEach((issue) => {
      const raw = issue.field ?? (Array.isArray(issue.path) ? issue.path.join('.') : issue.path);
      if (!raw) return;
      const path = raw.replace(/^body\./, '');
      const field = pathToField?.[path] ?? (path.split('.').pop() as Path<T>);
      if (!(field in toForm(settings))) return;
      setError(field, { type: 'server', message: issue.message ?? 'Invalid value' });
      applied = true;
    });
    return applied;
  };

  const save = handleSubmit((values) => {
    update.mutate(toPatch(values), {
      onSuccess: (data) => {
        reset(toForm(data ?? settings));
        toast.success(`${label} saved`);
      },
      onError: (e) => {
        if (!applyServerIssues(e)) toast.error(`Could not save ${label.toLowerCase()}: ${errorMessage(e)}`, { requestId: errorRequestId(e) });
      },
    });
  });

  const discard = () => reset(toForm(settings));

  return { form, save, discard, isDirty, saving: update.isPending, readOnly: Boolean(readOnly) };
}
