import { useMutation, useQuery } from '@tanstack/react-query';

import { api, isApiError } from './client';
import {
  type Answer,
  type AnswerInput,
  type AssessmentFormResponse,
  type Draft,
  type LinkSession,
  type OtpSent,
  type PatchAnswersResult,
  type PublicInvitation,
  type Readiness,
  type SubmitResult,
} from './publicAssess.types';

/* Transport for /public/assess/:token (backend §6 "public participant flow").
   No bearer is ever present on these pages; the verified link session travels
   as `x-csq-link-token` through the client's `linkToken` option. */

const base = (token: string) => `/public/assess/${encodeURIComponent(token)}`;

export const publicAssessKeys = {
  all: ['publicAssess'] as const,
  invitation: (token: string) => ['publicAssess', token, 'invitation'] as const,
  form: (token: string) => ['publicAssess', token, 'form'] as const,
  draft: (token: string) => ['publicAssess', token, 'draft'] as const,
  readiness: (token: string) => ['publicAssess', token, 'readiness'] as const,
};

/** The wire sends `draftResponse` (`{ answers, … }`); an older shape was a bare array. The app always sees `{ answers }`. */
export function normaliseDraft(raw: unknown): Draft {
  const empty: Draft = { id: '', status: 'DRAFT', answers: [], progress: { answered: 0, total: 0, pct: 0 }, lastSavedAt: null, submittedAt: null };
  if (Array.isArray(raw)) return { ...empty, answers: raw as Answer[] };
  if (raw && typeof raw === 'object') {
    const d = raw as Partial<Draft>;
    return { ...empty, ...d, answers: Array.isArray(d.answers) ? d.answers : [] };
  }
  return empty;
}

export const publicAssessApi = {
  invitation: (token: string, signal?: AbortSignal) => api.get<PublicInvitation>(base(token), { signal }),
  requestOtp: (token: string) => api.post<OtpSent>(`${base(token)}/otp`, { body: {} }),
  verifyOtp: (token: string, otp: string) => api.post<LinkSession>(`${base(token)}/verify`, { body: { otp } }),
  form: (token: string, linkToken: string, signal?: AbortSignal) => api.get<AssessmentFormResponse>(`${base(token)}/form`, { linkToken, signal }),
  draft: async (token: string, linkToken: string, signal?: AbortSignal) => normaliseDraft(await api.get<unknown>(`${base(token)}/draft`, { linkToken, signal })),
  saveAnswers: (token: string, linkToken: string, answers: AnswerInput[]) =>
    api.patch<PatchAnswersResult>(`${base(token)}/answers`, { body: { answers }, linkToken }),
  readiness: (token: string, linkToken: string, signal?: AbortSignal) => api.get<Readiness>(`${base(token)}/readiness`, { linkToken, signal }),
  submit: (token: string, linkToken: string) => api.post<SubmitResult | undefined>(`${base(token)}/submit`, { body: {}, linkToken }),
};

/** Public pages retry only network failures: a 404/410/401 must surface at once. */
function retryNetworkOnly(count: number, error: unknown): boolean {
  return !isApiError(error) && count < 2;
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: publicAssessKeys.invitation(token),
    queryFn: ({ signal }) => publicAssessApi.invitation(token, signal),
    enabled: token.length > 0,
    retry: retryNetworkOnly,
    staleTime: 60_000,
  });
}

export function useRequestOtp(token: string) {
  return useMutation({ mutationFn: () => publicAssessApi.requestOtp(token) });
}

export function useVerifyOtp(token: string) {
  return useMutation({ mutationFn: (otp: string) => publicAssessApi.verifyOtp(token, otp) });
}

export function useAssessmentForm(token: string, linkToken: string | null) {
  return useQuery({
    queryKey: publicAssessKeys.form(token),
    queryFn: ({ signal }) => publicAssessApi.form(token, linkToken ?? '', signal),
    enabled: Boolean(linkToken),
    retry: retryNetworkOnly,
    // The draft hook owns the answers once loaded; never refetch underneath it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useAssessmentDraftData(token: string, linkToken: string | null) {
  return useQuery({
    queryKey: publicAssessKeys.draft(token),
    queryFn: ({ signal }) => publicAssessApi.draft(token, linkToken ?? '', signal),
    enabled: Boolean(linkToken),
    retry: retryNetworkOnly,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/* Saving and submitting are driven by the shared stepper's own scheduler
   (features/assessmentForm useAssessmentDraft), so the form calls
   `publicAssessApi.saveAnswers` / `.submit` directly instead of through mutations. */
