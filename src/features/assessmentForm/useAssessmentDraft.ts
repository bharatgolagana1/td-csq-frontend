import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type Answer, type AnswerDirection, type AnswerInput, type AnswerMode, type AssessmentForm, type Progress, type SectionRemark } from '@/api/assessments.types';
import { errorMessage, errorRequestId, NetworkError } from '@/api/client';

import { answerKey, answersToMap, emptyAnswer, formSteps, isSendable, missingRemarks, progressOf, readinessOf, REMARK_MAX_LENGTH, remarksToMap, stepQuestions, toAnswerInput } from './rules';
import { type AnswerPatch, type FormStep, type LocalAnswer, type SaveStatus, type SectionReadiness, type StepReadiness } from './types';

/* Local answer state with debounced, batched autosave (ARCHITECTURE §6: "Saved ·
   12:04 / Saving… / Offline — kept on this device" and a localStorage replay
   queue). Transport-agnostic: the caller injects `save(answers)`, which is the
   signed-in PATCH for the self-assessment and the link-token PATCH for the
   public flow.

   Only answers that pass the form rules are sent (the server refuses the whole
   batch otherwise); a changed-but-incomplete answer stays local and shows its
   inline validation until it is complete.

   Answers are keyed by `answerKey`: the question id, or question + direction
   on an IMPORT_EXPORT form, where every question is answered twice.

   Section remarks (one per category) ride the same scheduler: a flush sends
   the changed answers through `save` and the changed remarks through
   `saveRemarks` (a merge by category; an empty remark clears it), the queue
   keeps both, and the save status covers both. */

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
  /** The section remarks saved on the server when the form was loaded. Read once; remount to reload. */
  remarks?: readonly SectionRemark[];
  /** Merge-saves a batch of changed section remarks, like `save`. Without it remarks stay local. */
  saveRemarks?: (remarks: SectionRemark[]) => Promise<unknown>;
  /** localStorage key of the replay queue. Omit to keep unsaved answers in memory only. */
  storageKey?: string;
  /** Debounce before a batch is sent (default 800 ms). */
  debounceMs?: number;
  /** Submitted forms: no local changes, no saves. */
  readOnly?: boolean;
  /** The assessment's answer mode (default SINGLE); IMPORT_EXPORT counts and validates both directions of every question. */
  answerMode?: AnswerMode;
};

export type UseAssessmentDraftResult = {
  answers: ReadonlyMap<string, LocalAnswer>;
  /** The local answer of a question (of one of its directions on an IMPORT_EXPORT form). */
  answerFor: (questionId: string, direction?: AnswerDirection) => LocalAnswer | undefined;
  setAnswer: (questionId: string, patch: AnswerPatch, direction?: AnswerDirection) => void;
  /** The local remark of each section (category id → text). */
  remarks: ReadonlyMap<string, string>;
  remarkFor: (categoryId: string) => string;
  setRemark: (categoryId: string, remark: string) => void;
  status: SaveStatus;
  /** Changed answers and remarks not yet confirmed by the server (sendable or not). */
  pending: number;
  progress: Progress;
  steps: FormStep[];
  /** Readiness of the whole form: every question answered and every section remarked. */
  readiness: SectionReadiness;
  /** Readiness of one step (its questions and its remark), by index or category id. */
  readinessFor: (step: number | string) => SectionReadiness;
  /** Sends everything sendable now. Resolves true when nothing sendable remains unsaved. */
  flush: () => Promise<boolean>;
  retry: () => void;
};

const QUEUE_VERSION = 1;
/** `remarks` (category id → text) is absent from queues written before section remarks existed. */
type Queue = { v: number; answers: Record<string, LocalAnswer>; remarks?: Record<string, string> };
type QueuedChanges = { answers: Record<string, LocalAnswer>; remarks: Record<string, string> };

function readQueue(key: string | undefined): QueuedChanges {
  const none: QueuedChanges = { answers: {}, remarks: {} };
  if (!key) return none;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return none;
    const parsed = JSON.parse(raw) as Partial<Queue>;
    if (parsed.v !== QUEUE_VERSION || !parsed.answers || typeof parsed.answers !== 'object') return none;
    const out: Record<string, LocalAnswer> = {};
    Object.values(parsed.answers).forEach((a) => {
      if (a && typeof a === 'object' && typeof a.questionId === 'string') {
        const direction = a.direction === 'IMPORT' || a.direction === 'EXPORT' ? a.direction : undefined;
        out[answerKey(a.questionId, direction)] = { questionId: a.questionId, ...(direction ? { direction } : {}), rating: a.rating ?? null, na: Boolean(a.na), comment: typeof a.comment === 'string' ? a.comment : '', followUp: Array.isArray(a.followUp) ? a.followUp : [] };
      }
    });
    const remarks: Record<string, string> = {};
    if (parsed.remarks && typeof parsed.remarks === 'object') {
      Object.entries(parsed.remarks).forEach(([categoryId, remark]) => {
        if (typeof remark === 'string') remarks[categoryId] = remark.slice(0, REMARK_MAX_LENGTH);
      });
    }
    return { answers: out, remarks };
  } catch {
    return none;
  }
}

