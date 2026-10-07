import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldErrors, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useAirports } from '@/api/airports';
import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useCreateCycle, useCycle, usePublishCycle, useUpdateCycle } from '@/api/cycles';
import { type CycleDetail } from '@/api/cycles.types';
import { useOperators } from '@/api/organisations';
import { useSettings } from '@/api/settings';
import { useSession } from '@/auth/session';
import { Banner, Button, Card, PageHeader, Skeleton, Stepper, useToast } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { useShell } from '@/shell/ShellContext';

import { BasicsStep } from './BasicsStep';
import { BuilderProvider } from './builderContext';
import {
  applyBuilderServerErrors,
  BUILDER_STEPS,
  type BuilderField,
  builderSchema,
  type BuilderStepId,
  type BuilderValues,
  defaultBuilderValues,
  STEP_FIELDS,
  stepIndex,
  stepOfField,
  toCreateInput,
  toPatchInput,
  valuesFromCycle,
} from './builderSchema';
import styles from './cycles.module.css';
import { ParticipantsStep } from './ParticipantsStep';
import { PublishDialog } from './PublishDialog';
import { type PublishProblem, publishProblems } from './publishProblems';
import { ReviewStep } from './ReviewStep';
import { SamplingStep } from './SamplingStep';
import { WindowsStep } from './WindowsStep';

/** The earliest step that holds a validation error (so the builder can jump there). */
export function firstErrorStep(errors: FieldErrors<BuilderValues>): BuilderStepId | null {
  const found: BuilderStepId[] = [];
  const walk = (node: unknown, prefix: string) => {
    if (!node || typeof node !== 'object') return;
    if ('message' in node && typeof (node as { message?: unknown }).message === 'string') {
      found.push(stepOfField(prefix as BuilderField));
      return;
    }
    Object.entries(node as Record<string, unknown>).forEach(([k, v]) => walk(v, prefix ? `${prefix}.${k}` : k));
  };
  walk(errors, '');
  return found.sort((a, b) => stepIndex(a) - stepIndex(b))[0] ?? null;
}

/**
 * /cycles/new and /cycles/:id/edit (DRAFT only). One form across five steps;
 * each step validates its own fields before moving on; Save as draft and
 * Publish validate everything. A created draft is remembered so a refused
 * publish retries with a PATCH rather than a second create.
 */
