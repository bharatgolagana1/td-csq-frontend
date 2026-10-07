import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { errorMessage, errorRequestId } from '@/api/client';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/api/surveys';
import { type Category } from '@/api/surveys.types';
import { Button, Input, useToast } from '@/design/primitives';
import { applyServerErrors } from '@/lib/formErrors';

import { DeleteNode } from './DeleteNode';
import { useEditor } from './editorContext';
import { applyCodeConflict, CATEGORY_FIELDS, type CategoryFormOutput, type CategoryFormValues, categorySchema, categoryValues, parseWeight } from './nodeForms';
import { countQuestions, summariseWeights } from './surveyRules';
import styles from './surveys.module.css';
import { useReportDirty } from './useReportDirty';
import { WeightGuard } from './WeightGuard';

/** Category node: code, name, weight — with the live total across categories. `null` creates one. */
export function CategoryForm({ category }: { category: Category | null }) {
  const { surveyId, categories, readOnly, select } = useEditor();
  const toast = useToast();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const { register, handleSubmit, watch, setError, reset, formState } = useForm<CategoryFormValues, unknown, CategoryFormOutput>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryValues(category ?? undefined),
  });
  useReportDirty(formState.isDirty);

  const guard = summariseWeights([...categories.filter((c) => c.id !== category?.id), { code: category?.code ?? 'this category', weightPct: parseWeight(watch('weightPct')) }]);

  const onError = (e: unknown) => {
    if (!applyServerErrors(e, setError, CATEGORY_FIELDS) && !applyCodeConflict(e, setError)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
  };
  const onSubmit = handleSubmit((values) => {
    if (category) {
      update.mutate(
        { surveyId, id: category.id, ...values },
        {
          onSuccess: (saved) => {
            toast.success(`${saved.code} saved`);
            reset(categoryValues(saved));
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { surveyId, ...values },
        {
          onSuccess: (created) => {
            toast.success(`Category ${created.code} added`);
            select({ kind: 'category', id: created.id }, true);
          },
          onError,
        },
      );
    }
  });

  const onDelete = () => {
    if (!category) return;
    remove.mutate(
      { surveyId, id: category.id },
      {
        onSuccess: () => {
          toast.success(`${category.code} deleted`);
          select(null, true);
        },
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  const pending = create.isPending || update.isPending;
  const nested = category ? countQuestions([category]) : 0;

  return (
    <form className={styles.nodeForm} onSubmit={onSubmit} noValidate aria-label={category ? `Category ${category.code}` : 'New category'}>
      <div className={styles.editorBody}>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <Input label="Code" mono required autoComplete="off" placeholder="INFRA" hint="Letters, digits, dot, _ or -" disabled={readOnly} error={formState.errors.code?.message} {...register('code')} data-autofocus />
            <Input
              label="Weight"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.01"
              suffix="%"
              mono
              placeholder="—"
              hint="Leave empty on every category for equal weights"
              disabled={readOnly}
              error={formState.errors.weightPct?.message}
              {...register('weightPct')}
            />
          </div>
          <Input label="Name" required autoComplete="off" placeholder="Infrastructure and facilities" disabled={readOnly} error={formState.errors.name?.message} {...register('name')} />
          <WeightGuard summary={guard} what="categories" />
        </div>
      </div>
      {!readOnly ? (
        <footer className={styles.editorFoot}>
          {category ? (
            <DeleteNode
              what={`category ${category.code}`}
              consequence={`${category.subcategories.length} ${category.subcategories.length === 1 ? 'subcategory' : 'subcategories'} and ${nested} ${nested === 1 ? 'question' : 'questions'} go with it. This cannot be undone.`}
              pending={remove.isPending}
              onDelete={onDelete}
            />
          ) : null}
          <div className={styles.editorFootActions}>
            {category ? (
              <Button variant="ghost" onClick={() => reset()} disabled={!formState.isDirty || pending}>
                Reset
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => select(null, true)} disabled={pending}>
                Cancel
              </Button>
            )}
            <Button variant="primary" type="submit" loading={pending} disabled={category ? !formState.isDirty : false}>
              {category ? 'Save' : 'Add category'}
            </Button>
          </div>
        </footer>
      ) : null}
    </form>
  );
}
