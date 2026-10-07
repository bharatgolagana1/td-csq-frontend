import { type FieldValues, type Path, type UseFormSetError } from 'react-hook-form';

import { isApiError } from '@/api/client';

/* Maps a server `VALIDATION` error's `details` back onto form fields (§5).
   Tolerates the common shapes: zod `issues[]`, `{ fieldErrors }`, `[{ path, message }]`. */

type Issue = { path?: (string | number)[] | string; field?: string; message?: string };

function issuesOf(details: unknown): Issue[] {
  if (!details) return [];
  if (Array.isArray(details)) return details as Issue[];
  if (typeof details === 'object') {
    const d = details as { issues?: Issue[]; errors?: Issue[]; fieldErrors?: Record<string, string[] | string> };
    if (Array.isArray(d.issues)) return d.issues;
    if (Array.isArray(d.errors)) return d.errors;
    if (d.fieldErrors) return Object.entries(d.fieldErrors).map(([field, m]) => ({ field, message: Array.isArray(m) ? m[0] : m }));
  }
  return [];
}

/** Returns true when at least one field error was applied. */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly string[]): boolean {
  if (!isApiError(error, 'VALIDATION')) return false;
  let applied = false;
  issuesOf(error.details).forEach((issue) => {
    const raw = issue.field ?? (Array.isArray(issue.path) ? issue.path.join('.') : issue.path);
    if (!raw) return;
    const name = raw.replace(/^body\./, '');
    if (!fields.includes(name)) return;
    setError(name as Path<T>, { type: 'server', message: issue.message ?? 'Invalid value' });
    applied = true;
  });
  return applied;
}
