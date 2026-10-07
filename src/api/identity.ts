import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import { type InviteUserInput, type ListQuery, type Me, type Role, type RoleMatrix, type RoleMatrixInput, type UpdateUserInput, type UserRow } from './types';

/* identity module hooks (§6 identity). Stable keys; mutations invalidate precisely. */

export const identityKeys = {
  me: ['me'] as const,
  users: ['users'] as const,
  usersList: (query: ListQuery) => ['users', 'list', query] as const,
  roles: ['roles'] as const,
  rolesList: ['roles', 'list'] as const,
  matrix: ['roles', 'matrix'] as const,
};

export function useMe(enabled = true) {
  return useQuery({ queryKey: identityKeys.me, queryFn: ({ signal }) => api.get<Me>('/me', { signal }), enabled });
}

export function useUsers(query: ListQuery) {
  return useQuery({
    queryKey: identityKeys.usersList(query),
    queryFn: ({ signal }) => api.list<UserRow>('/users', query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) => api.post<UserRow>('/users', { body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: identityKeys.users }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateUserInput & { id: string }) => api.patch<UserRow>(`/users/${id}`, { body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: identityKeys.users }),
  });
}

export function useAddMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, roleCode }: { userId: string; orgId: string; roleCode: string }) =>
      api.post<UserRow>(`/users/${userId}/memberships`, { body: { orgId, roleCode } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: identityKeys.users }),
  });
}

export function useRemoveMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, membershipId }: { userId: string; membershipId: string }) => api.delete<undefined>(`/users/${userId}/memberships/${membershipId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: identityKeys.users }),
  });
}

export function useRoles() {
  return useQuery({ queryKey: identityKeys.rolesList, queryFn: ({ signal }) => api.get<Role[]>('/roles', { signal }) });
}

export function useRoleMatrix() {
  return useQuery({ queryKey: identityKeys.matrix, queryFn: ({ signal }) => api.get<RoleMatrix>('/roles/matrix', { signal }) });
}

/** Pure: apply a save payload to a cached matrix (used for the optimistic update). */
export function applyMatrixInput(matrix: RoleMatrix, input: RoleMatrixInput): RoleMatrix {
  const byRole = new Map(input.roles.map((r) => [r.roleId, r.tasks]));
  return { ...matrix, roles: matrix.roles.map((r) => (byRole.has(r.id) ? { ...r, tasks: [...(byRole.get(r.id) ?? [])] } : r)) };
}

/** Whole-matrix save with an optimistic update and rollback on error (§5). */
export function useSaveRoleMatrix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleMatrixInput) => api.put<RoleMatrix | undefined>('/roles/matrix', { body: input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: identityKeys.matrix });
      const previous = qc.getQueryData<RoleMatrix>(identityKeys.matrix);
      if (previous) qc.setQueryData(identityKeys.matrix, applyMatrixInput(previous, input));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(identityKeys.matrix, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: identityKeys.roles });
      void qc.invalidateQueries({ queryKey: identityKeys.me });
    },
  });
}
