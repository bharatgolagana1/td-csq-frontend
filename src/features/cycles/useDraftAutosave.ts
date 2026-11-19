import { useCallback, useEffect, useRef, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useCreateCycle, useUpdateCycle } from '@/api/cycles';
import { type CycleDetail } from '@/api/cycles.types';

import { type AutosavePart, blockedParts, createInput, partJson, pendingPatch, type SavedParts, snapshotOf, unsavedParts, windowsOf } from './autosave';
import { applyBuilderServerErrors, type BuilderStepId, type BuilderValues } from './builderSchema';

/** Quiet time after the last edit before a draft is saved. */
export const AUTOSAVE_DELAY_MS = 800;

export type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: string } | { kind: 'error'; message: string; requestId?: string };

/** `any`: something on the page is not on the server. `blocked`: some of it cannot be sent until a field is fixed. */
export type Unsaved = { any: boolean; blocked: boolean };

export type DraftAutosave = {
  draftId: string | null;
  state: SaveState;
  unsaved: Unsaved;
  /** Starts from `values` as the server's copy (a loaded draft, or the defaults of a new cycle). */
  begin: (values: BuilderValues, cycle: CycleDetail | null) => void;
  /**
   * Saves now: PATCHes the draft, or creates it when `create` and Basics is
   * valid. The saved cycle, or null. With `reveal` (an explicit save) a field
   * the server refused is shown on its step; a refused create always is.
   */
  flush: (create?: boolean, reveal?: boolean) => Promise<CycleDetail | null>;
  /** Read at navigation time by the leave guard. */
  isUnsaved: () => boolean;
  /** Unsaved parts that cannot be sent until a field is fixed, as of now. */
  blockedNow: () => AutosavePart[];
};

/**
 * The cycle builder's draft on the server. Creating needs a valid Basics and
 * an explicit go (`flush(true)`: leaving Basics, Save as draft, Retry);
 * after that every edit is PATCHed once the form has been quiet for
 * AUTOSAVE_DELAY_MS, and `flush()` saves at once (step changes, publish).
 * Server field errors land on their fields (a 409 on the code field);
 * `onReveal` is asked to show the step when the save was explicit.
 */
