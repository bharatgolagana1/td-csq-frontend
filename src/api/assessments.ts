import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/auth/keycloak';

import { type AnswerInput, type AssessmentDetail, type AssessmentExportQuery, type AssessmentListQuery, type AssessmentSummary, type HistoryRow, type PatchAnswersResult, type SelfAssessment, type SurveyType } from './assessments.types';
import { api, ApiError, buildUrl, NetworkError } from './client';
import { readSelectedOrg } from './selectedOrg';

/** `GET /cycles/current` cache prefix (api/sampling keys it `['cycles', 'current', acoId]`). */
const CURRENT_CYCLE_PREFIX = ['cycles', 'current'] as const;

/* assessments module hooks (§6 "assessments (signed-in)"). Stable keys; mutations
   invalidate precisely. The public participant flow calls the same form/draft/
   answers/submit shapes with a link token and lives in api/publicAssess. The
   current cycle comes from api/sampling (`useCurrentCycles`), one cache entry
   per operator for the whole app. */

export const assessmentKeys = {
  all: ['assessments'] as const,
  list: (query: AssessmentListQuery) => ['assessments', 'list', query] as const,
  detail: (id: string) => ['assessments', 'detail', id] as const,
  self: (cycleId: string, surveyType: SurveyType) => ['assessments', 'self', cycleId, surveyType] as const,
};

export function useAssessments(query: AssessmentListQuery, enabled = true) {
  return useQuery({
    queryKey: assessmentKeys.list(query),
    queryFn: ({ signal }) => api.list<HistoryRow>('/assessments', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery({
    queryKey: assessmentKeys.detail(id ?? ''),
    queryFn: ({ signal }) => api.get<AssessmentDetail>(`/assessments/${id}`, { signal }),
    enabled: Boolean(id),
  });
}

/** The ACO's own return for a cycle and survey type; the server creates it on first access. */
export function useSelfAssessment(cycleId: string | undefined, surveyType: SurveyType | undefined) {
  return useQuery({
    queryKey: assessmentKeys.self(cycleId ?? '', surveyType ?? 'DOMESTIC'),
    queryFn: ({ signal }) => api.get<SelfAssessment>(`/assessments/self/${cycleId}/${surveyType}`, { signal }),
    enabled: Boolean(cycleId && surveyType),
    // The draft hook owns the answers once loaded; never refetch underneath it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (count, error) => !(error instanceof ApiError) && count < 2,
  });
}

/** Merge PATCH of changed answers (§7 "Form rules": the client may batch). */
export function useSaveSelfAnswers(cycleId: string, surveyType: SurveyType) {
  return useMutation({
    mutationFn: (answers: AnswerInput[]) => api.patch<PatchAnswersResult>(`/assessments/self/${cycleId}/${surveyType}/answers`, { body: { answers } }),
  });
}

export function useSubmitSelfAssessment(cycleId: string, surveyType: SurveyType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<AssessmentSummary>(`/assessments/self/${cycleId}/${surveyType}/submit`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: assessmentKeys.self(cycleId, surveyType) });
      void qc.invalidateQueries({ queryKey: assessmentKeys.all });
      // The operator strip and the self-assessment page both key the current cycle under this prefix.
      void qc.invalidateQueries({ queryKey: CURRENT_CYCLE_PREFIX });
    },
  });
}

/** `GET /assessments/export?cycleId=` → CSV. The client parses JSON, so this fetches the text itself. */
export async function fetchAssessmentsExport(query: AssessmentExportQuery): Promise<Blob> {
  const headers = new Headers({ Accept: 'text/csv' });
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const org = readSelectedOrg();
  if (org) headers.set('x-csq-org', org);
  let res: Response;
  try {
    res = await fetch(buildUrl('/assessments/export', query), { headers, credentials: 'omit' });
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) {
    let body: { error?: { code?: string; message?: string; requestId?: string } } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, body.error?.code ?? 'INTERNAL', body.error?.message ?? `Export failed (${res.status})`, undefined, body.error?.requestId ?? res.headers.get('x-request-id') ?? undefined);
  }
  return res.blob();
}

/** Downloads the CSV through an object URL; the file is named after the cycle code. */
export function useExportAssessments() {
  return useMutation({
    mutationFn: async ({ query, fileName }: { query: AssessmentExportQuery; fileName: string }) => {
      const blob = await fetchAssessmentsExport(query);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}
