import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type Answer, type AnswerInput, type AssessmentForm, type Progress } from '@/api/assessments.types';
import { errorMessage, errorRequestId, NetworkError } from '@/api/client';

import { answersToMap, emptyAnswer, formSteps, isSendable, progressOf, readinessOf, stepQuestions, toAnswerInput } from './rules';
import { type AnswerPatch, type FormStep, type LocalAnswer, type SaveStatus, type StepReadiness } from './types';

/* Local answer state with debounced, batched autosave (ARCHITECTURE §6: "Saved ·
   12:04 / Saving… / Offline — kept on this device" and a localStorage replay
   queue). Transport-agnostic: the caller injects `save(answers)`, which is the
   signed-in PATCH for the self-assessment and the link-token PATCH for the
   public flow.

   Only answers that pass the form rules are sent (the server refuses the whole
   batch otherwise); a changed-but-incomplete answer stays local and shows its
   inline validation until it is complete. */

/** What `save` may resolve to; `lastSavedAt` (the PATCH response) is used for "Saved · 12:04" when present. */
export type SaveResult = { lastSavedAt?: string | null };

function lastSavedAtOf(result: unknown): string | undefined {
  if (result && typeof result === 'object' && 'lastSavedAt' in result && typeof (result as SaveResult).lastSavedAt === 'string') {
    return (result as SaveResult).lastSavedAt ?? undefined;
  }
  return undefined;
}

export type UseAssessmentDraftOptions = {
  form: AssessmentForm;
  /** The answers saved on the server when the form was loaded. Read once; remount to reload. */
  draft: readonly Answer[];
  /** Merge-saves a batch of changed answers; may resolve to a `SaveResult`. Throw to signal failure (NetworkError ⇒ offline). */
  save: (answers: AnswerInput[]) => Promise<unknown>;
  /** localStorage key of the replay queue. Omit to keep unsaved answers in memory only. */
  storageKey?: string;
  /** Debounce before a batch is sent (default 800 ms). */
  debounceMs?: number;
  /** Submitted forms: no local changes, no saves. */
  readOnly?: boolean;
};

export type UseAssessmentDraftResult = {
  answers: ReadonlyMap<string, LocalAnswer>;
  answerFor: (questionId: string) => LocalAnswer | undefined;
  setAnswer: (questionId: string, patch: AnswerPatch) => void;
  status: SaveStatus;
  /** Changed answers not yet confirmed by the server (sendable or not). */
  pending: number;
  progress: Progress;
  steps: FormStep[];
  /** Readiness of the whole form. */
  readiness: StepReadiness;
  /** Readiness of one step, by index or category id. */
  readinessFor: (step: number | string) => StepReadiness;
  /** Sends everything sendable now. Resolves true when nothing sendable remains unsaved. */
  flush: () => Promise<boolean>;
  retry: () => void;
};

const QUEUE_VERSION = 1;
type Queue = { v: number; answers: Record<string, LocalAnswer> };

function readQueue(key: string | undefined): Record<string, LocalAnswer> {
  if (!key) return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Queue>;
    if (parsed.v !== QUEUE_VERSION || !parsed.answers || typeof parsed.answers !== 'object') return {};
    const out: Record<string, LocalAnswer> = {};
    Object.entries(parsed.answers).forEach(([id, a]) => {
      if (a && typeof a === 'object' && typeof a.questionId === 'string') {
        out[id] = { questionId: a.questionId, rating: a.rating ?? null, na: Boolean(a.na), comment: typeof a.comment === 'string' ? a.comment : '', followUp: Array.isArray(a.followUp) ? a.followUp : [] };
      }
    });
    return out;
  } catch {
    return {};
  }
}

function writeQueue(key: string | undefined, answers: Record<string, LocalAnswer>): void {
  if (!key) return;
  try {
    if (Object.keys(answers).length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify({ v: QUEUE_VERSION, answers } satisfies Queue));
  } catch {
    /* storage unavailable: answers stay in memory */
  }
}