export function useDraftAutosave(
  form: UseFormReturn<BuilderValues>,
  fallback: BuilderValues,
  onReveal: (step: BuilderStepId) => void,
  /** A new draft's initiation date when none is chosen (the first one clear of running cycles), by time zone. */
  placeholderDate?: (tz: string) => string | undefined,
): DraftAutosave {
  const create = useCreateCycle();
  const update = useUpdateCycle();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const [unsaved, setUnsaved] = useState<Unsaved>({ any: false, blocked: false });
  const live = useRef({ id: null as string | null, saved: snapshotOf(fallback) as SavedParts, cycle: null as CycleDetail | null, at: null as string | null, unsaved: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inflight = useRef<Promise<CycleDetail | null> | null>(null);
  const deps = useRef({ fallback, onReveal, placeholderDate, create: create.mutateAsync, update: update.mutateAsync });
  deps.current = { fallback, onReveal, placeholderDate, create: create.mutateAsync, update: update.mutateAsync };

  const measure = useCallback(() => {
    const values = form.getValues();
    const any = unsavedParts(values, live.current.saved).length > 0;
    const blocked = live.current.id !== null && blockedParts(values, live.current.saved).length > 0;
    live.current.unsaved = any;
    setUnsaved((prev) => (prev.any === any && prev.blocked === blocked ? prev : { any, blocked }));
  }, [form]);

  const succeed = (cycle: CycleDetail) => {
    live.current.cycle = cycle;
    live.current.at = new Date().toISOString();
    setState({ kind: 'saved', at: live.current.at });
  };

  const fail = (e: unknown, reveal: boolean) => {
    let step: BuilderStepId | null;
    if (isApiError(e, 'CONFLICT')) {
      form.setError('code', { type: 'server', message: e.message });
      step = 'basics';
    } else step = applyBuilderServerErrors(e, form.setError);
    if (step && reveal) deps.current.onReveal(step);
    setState({ kind: 'error', message: errorMessage(e), requestId: errorRequestId(e) });
  };

  /** The server derived the windows of a new draft: show them unless the user has started typing their own. */
  const adoptWindows = (cycle: CycleDetail) => {
    const server = { ...form.getValues(), ...windowsOf(cycle) };
    live.current.saved.windows = partJson(server, 'windows');
    const v = form.getValues();
    if ([v.sampling.start, v.sampling.end, v.assessment.start, v.assessment.end].some((x) => x !== '')) return;
    form.setValue('initiationDate', server.initiationDate);
    form.setValue('sampling.start', server.sampling.start);
    form.setValue('sampling.end', server.sampling.end);
    form.setValue('assessment.start', server.assessment.start);
    form.setValue('assessment.end', server.assessment.end);
  };

  const createDraft = async (values: BuilderValues): Promise<CycleDetail | null> => {
    const built = createInput(values, deps.current.fallback, new Date(), deps.current.placeholderDate?.(values.tz.trim()));
    if (!built) return null;
    setState({ kind: 'saving' });
    try {
      const cycle = await deps.current.create(built.input);
      live.current.id = cycle.id;
      live.current.saved = built.sent;
      setDraftId(cycle.id);
      if (built.sent.windows === undefined) adoptWindows(cycle);
      succeed(cycle);
      return cycle;
    } catch (e) {
      fail(e, true);
      return null;
    }
  };

  const patchDraft = async (id: string, values: BuilderValues, reveal: boolean): Promise<CycleDetail | null> => {
    const pending = pendingPatch(values, live.current.saved);
    if (!pending) {
      setState(live.current.at ? { kind: 'saved', at: live.current.at } : { kind: 'idle' });
      return live.current.cycle;
    }
    setState({ kind: 'saving' });
    try {
      const cycle = await deps.current.update({ id, ...pending.patch });
      live.current.saved = { ...live.current.saved, ...snapshotOf(values, pending.parts) };
      succeed(cycle);
      return cycle;
    } catch (e) {
      fail(e, reveal);
      return null;
    }
  };

  const schedule = () => {
    clearTimeout(timer.current);
    if (live.current.id === null || !pendingPatch(form.getValues(), live.current.saved)) return;
    setState({ kind: 'saving' });
    timer.current = setTimeout(() => void flushRef.current(false), AUTOSAVE_DELAY_MS);
  };

  const flush = async (allowCreate = false, reveal = false): Promise<CycleDetail | null> => {
    clearTimeout(timer.current);
    while (inflight.current) await inflight.current;
    const values = form.getValues();
    const id = live.current.id;
    const run = id === null ? (allowCreate ? createDraft(values) : Promise.resolve(null)) : patchDraft(id, values, reveal);
    inflight.current = run;
    const cycle = await run;
    inflight.current = null;
    measure();
    // Edits made while the request was out go in the next save.
    if (cycle) schedule();
    return cycle;
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  useEffect(() => {
    const sub = form.watch(() => {
      measure();
      scheduleRef.current();
    });
    return () => {
      sub.unsubscribe();
      clearTimeout(timer.current);
    };
  }, [form, measure]);

  const begin = useCallback(
    (values: BuilderValues, cycle: CycleDetail | null) => {
      live.current = { ...live.current, id: cycle?.id ?? null, saved: snapshotOf(values), cycle };
      setDraftId(cycle?.id ?? null);
      form.reset(values);
      measure();
    },
    [form, measure],
  );

  return {
    draftId,
    state,
    unsaved,
    begin,
    flush: useCallback((allowCreate?: boolean, reveal?: boolean) => flushRef.current(allowCreate, reveal), []),
    isUnsaved: useCallback(() => live.current.unsaved || inflight.current !== null, []),
    blockedNow: useCallback(() => (live.current.id === null ? [] : blockedParts(form.getValues(), live.current.saved)), [form]),
  };
}