export default function CycleBuilderPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { href } = useShell();
  const toast = useToast();
  const { hasTask } = useSession();
  const settings = useSettings();
  const cycleQuery = useCycle(id);
  const airports = useAirports({ active: true, pageSize: 200, sort: 'iata' });
  const operators = useOperators({ status: 'ACTIVE', pageSize: 200, sort: 'name' });
  const create = useCreateCycle();
  const update = useUpdateCycle();
  const publish = usePublishCycle();

  const [step, setStep] = useState<BuilderStepId>('basics');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [problems, setProblems] = useState<PublishProblem[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const seeded = useRef(false);

  const form = useForm<BuilderValues>({ resolver: zodResolver(builderSchema), defaultValues: defaultBuilderValues(), mode: 'onTouched' });
  const { reset, formState, trigger, handleSubmit, getValues, setError } = form;

  // Seed once: the draft being edited, or the platform defaults for a new cycle (unless the user already typed).
  useEffect(() => {
    if (seeded.current) return;
    if (editing) {
      if (cycleQuery.data) {
        reset(valuesFromCycle(cycleQuery.data));
        seeded.current = true;
      }
    } else if (settings.data) {
      if (!formState.isDirty) reset(defaultBuilderValues(settings.data));
      seeded.current = true;
    }
  }, [editing, cycleQuery.data, settings.data, formState.isDirty, reset]);

  const effectiveId = id ?? createdId;
  const current = stepIndex(step);
  const goTo = useCallback((s: BuilderStepId) => setStep(s), []);

  const next = async () => {
    if (step === 'review') return;
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) return;
    const n = BUILDER_STEPS[current + 1];
    if (n) setStep(n.id);
  };
  const back = () => {
    const p = BUILDER_STEPS[current - 1];
    if (p) setStep(p.id);
  };

  const onInvalid = (errors: FieldErrors<BuilderValues>) => {
    const s = firstErrorStep(errors);
    if (s) setStep(s);
    toast.error('Check the highlighted fields');
  };

  /** Create or update the draft; maps server validation back onto the form. Null on failure. */
  const save = async (values: BuilderValues): Promise<CycleDetail | null> => {
    try {
      if (effectiveId) return await update.mutateAsync({ id: effectiveId, ...toPatchInput(values) });
      const created = await create.mutateAsync(toCreateInput(values));
      setCreatedId(created.id);
      return created;
    } catch (e) {
      const s = applyBuilderServerErrors(e, setError);
      if (s) {
        setStep(s);
        toast.error('Check the highlighted fields', { requestId: errorRequestId(e) });
      } else if (isApiError(e, 'CONFLICT')) {
        setError('code', { type: 'server', message: e.message });
        setStep('basics');
      } else {
        toast.error(errorMessage(e), { requestId: errorRequestId(e) });
      }
      return null;
    }
  };

  const leaveTo = (saved: CycleDetail) => navigate(editing ? '..' : `../${saved.id}`, { relative: 'path' });

  const onSaveDraft = handleSubmit(async (values) => {
    const saved = await save(values);
    if (saved) {
      toast.success(`Draft ${saved.code} saved`);
      leaveTo(saved);
    }
  }, onInvalid);

  const onPublishClick = handleSubmit(() => {
    setProblems([]);
    setPublishOpen(true);
  }, onInvalid);

  const confirmPublish = async () => {
    const saved = await save(getValues());
    if (!saved) {
      setPublishOpen(false);
      return;
    }
    try {
      const published = await publish.mutateAsync(saved.id);
      toast.success(`${published.code} published`, { description: published.status === 'SAMPLING_OPEN' ? 'Sampling is open.' : 'Sampling opens on schedule.' });
      setPublishOpen(false);
      leaveTo(saved);
    } catch (e) {
      const list = publishProblems(e);
      if (list.length > 0) setProblems(list);
      else {
        setPublishOpen(false);
        toast.error(errorMessage(e), { requestId: errorRequestId(e) });
      }
    }
  };

  const onCancel = () => {
    if (formState.isDirty && !createdId) setCancelOpen(true);
    else navigate('..', { relative: 'path' });
  };

  const title = editing ? (cycleQuery.data ? `Edit ${cycleQuery.data.code}` : 'Edit cycle') : 'New cycle';
  const crumbs = [{ label: 'Cycles', to: href('/cycles') }, { label: title }];

  if (editing && cycleQuery.isPending) {
    return (
      <>
        <PageHeader eyebrow="Cycles" title="Edit cycle" breadcrumbs={crumbs} />
        <div className={styles.skeletonStack}>
          <Skeleton height={56} />
          <Skeleton height={320} radius={10} />
        </div>
      </>
    );
  }
  if (editing && cycleQuery.isError) {
    return (
      <>
        <PageHeader eyebrow="Cycles" title="Edit cycle" breadcrumbs={crumbs} />
        <QueryError error={cycleQuery.error} title="Could not load the cycle" onRetry={() => void cycleQuery.refetch()} />
      </>
    );
  }
  if (editing && cycleQuery.data && cycleQuery.data.status !== 'DRAFT') {
    return (
      <>
        <PageHeader eyebrow="Cycles" title={title} breadcrumbs={crumbs} />
        <Banner
          tone="info"
          title="This cycle is already published"
          action={
            <Button variant="secondary" onClick={() => navigate('..', { relative: 'path' })}>
              Open the cycle
            </Button>
          }
        >
          Only drafts are edited here. After publishing, end dates can be extended and reminder settings changed from the cycle page.
        </Banner>
      </>
    );
  }

  const values = getValues();
  const saving = create.isPending || update.isPending;

  return (
    <BuilderProvider
      value={{
        form,
        settings: settings.data,
        cycle: cycleQuery.data ?? null,
        step,
        goTo,
        airports: airports.data?.data ?? [],
        operators: operators.data?.data ?? [],
        referenceLoading: airports.isPending || operators.isPending,
        referenceError: airports.error ?? operators.error ?? null,
      }}
    >
      <PageHeader
        eyebrow="Cycles"
        title={title}
        context="Windows, minimum sample, reminders and participants. Save a draft at any point; publishing needs every check to pass."
        breadcrumbs={crumbs}
        actions={
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        }
      />
      <div className={styles.builder}>
        <Stepper steps={BUILDER_STEPS.map((s) => ({ id: s.id, label: s.label, description: s.description }))} current={current} onStepClick={(i) => setStep(BUILDER_STEPS[i]?.id ?? 'basics')} />
        {createdId && !editing ? (
          <Banner tone="success" title={`Draft ${values.code} saved`}>
            Further changes update this draft.
          </Banner>
        ) : null}
        <Card as="section" aria-label={BUILDER_STEPS[current]?.label}>
          <form
            className={styles.stepCard}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (step !== 'review') void next();
            }}
          >
            {step === 'basics' ? <BasicsStep /> : null}
            {step === 'windows' ? <WindowsStep /> : null}
            {step === 'sampling' ? <SamplingStep /> : null}
            {step === 'participants' ? <ParticipantsStep /> : null}
            {step === 'review' ? (
              <ReviewStep onSaveDraft={() => void onSaveDraft()} onPublish={() => void onPublishClick()} saving={saving} publishing={publish.isPending} canPublish={hasTask('cycles.publish')} />
            ) : (
              <div className={styles.stepNav}>
                <Button variant="ghost" onClick={back} disabled={current === 0}>
                  Back
                </Button>
                <Button variant="secondary" onClick={() => void onSaveDraft()} loading={saving}>
                  Save as draft
                </Button>
                <Button variant="primary" type="submit">
                  Next
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => void confirmPublish()}
        loading={saving || publish.isPending}
        code={values.code}
        name={values.name}
        airports={values.participatingAirportIds.length}
        operators={values.participatingAcoIds.length}
        problems={problems}
        onFixStep={(s) => {
          setPublishOpen(false);
          setStep(s);
        }}
      />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => navigate('..', { relative: 'path' })}
        title="Discard this cycle?"
        description="Nothing has been saved yet."
        confirmLabel="Discard"
        danger
      />
    </BuilderProvider>
  );
}
