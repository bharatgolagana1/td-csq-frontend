import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import { type Invitation, type InvitationListQuery } from './invitations.types';

/* invitations module hooks (§6 invitations). Keys: ['invitations', ...]. */

export const invitationKeys = {
  all: ['invitations'] as const,
  list: (query: InvitationListQuery) => ['invitations', 'list', query] as const,
};

/** GET /invitations [list] (`cycles.view`; filters cycleId, acoId, state, surveyType). */
export function useInvitations(query: InvitationListQuery, enabled = true) {
  return useQuery({
    queryKey: invitationKeys.list(query),
    queryFn: ({ signal }) => api.list<Invitation>('/invitations', query, { signal }),
    placeholderData: keepPreviousData,
    enabled: enabled && query.cycleId !== '',
  });
}

/** POST /invitations/:id/resend (`notifications.send`): new token, link re-sent, audited. */
export function useResendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Invitation>(`/invitations/${id}/resend`),
    onSettled: () => qc.invalidateQueries({ queryKey: invitationKeys.all }),
  });
}

/** POST /invitations/:id/revoke (`sampling.manage`): the link dies; the participant is not assessed. */
export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Invitation>(`/invitations/${id}/revoke`),
    onSettled: () => qc.invalidateQueries({ queryKey: invitationKeys.all }),
  });
}
