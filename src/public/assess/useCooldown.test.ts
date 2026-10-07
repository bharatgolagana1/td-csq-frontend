import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCooldown } from './useCooldown';

describe('useCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down once a second to zero', () => {
    const { result } = renderHook(() => useCooldown());
    expect(result.current.active).toBe(false);
    act(() => result.current.start(3));
    expect(result.current.remaining).toBe(3);
    expect(result.current.active).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(2);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(0);
    expect(result.current.active).toBe(false);
  });

  it('restarting replaces the running countdown', () => {
    const { result } = renderHook(() => useCooldown());
    act(() => result.current.start(30));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.remaining).toBe(25);
    act(() => result.current.start(10));
    expect(result.current.remaining).toBe(10);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(9);
  });

  it('stops its timer on unmount', () => {
    const { result, unmount } = renderHook(() => useCooldown());
    act(() => result.current.start(5));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
