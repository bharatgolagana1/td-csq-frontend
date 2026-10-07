import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import {
  type CategoryNode,
  type CreateCategoryInput,
  type CreateQuestionInput,
  type CreateSubcategoryInput,
  type CreateVersionInput,
  type OrderInput,
  type PatchCategoryInput,
  type PatchQuestionInput,
  type PatchSubcategoryInput,
  type Question,
  type StakeholderType,
  type SubcategoryNode,
  type Survey,
  type SurveyForm,
  type SurveyListEntry,
  type SurveyTree,
} from './surveys.types';

/* surveys module hooks (§6 surveys). Keys: ['surveys', ...]. Node mutations
   invalidate the one tree they touch; question create/delete also refresh the
   list (its per-version `questionCount`); publish refreshes everything, since
   it changes the list, this version and the version it retires. */

export const surveyKeys = {
  all: ['surveys'] as const,
  list: ['surveys', 'list'] as const,
  tree: (id: string) => ['surveys', 'tree', id] as const,
  preview: (id: string, stakeholderType: StakeholderType) => ['surveys', 'preview', id, stakeholderType] as const,
};

export function useSurveys(enabled = true) {
  return useQuery({ queryKey: surveyKeys.list, queryFn: ({ signal }) => api.get<SurveyListEntry[]>('/surveys', { signal }), enabled });
}

export function useSurveyTree(id: string | null | undefined) {
  return useQuery({
    queryKey: surveyKeys.tree(id ?? ''),
    queryFn: ({ signal }) => api.get<SurveyTree>(`/surveys/${id}`, { signal }),
    enabled: Boolean(id),
  });
}

export function useSurveyPreview(id: string, stakeholderType: StakeholderType, enabled = true) {
  return useQuery({
    queryKey: surveyKeys.preview(id, stakeholderType),
    queryFn: ({ signal }) => api.get<SurveyForm>(`/surveys/${id}/preview`, { query: { stakeholderType }, signal }),
    enabled,
  });
}

/** `ref` is a version id (copy from the latest) or a survey type code (start the first version). Returns the new draft's tree. */
export function useCreateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, ...input }: CreateVersionInput & { ref: string }) => api.post<SurveyTree>(`/surveys/${ref}/versions`, { body: input }),
    onSuccess: (tree) => {
      qc.setQueryData(surveyKeys.tree(tree.survey.id), tree);
      void qc.invalidateQueries({ queryKey: surveyKeys.list });
    },
  });
}

export function usePublishSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.post<Survey>(`/surveys/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.all }),
  });
}

type WithSurvey = { surveyId: string };
type WithNode = WithSurvey & { id: string };

function useTreeMutation<TVars extends WithSurvey, TData>(run: (vars: TVars) => Promise<TData>, alsoList = false) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: surveyKeys.tree(vars.surveyId) });
      if (alsoList) void qc.invalidateQueries({ queryKey: surveyKeys.list });
    },
  });
}

export function useCreateCategory() {
  return useTreeMutation(({ surveyId, ...input }: CreateCategoryInput & WithSurvey) => api.post<CategoryNode>(`/surveys/${surveyId}/categories`, { body: input }));
}
export function useUpdateCategory() {
  return useTreeMutation(({ surveyId, id, ...patch }: PatchCategoryInput & WithNode) => api.patch<CategoryNode>(`/surveys/${surveyId}/categories/${id}`, { body: patch }));
}
export function useDeleteCategory() {
  return useTreeMutation(({ surveyId, id }: WithNode) => api.delete<undefined>(`/surveys/${surveyId}/categories/${id}`), true);
}

export function useCreateSubcategory() {
  return useTreeMutation(({ surveyId, ...input }: CreateSubcategoryInput & WithSurvey) => api.post<SubcategoryNode>(`/surveys/${surveyId}/subcategories`, { body: input }));
}
export function useUpdateSubcategory() {
  return useTreeMutation(({ surveyId, id, ...patch }: PatchSubcategoryInput & WithNode) => api.patch<SubcategoryNode>(`/surveys/${surveyId}/subcategories/${id}`, { body: patch }));
}
export function useDeleteSubcategory() {
  return useTreeMutation(({ surveyId, id }: WithNode) => api.delete<undefined>(`/surveys/${surveyId}/subcategories/${id}`), true);
}

export function useCreateQuestion() {
  return useTreeMutation(({ surveyId, ...input }: CreateQuestionInput & WithSurvey) => api.post<Question>(`/surveys/${surveyId}/questions`, { body: input }), true);
}
export function useUpdateQuestion() {
  return useTreeMutation(({ surveyId, id, ...patch }: PatchQuestionInput & WithNode) => api.patch<Question>(`/surveys/${surveyId}/questions/${id}`, { body: patch }));
}
export function useDeleteQuestion() {
  return useTreeMutation(({ surveyId, id }: WithNode) => api.delete<undefined>(`/surveys/${surveyId}/questions/${id}`), true);
}

/** PUT /surveys/:id/order answers with the re-ordered tree; seeding the cache with it avoids a flash of the old order before the refetch. */
export function useSaveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, ...input }: OrderInput & WithSurvey) => api.put<SurveyTree | undefined>(`/surveys/${surveyId}/order`, { body: input }),
    onSuccess: (tree, vars) => {
      if (tree) qc.setQueryData(surveyKeys.tree(vars.surveyId), tree);
      void qc.invalidateQueries({ queryKey: surveyKeys.tree(vars.surveyId) });
    },
  });
}
