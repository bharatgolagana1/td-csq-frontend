import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({ getAccessToken: async () => null, forceRefreshToken: async () => false }));

import { useOperatorReport } from './reports';
import { OPERATOR_REPORT_EXPORT, OPERATOR_REPORT_IMPORT } from './reports.fixtures';
import { type ReportQuery } from './reports.types';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('report queries keep the previous payload only within one direction', () => {
  const fetchMock = vi.fn<typeof fetch>();
  /** `cycleId:direction` (direction `-` when not sent) of the requests that never answer. */
  const pending = new Set<string>();
  let qc: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    pending.clear();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchMock.mockImplementation(async (input) => {
      const url = new URL(String(input), 'http://localhost');
      const cycleId = url.searchParams.get('cycleId') ?? '';
      const direction = url.searchParams.get('direction');
      if (pending.has(`${cycleId}:${direction ?? '-'}`)) return new Promise<Response>(() => undefined);
      const report = direction === 'EXPORT' ? OPERATOR_REPORT_EXPORT : OPERATOR_REPORT_IMPORT;
      return jsonResponse(200, { data: { ...report, cycle: { ...report.cycle, id: cycleId } } });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('holds the frame across a cycle change, shows nothing across a direction change', async () => {
    pending.add('c2:-').add('c2:EXPORT');
    const { result, rerender } = renderHook(({ query }: { query: ReportQuery }) => useOperatorReport('org-csc', query), { wrapper, initialProps: { query: { cycleId: 'c1' } as ReportQuery } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.direction).toBe('IMPORT');

    // Another cycle, same (default) direction: the previous payload holds the frame.
    rerender({ query: { cycleId: 'c2' } });
    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data).toMatchObject({ direction: 'IMPORT', cycle: { id: 'c1' } });

    // Export picked: no placeholder, so no import figures while export loads.
    rerender({ query: { cycleId: 'c2', direction: 'EXPORT' } });
    expect(result.current.isPlaceholderData).toBe(false);
    expect(result.current.data).toBeUndefined();

    // Export figures in hand, then another cycle in export: those are kept.
    rerender({ query: { cycleId: 'c1', direction: 'EXPORT' } });
    await waitFor(() => expect(result.current.data?.direction).toBe('EXPORT'));
    rerender({ query: { cycleId: 'c2', direction: 'EXPORT' } });
    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data).toMatchObject({ direction: 'EXPORT', cycle: { id: 'c1' } });

    // And back to the default direction from there: nothing again.
    rerender({ query: { cycleId: 'c2' } });
    expect(result.current.data).toBeUndefined();
  });
});
