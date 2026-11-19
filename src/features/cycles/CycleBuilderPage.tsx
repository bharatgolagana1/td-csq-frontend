import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type FieldErrors, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useAirports } from '@/api/airports';
import { errorMessage, errorRequestId } from '@/api/client';
import { useCycle, usePublishCycle } from '@/api/cycles';
import { type CycleDetail } from '@/api/cycles.types';
import { useShareTotals } from '@/api/marketshare';
import { useOperators } from '@/api/organisations';
import { useSettings } from '@/api/settings';
import { useSession } from '@/auth/session';
import { Banner, Button, Card, PageHeader, Skeleton, Stepper, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { useShell } from '@/shell/ShellContext';

import { PART_FORM_FIELDS, todayIn } from './autosave';
import { BasicsStep } from './BasicsStep';
import { BuilderProvider } from './builderContext';
import {
  BUILDER_STEPS,
  type BuilderField,
  builderSchema,
  type BuilderStepId,
  type BuilderValues,
  defaultBuilderValues,
  STEP_FIELDS,
  stepIndex,
  stepOfField,
  valuesFromCycle,
} from './builderSchema';
import styles from './cycles.module.css';
import { DraftLeaveGuard } from './DraftLeaveGuard';
import { DraftSaveStatus } from './DraftSaveStatus';
import { ParticipantsStep } from './ParticipantsStep';
import { PublishDialog } from './PublishDialog';
import { type PublishProblem, publishProblems } from './publishProblems';
import { ReviewStep } from './ReviewStep';
import { SamplingStep } from './SamplingStep';
import { fetchCycleSchedule, firstFreeInitiationDate } from './scheduleConflict';
import { useDraftAutosave } from './useDraftAutosave';
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
 * each step validates its own fields before moving on; Publish validates
 * everything. The draft saves itself (useDraftAutosave): it is created when
 * the user moves on from a valid Basics, then every change is saved after a
 * short pause and on every step change. Save as draft saves at once.
 * Leaving with anything unsaved asks first (DraftLeaveGuard).
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
  const publish = usePublishCycle();

  const [step, setStep] = useState<BuilderStepId>('basics');
  const [publishOpen, setPublishOpen] = useState(false);
  const [problems, setProblems] = useState<PublishProblem[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const seeded = useRef(false);

  // Only airports with an operator can take part; one request totals their shares.
  const shareAirportIds = useMemo(
    () =>
      (airports.data?.data ?? [])
        .filter((a) => a.operatorCount > 0)
        .map((a) => a.id)
        .sort(),
    [airports.data],
  );
  const shareTotals = useShareTotals(shareAirportIds, hasTask('marketshare.view'));

  const form = useForm<BuilderValues>({ resolver: zodResolver(builderSchema), defaultValues: defaultBuilderValues(), mode: 'onTouched' });
  const { formState, trigger, handleSubmit, getValues } = form;
  const fallback = useMemo(() => defaultBuilderValues(settings.data), [settings.data]);
  // A new draft's placeholder dates start on the first day clear of running cycles (the server refuses an overlap).
  const schedule = useQuery({ queryKey: ['cycles', 'schedule'], queryFn: ({ signal }) => fetchCycleSchedule(signal), enabled: !editing });
  const defaults = settings.data?.defaults;
  const placeholderDate = useCallback(
    (tz: string) => (defaults && schedule.data ? firstFreeInitiationDate(schedule.data, tz, defaults, todayIn(tz)) : undefined),
    [defaults, schedule.data],
  );
  const autosave = useDraftAutosave(form, fallback, setStep, placeholderDate);
  const { begin, flush } = autosave;

  // Seed once: the draft being edited, or the platform defaults for a new cycle (unless the user already typed).
  useEffect(() => {
    if (seeded.current) return;
    if (editing) {
      if (cycleQuery.data) {
        begin(valuesFromCycle(cycleQuery.data), cycleQuery.data);
        seeded.current = true;
      }
    } else if (settings.data) {
      if (!formState.isDirty) begin(defaultBuilderValues(settings.data), null);
      seeded.current = true;
    }
  }, [editing, cycleQuery.data, settings.data, formState.isDirty, begin]);

  const current = stepIndex(step);
  /** Every step change saves; leaving a valid Basics creates the draft. */
  const goTo = useCallback(
    (s: BuilderStepId) => {
      setStep(s);
      void flush(true);
    },
    [flush],
  );

  const next = async () => {
    if (step === 'review') return;
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) return;
    const n = BUILDER_STEPS[current + 1];
    if (n) goTo(n.id);
  };
  const back = () => {
    const p = BUILDER_STEPS[current - 1];
    if (p) goTo(p.id);
  };

  const onInvalid = (errors: FieldErrors<BuilderValues>) => {
    const s = firstErrorStep(errors);
    if (s) setStep(s);
    toast.error('Check the highlighted fields');
  };

  /** Shows what keeps a part from saving: its fields' messages, on its step. */
  const showBlocked = async (): Promise<boolean> => {
    const fields: BuilderField[] = autosave.blockedNow().flatMap((part) => [...PART_FORM_FIELDS[part]]);
    if (fields.length === 0) return false;
    await trigger(fields);
    setStep(stepOfField(fields[0] as BuilderField));
    return true;
  };

  /** Save as draft: saves now (creating the draft if needed) and stays on the page. */
  const onSaveDraft = async () => {
    setSavingDraft(true);
    const saved = await flush(true, true);
    setSavingDraft(false);
    if (!saved) {
      if (!(await trigger(STEP_FIELDS.basics))) {
        setStep('basics');
        toast.error('Give the cycle a name, a code and a time zone to save a draft');
      } else toast.error('The draft could not be saved', { description: 'See the save status for why, then retry.' });
      return;
    }
    if (await showBlocked()) toast.error(`Draft ${saved.code} saved, except the highlighted fields`);
    else toast.success(`Draft ${saved.code} saved`);
  };

  const onPublishClick = handleSubmit(() => {
    setProblems([]);
    setPublishOpen(true);
  }, onInvalid);

  const leaveTo = (saved: CycleDetail) => navigate(editing ? '..' : `../${saved.id}`, { relative: 'path' });

  const confirmPublish = async () => {
    const saved = await flush(true, true);
    if (!saved) {
      setPublishOpen(false);
      toast.error('The draft could not be saved, so it was not published', { description: 'See the save status for why, then retry.' });
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

  // The guard asks first when something is unsaved.
  const onCancel = () => navigate('..', { relative: 'path' });

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
        shareTotals: shareTotals.data ?? null,
        referenceLoading: airports.isPending || operators.isPending,
        referenceError: airports.error ?? operators.error ?? null,
      }}
    >
      <PageHeader
        eyebrow="Cycles"
        title={title}
        context="Windows, minimum sample, reminders and participants. The draft saves itself as you go; publishing needs every check to pass."
        breadcrumbs={crumbs}
        actions={
          <span className={styles.headerStatus}>
            <DraftSaveStatus state={autosave.state} unsaved={autosave.unsaved} hasDraft={autosave.draftId !== null} onRetry={() => void flush(true, true)} tz={values.tz} />
            <Button variant="ghost" onClick={onCancel}>
              {autosave.draftId ? 'Close' : 'Cancel'}
            </Button>
          </span>
        }
      />
      <div className={styles.builder}>
        <Stepper steps={BUILDER_STEPS.map((s) => ({ id: s.id, label: s.label, description: s.description }))} current={current} onStepClick={(i) => goTo(BUILDER_STEPS[i]?.id ?? 'basics')} />
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
              <ReviewStep onSaveDraft={() => void onSaveDraft()} onPublish={() => void onPublishClick()} saving={savingDraft} publishing={publish.isPending} canPublish={hasTask('cycles.publish')} />
            ) : (
              <div className={styles.stepNav}>
                <Button variant="ghost" onClick={back} disabled={current === 0}>
                  Back
                </Button>
                <Button variant="secondary" onClick={() => void onSaveDraft()} loading={savingDraft}>
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
        loading={autosave.state.kind === 'saving' || publish.isPending}
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
      <DraftLeaveGuard autosave={autosave} />
    </BuilderProvider>
  );
}
