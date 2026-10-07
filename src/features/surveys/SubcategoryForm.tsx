import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { errorMessage, errorRequestId } from '@/api/client';
import { useCreateSubcategory, useDeleteSubcategory, useUpdateSubcategory } from '@/api/surveys';
import { type Subcategory } from '@/api/surveys.types';
import { Button, Input, Select, useToast } from '@/design/primitives';
import { applyServerErrors } from '@/lib/formErrors';

import { DeleteNode } from './DeleteNode';
import { useEditor } from './editorContext';
import { applyCodeConflict, SUBCATEGORY_FIELDS, type SubcategoryFormValues, subcategorySchema, subcategoryValues } from './nodeForms';
import styles from './surveys.module.css';
import { useReportDirty } from './useReportDirty';

/** Subcategory node: parent category, code, name. `null` creates one under `categoryId`. */
export function SubcategoryForm({ subcategory, categoryId }: { subcategory: Subcategory | null; categoryId: string }) {
  const { surveyId, categories, readOnly, select } = useEditor();
  const toast = useToast();
  const create = useCreateSubcategory();
  const update = useUpdateSubcategory();
  const remove = useDeleteSubcategory();
  const { register, handleSubmit, setError, reset, formState } = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: subcategoryValues(subcategory ?? undefined, categoryId),
  });
  useReportDirty(formState.isDirty);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` }));

  const onError = (e: unknown) => {
    if (!applyServerErrors(e, setError, SUBCATEGORY_FIELDS) && !applyCodeConflict(e, setError)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
  };
  const onSubmit = handleSubmit((values) => {
    if (subcategory) {
      update.mutate(
        { surveyId, id: subcategory.id, ...values },
        {
          onSuccess: (saved) => {
            toast.success(`${saved.code} saved`);
            reset(subcategoryValues(saved));
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { surveyId, ...values },
        {
          onSuccess: (created) => {
            toast.success(`Subcategory ${created.code} added`);
            select({ kind: 'subcategory', id: created.id }, true);
          },
          onError,
        },
      );
    }
  });

  const onDelete = () => {
    if (!subcategory) return;
    remove.mutate(
      { surveyId, id: subcategory.id },
      {
        onSuccess: () => {
          toast.success(`${subcategory.code} deleted`);
          select(null, true);
        },
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  const pending = create.isPending || update.isPending;
  const n = subcategory?.questions.length ?? 0;

  return (
    <form className={styles.nodeForm} onSubmit={onSubmit} noValidate aria-label={subcategory ? `Subcategory ${subcategory.code}` : 'New subcategory'}>
      <div className={styles.editorBody}>
        <div className={styles.form}>
          <Select
            label="Category"
            required
            options={categoryOptions}
            hint={subcategory ? 'Moving it to another category takes its questions along.' : undefined}
            disabled={readOnly}
            error={formState.errors.categoryId?.message}
            {...register('categoryId')}
          />
          <div className={styles.formRow}>
            <Input label="Code" mono required autoComplete="off" placeholder="SCREENING" hint="Letters, digits, dot, _ or -" disabled={readOnly} error={formState.errors.code?.message} {...register('code')} data-autofocus />
            <Input label="Name" required autoComplete="off" placeholder="Cargo screening" disabled={readOnly} error={formState.errors.name?.message} {...register('name')} />
          </div>
        </div>
      </div>
      {!readOnly ? (
        <footer className={styles.editorFoot}>
          {subcategory ? (
            <DeleteNode what={`subcategory ${subcategory.code}`} consequence={`${n} ${n === 1 ? 'question goes' : 'questions go'} with it. This cannot be undone.`} pending={remove.isPending} onDelete={onDelete} />
          ) : null}
          <div className={styles.editorFootActions}>
            {subcategory ? (
              <Button variant="ghost" onClick={() => reset()} disabled={!formState.isDirty || pending}>
                Reset
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => select(null, true)} disabled={pending}>
                Cancel
              </Button>
            )}
            <Button variant="primary" type="submit" loading={pending} disabled={subcategory ? !formState.isDirty : false}>
              {subcategory ? 'Save' : 'Add subcategory'}
            </Button>
          </div>
        </footer>
      ) : null}
    </form>
  );
}
