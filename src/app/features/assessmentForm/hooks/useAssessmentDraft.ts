import { useCallback, useEffect, useRef, useState } from 'react';
import type { DirectionCode, DraftAnswers, RatingValue } from '../api/assessmentForm.types';
import { saveDraft, writeLocalDraft } from '../api/assessmentForm.mock';
import { answerKey, emptyDraft, emptyFollowUp } from '../assessmentForm.logic';

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'failed' | 'local';

export interface DraftController {
  draft: DraftAnswers;
  saveState: SaveState;
  savedAt: string | null;
  setRating: (parameterId: string, direction: DirectionCode, value: RatingValue) => void;
  toggleReason: (parameterId: string, direction: DirectionCode, reason: string) => void;
  setNote: (parameterId: string, direction: DirectionCode, note: string) => void;
  setComment: (parameterId: string, comment: string) => void;
  saveNow: () => void;
}

/** Long enough that typing a note is not a save per keystroke, short enough to feel safe. */
const AUTOSAVE_MS = 1400;

export function useAssessmentDraft(
  token: string,
  initial: DraftAnswers | null,
  online: boolean,
): DraftController {
  const [draft, setDraft] = useState<DraftAnswers>(() => initial ?? emptyDraft());
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(initial?.savedAt ?? null);

  const dirty = useRef(false);
  const timer = useRef<number | null>(null);

  const flush = useCallback(
    async (next: DraftAnswers) => {
      setSaveState('saving');
      try {
        const result = await saveDraft(token, next);
        setSavedAt(result.savedAt);
        setSaveState('saved');
        dirty.current = false;
      } catch {
        // the device copy was already written, so nothing is lost
        setSaveState(navigator.onLine ? 'failed' : 'local');
      }
    },
    [token],
  );

  useEffect(() => {
    // the mount pass is not a change, and must not announce a save
    if (!dirty.current) return undefined;

    writeLocalDraft(token, draft);

    if (!online) {
      setSaveState('local');
      return undefined;
    }

    setSaveState('pending');
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void flush(draft);
    }, AUTOSAVE_MS);

    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [draft, token, online, flush]);

  const saveNow = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (!online) {
      writeLocalDraft(token, draft);
      setSaveState('local');
      return;
    }
    void flush(draft);
  }, [draft, flush, online, token]);

  const setRating = useCallback(
    (parameterId: string, direction: DirectionCode, value: RatingValue) => {
      dirty.current = true;
      setDraft((d) => ({
        ...d,
        ratings: { ...d.ratings, [answerKey(parameterId, direction)]: value },
      }));
    },
    [],
  );

  const toggleReason = useCallback(
    (parameterId: string, direction: DirectionCode, reason: string) => {
      dirty.current = true;
      setDraft((d) => {
        const key = answerKey(parameterId, direction);
        const current = d.followUps[key] ?? emptyFollowUp();
        const reasons = current.reasons.includes(reason)
          ? current.reasons.filter((r) => r !== reason)
          : [...current.reasons, reason];
        return { ...d, followUps: { ...d.followUps, [key]: { ...current, reasons } } };
      });
    },
    [],
  );

  const setNote = useCallback((parameterId: string, direction: DirectionCode, note: string) => {
    dirty.current = true;
    setDraft((d) => {
      const key = answerKey(parameterId, direction);
      const current = d.followUps[key] ?? emptyFollowUp();
      return { ...d, followUps: { ...d.followUps, [key]: { ...current, note } } };
    });
  }, []);

  const setComment = useCallback((parameterId: string, comment: string) => {
    dirty.current = true;
    setDraft((d) => ({ ...d, comments: { ...d.comments, [parameterId]: comment } }));
  }, []);

  return { draft, saveState, savedAt, setRating, toggleReason, setNote, setComment, saveNow };
}

export default useAssessmentDraft;
