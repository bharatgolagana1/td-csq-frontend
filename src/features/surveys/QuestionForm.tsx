import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { errorMessage, errorRequestId } from '@/api/client';
import { useCreateQuestion, useDeleteQuestion, useUpdateQuestion } from '@/api/surveys';
import { type Question } from '@/api/surveys.types';
import { Button, Checkbox, Input, Select, Switch, Textarea, useToast } from '@/design/primitives';

import { DeleteNode } from './DeleteNode';
import { useEditor } from './editorContext';
import { FollowUpEditor } from './FollowUpEditor';
import { applyCodeConflict, applyQuestionServerErrors, parsePlacement, parseWeight, placementOptions, type QuestionFormOutput, type QuestionFormValues, questionInput, questionSchema, questionValues } from './nodeForms';
import { COMMENT_MODE_OPTIONS, STAKEHOLDER_PLURAL } from './surveyFormat';
import { summariseWeights } from './surveyRules';
import styles from './surveys.module.css';
import { siblingQuestions } from './treeFind';
import { useReportDirty } from './useReportDirty';
import { WeightGuard } from './WeightGuard';

export type QuestionFormProps = {
  question: Question | null;
  /** `cat:<id>` | `sub:<id>` — the placement a new question starts in. */
  placement: string;
};

/** Question node: placement, code, text, help, comment mode, stakeholder types, follow-up, flags, weight. */
export function QuestionForm({ question, placement }: QuestionFormProps) {
  const { surveyId, categories, readOnly, select } = useEditor();
  const toast = useToast();
  const create = useCreateQuestion();
  const update = useUpdateQuestion();
  const remove = useDeleteQuestion();
  const { register, control, handleSubmit, watch, setError, reset, formState } = useForm<QuestionFormValues, unknown, QuestionFormOutput>({
    resolver: zodResolver(questionSchema),
    defaultValues: questionValues(question ?? undefined, placement),
  });
  useReportDirty(formState.isDirty);
  const { errors } = formState;

  const where = parsePlacement(watch('placement'), categories);
  const siblings = siblingQuestions(categories, where.categoryId, where.subcategoryId).filter((q) => q.active && q.id !== question?.id);
  const guard = summariseWeights(watch('active') ? [...siblings, { code: question?.code ?? 'this question', weightPct: parseWeight(watch('weightPct')) }] : siblings);
  const followUpEnabled = watch('followUpEnabled');

  const onError = (e: unknown) => {
    if (!applyQuestionServerErrors(e, setError) && !applyCodeConflict(e, setError)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
  };
  const onSubmit = handleSubmit((values) => {
    const input = questionInput(values, categories);
    if (question) {
      update.mutate(
        { surveyId, id: question.id, ...input },
        {
          onSuccess: (saved) => {
            toast.success(`${saved.code} saved`);
            reset(questionValues(saved));
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { surveyId, ...input },
        {
          onSuccess: (created) => {
            toast.success(`Question ${created.code} added`);
            select({ kind: 'question', id: created.id }, true);
          },
          onError,
        },
      );
    }
  });

  const onDelete = () => {
    if (!question) return;
    remove.mutate(
      { surveyId, id: question.id },
      {
        onSuccess: () => {
          toast.success(`${question.code} deleted`);
          select(null, true);
        },
        onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
      },
    );
  };

  const pending = create.isPending || update.isPending;

  return (
    <form className={styles.nodeForm} onSubmit={onSubmit} noValidate aria-label={question ? `Question ${question.code}` : 'New question'}>
      <div className={styles.editorBody}>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <Select label="Placed under" required options={placementOptions(categories)} disabled={readOnly} error={errors.placement?.message} {...register('placement')} />
            <Input label="Code" mono required autoComplete="off" placeholder="ACFI.INFRA.NEW_PARAMETER" hint="Kept across versions so scores compare" disabled={readOnly} error={errors.code?.message} {...register('code')} data-autofocus />
          </div>
          <Textarea label="Question" required rows={3} disabled={readOnly} error={errors.text?.message} {...register('text')} />
          <Textarea label="Help text" rows={2} hint="Shown under the question; leave empty for none." disabled={readOnly} error={errors.help?.message} {...register('help')} />
          <div className={styles.formRow}>
            <Select label="Comment box" required options={COMMENT_MODE_OPTIONS} disabled={readOnly} error={errors.commentMode?.message} {...register('commentMode')} />
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
              hint="Within its group; empty everywhere means equal weights"
              disabled={readOnly}
              error={errors.weightPct?.message}
              {...register('weightPct')}
            />
          </div>
          <WeightGuard summary={guard} what="questions" />
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Asked to</legend>
            <div className={styles.checks}>
              <Checkbox label={STAKEHOLDER_PLURAL.FF} value="FF" disabled={readOnly} {...register('stakeholderTypes')} />
              <Checkbox label={STAKEHOLDER_PLURAL.CB} value="CB" disabled={readOnly} {...register('stakeholderTypes')} />
            </div>
            {errors.stakeholderTypes?.message ? (
              <p className={styles.fieldError} role="alert">
                {errors.stakeholderTypes.message}
              </p>
            ) : null}
          </fieldset>
          <div className={styles.switches}>
            <Checkbox label="Mandatory" description="Must be rated (NA counts as an answer)" disabled={readOnly} {...register('mandatory')} />
            <Checkbox label="Active" description="Inactive questions stay in the version but are not asked or scored" disabled={readOnly} {...register('active')} />
          </div>
          <Controller
            control={control}
            name="followUpEnabled"
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} disabled={readOnly} label="Follow-up on Fair or Poor" description="Asks the assessor what went wrong and offers options to tick." />}
          />
          {followUpEnabled ? (
            <div className={styles.subForm}>
              <Input label="Prompt" required autoComplete="off" placeholder="What was the problem?" disabled={readOnly} error={errors.followUpPrompt?.message} {...register('followUpPrompt')} />
              <Controller
                control={control}
                name="followUpOptions"
                render={({ field }) => <FollowUpEditor value={field.value} onChange={field.onChange} disabled={readOnly} error={errors.followUpOptions?.message} />}
              />
            </div>
          ) : null}
        </div>
      </div>
      {!readOnly ? (
        <footer className={styles.editorFoot}>
          {question ? <DeleteNode what={`question ${question.code}`} consequence="Its code can be reused afterwards. This cannot be undone." pending={remove.isPending} onDelete={onDelete} /> : null}
          <div className={styles.editorFootActions}>
            {question ? (
              <Button variant="ghost" onClick={() => reset()} disabled={!formState.isDirty || pending}>
                Reset
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => select(null, true)} disabled={pending}>
                Cancel
              </Button>
            )}
            <Button variant="primary" type="submit" loading={pending} disabled={question ? !formState.isDirty : false}>
              {question ? 'Save' : 'Add question'}
            </Button>
          </div>
        </footer>
      ) : null}
    </form>
  );
}