export function useAssessmentDraft({ form, draft, save, storageKey, debounceMs = 800, readOnly = false }: UseAssessmentDraftOptions): UseAssessmentDraftResult {
  const steps = useMemo(() => formSteps(form), [form]);
  const allQuestions = useMemo(() => stepQuestions(steps), [steps]);
  const questionById = useMemo(() => new Map(allQuestions.map((q) => [q.question.id, q.question])), [allQuestions]);

  const [initial] = useState(() => {
    const map = answersToMap(draft);
    const queued = readOnly ? {} : readQueue(storageKey);
    Object.values(queued).forEach((a) => map.set(a.questionId, a));
    return { map, queued: Object.keys(queued) };
  });

  const [answers, setAnswers] = useState<Map<string, LocalAnswer>>(initial.map);
  const answersRef = useRef(initial.map);
  const dirtyRef = useRef<Map<string, number>>(new Map());
  const versionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const mountedRef = useRef(true);
  const replayedRef = useRef(false);
  // The latest `save` without re-creating flush/schedule when its identity changes.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  const [pending, setPending] = useState(0);
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  const persistQueue = useCallback(() => {
    const queued: Record<string, LocalAnswer> = {};
    dirtyRef.current.forEach((_v, id) => {
      const a = answersRef.current.get(id);
      if (a) queued[id] = a;
    });
    writeQueue(storageKey, queued);
  }, [storageKey]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
    if (inFlightRef.current) await inFlightRef.current;
    if (readOnly) return true;

    const batch: { id: string; version: number; input: AnswerInput }[] = [];
    dirtyRef.current.forEach((version, id) => {
      const question = questionById.get(id);
      const answer = answersRef.current.get(id);
      if (!question || !answer) {
        dirtyRef.current.delete(id);
        return;
      }
      if (isSendable(question, answer)) batch.push({ id, version, input: toAnswerInput(question, answer) });
    });
    if (batch.length === 0) {
      if (mountedRef.current) setPending(dirtyRef.current.size);
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (mountedRef.current) setStatus({ kind: 'offline', pending: dirtyRef.current.size });
      return false;
    }

    if (mountedRef.current) setStatus({ kind: 'saving' });
    const run = (async () => {
      try {
        const result = await saveRef.current(batch.map((b) => b.input));
        batch.forEach((b) => {
          if (dirtyRef.current.get(b.id) === b.version) dirtyRef.current.delete(b.id);
        });
        persistQueue();
        if (mountedRef.current) {
          setPending(dirtyRef.current.size);
          setStatus({ kind: 'saved', at: lastSavedAtOf(result) ?? new Date().toISOString() });
        }
        return true;
      } catch (e) {
        if (mountedRef.current) {
          const count = dirtyRef.current.size;
          if (e instanceof NetworkError) setStatus({ kind: 'offline', pending: count });
          else {
            const requestId = errorRequestId(e);
            setStatus({ kind: 'error', message: errorMessage(e), pending: count, ...(requestId ? { requestId } : {}) });
          }
        }
        return false;
      } finally {
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = run;
    const ok = await run;
    // Edits made during the save are still dirty: send them after the usual pause.
    if (ok && mountedRef.current && dirtyRef.current.size > 0 && !timerRef.current) {
      timerRef.current = setTimeout(() => void flush(), debounceMs);
    }
    return ok;
  }, [debounceMs, persistQueue, questionById, readOnly]);

  const schedule = useCallback(
    (ms: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined;
        void flush();
      }, ms);
    },
    [flush],
  );

  const setAnswer = useCallback(
    (questionId: string, patch: AnswerPatch) => {
      if (readOnly) return;
      const current = answersRef.current.get(questionId) ?? emptyAnswer(questionId);
      const merged: LocalAnswer = { ...current, ...patch };
      if (patch.na === true) merged.rating = null;
      if (patch.rating !== undefined && patch.rating !== null) merged.na = false;
      const next = new Map(answersRef.current);
      next.set(questionId, merged);
      answersRef.current = next;
      setAnswers(next);
      dirtyRef.current.set(questionId, ++versionRef.current);
      setPending(dirtyRef.current.size);
      persistQueue();
      schedule(debounceMs);
    },
    [debounceMs, persistQueue, readOnly, schedule],
  );

  const retry = useCallback(() => {
    void flush();
  }, [flush]);

  // Replay anything the queue held from an earlier visit.
  useEffect(() => {
    mountedRef.current = true;
    if (initial.queued.length > 0 && !readOnly && !replayedRef.current) {
      replayedRef.current = true;
      initial.queued.forEach((id) => dirtyRef.current.set(id, ++versionRef.current));
      setPending(dirtyRef.current.size);
      schedule(0);
    }
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [initial, readOnly, schedule]);

  // Back online: send the queue. Offline: say so while something is unsaved.
  useEffect(() => {
    const onOnline = () => void flush();
    const onOffline = () => {
      if (dirtyRef.current.size > 0) setStatus({ kind: 'offline', pending: dirtyRef.current.size });
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flush]);

  const stepReadiness = useMemo(() => steps.map((s) => readinessOf(s.questions, answers)), [steps, answers]);
  const readiness = useMemo(() => readinessOf(allQuestions, answers), [allQuestions, answers]);
  const progress = useMemo(() => progressOf(readiness.answered, readiness.total), [readiness]);

  const readinessFor = useCallback(
    (step: number | string): StepReadiness => {
      const index = typeof step === 'number' ? step : steps.findIndex((s) => s.id === step);
      return stepReadiness[index] ?? { answered: 0, total: 0, missing: [], invalid: [], complete: true };
    },
    [stepReadiness, steps],
  );

  const answerFor = useCallback((questionId: string) => answers.get(questionId), [answers]);

  return { answers, answerFor, setAnswer, status, pending, progress, steps, readiness, readinessFor, flush, retry };
}