function writeQueue(key: string | undefined, { answers, remarks }: QueuedChanges): void {
  if (!key) return;
  try {
    if (Object.keys(answers).length === 0 && Object.keys(remarks).length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify({ v: QUEUE_VERSION, answers, remarks } satisfies Queue));
  } catch {
    /* storage unavailable: answers stay in memory */
  }
}

/** A step's (or the form's) answer readiness with its missing remarks folded in. */
function withRemarks(readiness: StepReadiness, missing: string[]): SectionReadiness {
  return { ...readiness, missingRemarks: missing, complete: readiness.complete && missing.length === 0 };
}

export function useAssessmentDraft({ form, draft, save, remarks: savedRemarks = [], saveRemarks, storageKey, debounceMs = 800, readOnly = false, answerMode = 'SINGLE' }: UseAssessmentDraftOptions): UseAssessmentDraftResult {
  const steps = useMemo(() => formSteps(form), [form]);
  const allQuestions = useMemo(() => stepQuestions(steps), [steps]);
  const questionById = useMemo(() => new Map(allQuestions.map((q) => [q.question.id, q.question])), [allQuestions]);

  const [initial] = useState(() => {
    const map = answersToMap(draft);
    const remarkMap = remarksToMap(savedRemarks);
    const queued = readOnly ? { answers: {}, remarks: {} } : readQueue(storageKey);
    Object.entries(queued.answers).forEach(([key, a]) => map.set(key, a));
    Object.entries(queued.remarks).forEach(([categoryId, remark]) => remarkMap.set(categoryId, remark));
    return { map, remarkMap, queued: Object.keys(queued.answers), queuedRemarks: Object.keys(queued.remarks) };
  });

  const [answers, setAnswers] = useState<Map<string, LocalAnswer>>(initial.map);
  const answersRef = useRef(initial.map);
  const dirtyRef = useRef<Map<string, number>>(new Map());
  const [remarks, setRemarks] = useState<Map<string, string>>(initial.remarkMap);
  const remarksRef = useRef(initial.remarkMap);
  const remarkDirtyRef = useRef<Map<string, number>>(new Map());
  const versionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const mountedRef = useRef(true);
  const replayedRef = useRef(false);
  // The latest `save` without re-creating flush/schedule when its identity changes.
  const saveRef = useRef(save);
  const saveRemarksRef = useRef(saveRemarks);
  useEffect(() => {
    saveRef.current = save;
    saveRemarksRef.current = saveRemarks;
  }, [save, saveRemarks]);
  const [pending, setPending] = useState(0);
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  /** Changed answers and remarks the server has not confirmed. */
  const unsaved = useCallback(() => dirtyRef.current.size + remarkDirtyRef.current.size, []);

  const persistQueue = useCallback(() => {
    const queued: QueuedChanges = { answers: {}, remarks: {} };
    dirtyRef.current.forEach((_v, id) => {
      const a = answersRef.current.get(id);
      if (a) queued.answers[id] = a;
    });
    remarkDirtyRef.current.forEach((_v, id) => {
      queued.remarks[id] = remarksRef.current.get(id) ?? '';
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
      const answer = answersRef.current.get(id);
      const question = answer ? questionById.get(answer.questionId) : undefined;
      if (!question || !answer) {
        dirtyRef.current.delete(id);
        return;
      }
      if (isSendable(question, answer)) batch.push({ id, version, input: toAnswerInput(question, answer) });
    });
    const saveRemarksNow = saveRemarksRef.current;
    const remarkBatch: { id: string; version: number; input: SectionRemark }[] = [];
    remarkDirtyRef.current.forEach((version, id) => {
      if (!saveRemarksNow || !steps.some((s) => s.id === id)) {
        remarkDirtyRef.current.delete(id);
        return;
      }
      remarkBatch.push({ id, version, input: { categoryId: id, remark: (remarksRef.current.get(id) ?? '').trim() } });
    });
    if (batch.length === 0 && remarkBatch.length === 0) {
      if (mountedRef.current) setPending(unsaved());
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (mountedRef.current) setStatus({ kind: 'offline', pending: unsaved() });
      return false;
    }

    if (mountedRef.current) setStatus({ kind: 'saving' });
    const run = (async () => {
      try {
        let savedAt: string | undefined;
        if (batch.length > 0) {
          const result = await saveRef.current(batch.map((b) => b.input));
          batch.forEach((b) => {
            if (dirtyRef.current.get(b.id) === b.version) dirtyRef.current.delete(b.id);
          });
          persistQueue();
          savedAt = lastSavedAtOf(result);
        }
        if (remarkBatch.length > 0 && saveRemarksNow) {
          const result = await saveRemarksNow(remarkBatch.map((b) => b.input));
          remarkBatch.forEach((b) => {
            if (remarkDirtyRef.current.get(b.id) === b.version) remarkDirtyRef.current.delete(b.id);
          });
          persistQueue();
          savedAt = lastSavedAtOf(result) ?? savedAt;
        }
        if (mountedRef.current) {
          setPending(unsaved());
          setStatus({ kind: 'saved', at: savedAt ?? new Date().toISOString() });
        }
        return true;
      } catch (e) {
        if (mountedRef.current) {
          const count = unsaved();
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
    if (ok && mountedRef.current && unsaved() > 0 && !timerRef.current) {
      timerRef.current = setTimeout(() => void flush(), debounceMs);
    }
    return ok;
  }, [debounceMs, persistQueue, questionById, readOnly, steps, unsaved]);

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
    (questionId: string, patch: AnswerPatch, direction?: AnswerDirection) => {
      if (readOnly) return;
      const key = answerKey(questionId, direction);
      const current = answersRef.current.get(key) ?? emptyAnswer(questionId, direction);
      const merged: LocalAnswer = { ...current, ...patch };
      if (patch.na === true) merged.rating = null;
      if (patch.rating !== undefined && patch.rating !== null) merged.na = false;
      const next = new Map(answersRef.current);
      next.set(key, merged);
      answersRef.current = next;
      setAnswers(next);
      dirtyRef.current.set(key, ++versionRef.current);
      setPending(unsaved());
      persistQueue();
      schedule(debounceMs);
    },
    [debounceMs, persistQueue, readOnly, schedule, unsaved],
  );

  const setRemark = useCallback(
    (categoryId: string, remark: string) => {
      if (readOnly) return;
      const next = new Map(remarksRef.current);
      next.set(categoryId, remark.slice(0, REMARK_MAX_LENGTH));
      remarksRef.current = next;
      setRemarks(next);
      if (!saveRemarksRef.current) return;
      remarkDirtyRef.current.set(categoryId, ++versionRef.current);
      setPending(unsaved());
      persistQueue();
      schedule(debounceMs);
    },
    [debounceMs, persistQueue, readOnly, schedule, unsaved],
  );

  const retry = useCallback(() => {
    void flush();
  }, [flush]);

  // Replay anything the queue held from an earlier visit.
  useEffect(() => {
    mountedRef.current = true;
    const queuedRemarks = saveRemarksRef.current ? initial.queuedRemarks : [];
    if (initial.queued.length + queuedRemarks.length > 0 && !readOnly && !replayedRef.current) {
      replayedRef.current = true;
      initial.queued.forEach((id) => dirtyRef.current.set(id, ++versionRef.current));
      queuedRemarks.forEach((id) => remarkDirtyRef.current.set(id, ++versionRef.current));
      setPending(unsaved());
      schedule(0);
    }
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [initial, readOnly, schedule, unsaved]);

  // Back online: send the queue. Offline: say so while something is unsaved.
  useEffect(() => {
    const onOnline = () => void flush();
    const onOffline = () => {
      if (unsaved() > 0) setStatus({ kind: 'offline', pending: unsaved() });
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flush, unsaved]);

  const remarksMissing = useMemo(() => missingRemarks(steps, remarks), [steps, remarks]);
  const stepReadiness = useMemo(() => steps.map((s) => withRemarks(readinessOf(s.questions, answers, answerMode), remarksMissing.filter((id) => id === s.id))), [steps, answers, answerMode, remarksMissing]);
  const readiness = useMemo(() => withRemarks(readinessOf(allQuestions, answers, answerMode), remarksMissing), [allQuestions, answers, answerMode, remarksMissing]);
  const progress = useMemo(() => progressOf(readiness.answered, readiness.total), [readiness]);

  const readinessFor = useCallback(
    (step: number | string): SectionReadiness => {
      const index = typeof step === 'number' ? step : steps.findIndex((s) => s.id === step);
      return stepReadiness[index] ?? { answered: 0, total: 0, missing: [], invalid: [], missingRemarks: [], complete: true };
    },
    [stepReadiness, steps],
  );

  const answerFor = useCallback((questionId: string, direction?: AnswerDirection) => answers.get(answerKey(questionId, direction)), [answers]);
  const remarkFor = useCallback((categoryId: string) => remarks.get(categoryId) ?? '', [remarks]);

  return { answers, answerFor, setAnswer, remarks, remarkFor, setRemark, status, pending, progress, steps, readiness, readinessFor, flush, retry };
}
