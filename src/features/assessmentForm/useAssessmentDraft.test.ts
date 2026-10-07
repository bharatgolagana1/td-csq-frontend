import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NetworkError } from '@/api/client';

import { answer, FORM } from './testFixtures';
import { useAssessmentDraft } from './useAssessmentDraft';

const KEY = 'csq.test.draft';

// This jsdom build exposes no localStorage; the hook guards every access with try/catch,
// so an in-memory Storage is enough to exercise the replay queue.
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}
Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true, writable: true });

function setup(save = vi.fn().mockResolvedValue({ lastSavedAt: '2026-10-07T06:34:00.000Z' }), draft = [answer('q2')]) {
  const hook = renderHook(() => useAssessmentDraft({ form: FORM, draft, save, storageKey: KEY }));
  return { hook, save };
}

describe('useAssessmentDraft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces edits into one batched merge PATCH and reports the save time', async () => {
    const { hook, save } = setup();
    act(() => hook.result.current.setAnswer('q4', { rating: 5 }));
    act(() => hook.result.current.setAnswer('q3', { rating: 3 }));
    act(() => hook.result.current.setAnswer('q3', { comment: 'ok' }));
    expect(save).not.toHaveBeenCalled();
    expect(hook.result.current.pending).toBe(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(799);
    });
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith([
      { questionId: 'q4', rating: 5, na: false, comment: null, followUp: [] },
      { questionId: 'q3', rating: 3, na: false, comment: 'ok', followUp: [] },
    ]);
    expect(hook.result.current.status).toEqual({ kind: 'saved', at: '2026-10-07T06:34:00.000Z' });
    expect(hook.result.current.pending).toBe(0);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('keeps an incomplete answer local (Fair without the required comment) and counts progress', async () => {
    const { hook, save } = setup();
    act(() => hook.result.current.setAnswer('q1', { rating: 2 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(save).not.toHaveBeenCalled();
    expect(hook.result.current.pending).toBe(1);
    expect(hook.result.current.progress).toEqual({ answered: 2, total: 4, pct: 50 });
    expect(hook.result.current.readinessFor(0)).toMatchObject({ answered: 2, total: 2, missing: [], invalid: ['q1'], complete: false });
    expect(hook.result.current.readinessFor('c2')).toMatchObject({ answered: 0, total: 2, missing: ['q3', 'q4'], complete: false });

    act(() => hook.result.current.setAnswer('q1', { comment: 'Long queues', followUp: ['Queues', 'Not listed'] }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(save).toHaveBeenCalledWith([{ questionId: 'q1', rating: 2, na: false, comment: 'Long queues', followUp: ['Queues'] }]);
    expect(hook.result.current.readinessFor(0).complete).toBe(true);
  });

  it('goes offline on a network failure, keeps the queue on this device and replays when back online', async () => {
    const save = vi.fn().mockRejectedValueOnce(new NetworkError()).mockResolvedValue({ lastSavedAt: '2026-10-07T07:00:00.000Z' });
    const { hook } = setup(save);
    act(() => hook.result.current.setAnswer('q4', { na: true }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toEqual({ kind: 'offline', pending: 1 });
    const queued = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { v: number; answers: Record<string, { na: boolean }> };
    expect(queued.v).toBe(1);
    expect(queued.answers.q4?.na).toBe(true);

    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith([{ questionId: 'q4', rating: null, na: true, comment: null, followUp: [] }]);
    expect(hook.result.current.status).toEqual({ kind: 'saved', at: '2026-10-07T07:00:00.000Z' });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('replays a queue left by an earlier visit on mount, over the server draft', async () => {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, answers: { q2: { questionId: 'q2', rating: 1, na: false, comment: '', followUp: [] } } }));
    const { hook, save } = setup(undefined, [answer('q2', { rating: 5 })]);
    expect(hook.result.current.answerFor('q2')?.rating).toBe(1);
    expect(hook.result.current.pending).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(save).toHaveBeenCalledWith([{ questionId: 'q2', rating: 1, na: false, comment: null, followUp: [] }]);
    expect(hook.result.current.pending).toBe(0);
  });

  it('surfaces an API failure with retry and ignores a corrupt queue', async () => {
    localStorage.setItem(KEY, '{not json');
    const save = vi.fn().mockRejectedValueOnce(Object.assign(new Error('Boom'), { requestId: 'req_1' })).mockResolvedValue(undefined);
    const { hook } = setup(save);
    expect(hook.result.current.pending).toBe(0);
    act(() => hook.result.current.setAnswer('q4', { rating: 4 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(hook.result.current.status).toMatchObject({ kind: 'error', pending: 1 });
    await act(async () => {
      hook.result.current.retry();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(hook.result.current.status.kind).toBe('saved');
  });

  it('is inert when read-only', async () => {
    const save = vi.fn();
    const hook = renderHook(() => useAssessmentDraft({ form: FORM, draft: [], save, readOnly: true }));
    act(() => hook.result.current.setAnswer('q4', { rating: 4 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(save).not.toHaveBeenCalled();
    expect(hook.result.current.answerFor('q4')).toBeUndefined();
  });
});
