import { keepPreviousData, type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { airportKeys } from './airports';
import { api } from './client';
import { marketShareKeys } from './marketshare';
import {
  type ApproveRegistrationInput,
  type CreatedOnboardingLink,
  type CreateOnboardingLinkInput,
  type OnboardingLink,
  type PublicOnboardingLink,
  type Registration,
  type RegistrationDetail,
  type RegistrationInput,
  type RejectRegistrationInput,
} from './onboarding.types';
import { organisationKeys } from './organisations';
import { type ListQuery } from './types';

/* onboarding module hooks (§6 onboarding). Keys: ['onboarding', ...]. */

export const onboardingKeys = {
  all: ['onboarding'] as const,
  links: ['onboarding', 'links'] as const,
  linksList: (query: ListQuery) => ['onboarding', 'links', 'list', query] as const,
  registrations: ['onboarding', 'registrations'] as const,
  registrationsList: (query: ListQuery) => ['onboarding', 'registrations', 'list', query] as const,
  registration: (id: string) => ['onboarding', 'registration', id] as const,
  publicLink: (token: string) => ['onboarding', 'public', token] as const,
};

// --- links -----------------------------------------------------------------

export function useOnboardingLinks(query: ListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: onboardingKeys.linksList(query),
    queryFn: ({ signal }) => api.list<OnboardingLink>('/onboarding/links', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateOnboardingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOnboardingLinkInput) => api.post<CreatedOnboardingLink>('/onboarding/links', { body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: onboardingKeys.links }),
  });
}

export function useDeleteOnboardingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<undefined>(`/onboarding/links/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: onboardingKeys.links }),
  });
}

// --- registrations ---------------------------------------------------------

export function useRegistrations(query: ListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: onboardingKeys.registrationsList(query),
    queryFn: ({ signal }) => api.list<Registration>('/registrations', query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** The detail (with the airport's share set). A list row can seed the view while it loads. */
export function useRegistration(id: string | undefined, placeholder?: Registration) {
  return useQuery({
    queryKey: onboardingKeys.registration(id ?? ''),
    queryFn: ({ signal }) => api.get<RegistrationDetail>(`/registrations/${id}`, { signal }),
    enabled: Boolean(id),
    placeholderData: placeholder ? { ...placeholder, marketShare: null } : undefined,
  });
}

// No optimistic status flip on approve / reject: the server validates the
// code, the admin e-mail and the share set, and flipping the status first
// unmounted the review form, so a refusal showed nothing and lost what the
// reviewer had typed. The drawer shows the decision once the server agrees.
function settle(qc: QueryClient, id: string, result: RegistrationDetail | undefined) {
  if (result) qc.setQueryData(onboardingKeys.registration(id), result);
  void qc.invalidateQueries({ queryKey: onboardingKeys.registrations });
  void qc.invalidateQueries({ queryKey: onboardingKeys.registration(id) });
}

export function useApproveRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ApproveRegistrationInput & { id: string }) =>
      api.post<RegistrationDetail>(`/registrations/${id}/approve`, { body: input }),
    onSuccess: () => {
      // Approval creates the organisation, its admin and (optionally) a current market share.
      void qc.invalidateQueries({ queryKey: organisationKeys.operators });
      void qc.invalidateQueries({ queryKey: airportKeys.all });
      void qc.invalidateQueries({ queryKey: marketShareKeys.all });
      void qc.invalidateQueries({ queryKey: onboardingKeys.links });
    },
    onSettled: (data, _e, { id }) => settle(qc, id, data),
  });
}

export function useRejectRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RejectRegistrationInput & { id: string }) =>
      api.post<RegistrationDetail>(`/registrations/${id}/reject`, { body: input }),
    onSettled: (data, _e, { id }) => settle(qc, id, data),
  });
}

// --- public registration (/register/:token) --------------------------------

/** 404 = unknown, 410 (LINK_EXPIRED) = expired, `used` = already registered. Never retried. */
export function usePublicOnboardingLink(token: string | undefined) {
  return useQuery({
    queryKey: onboardingKeys.publicLink(token ?? ''),
    queryFn: ({ signal }) => api.get<PublicOnboardingLink>(`/public/onboarding/${token}`, { signal }),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });
}

export function useSubmitRegistration(token: string | undefined) {
  return useMutation({
    mutationFn: (input: RegistrationInput) => api.post<{ registrationId: string }>(`/public/onboarding/${token}`, { body: input }),
  });
}
