import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({ getAccessToken: async () => 'tok', forceRefreshToken: async () => false }));

import { applySettingsPatch, settingsKeys, useUpdateSettings } from './settings';
import { type Settings } from './types';

const SETTINGS: Settings = {
  scoring: { minResponses: 3, weightingMode: 'EQUAL' },
  defaults: { samplingDays: 10, assessmentDays: 30, reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 10, everyDays: 2 } }, tz: 'Asia/Kolkata' },
  branding: { orgName: 'Air Cargo Forum India' },
  revealAssessorIdentity: false,
  rbacVersion: 4,
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('applySettingsPatch', () => {
  it('merges a partial section without touching the others', () => {
    const next = applySettingsPatch(SETTINGS, { defaults: { reminders: { assessment: { count: 12, everyDays: 2 } }, tz: 'Asia/Dubai' } });
    expect(next.defaults).toEqual({ samplingDays: 10, assessmentDays: 30, reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 12, everyDays: 2 } }, tz: 'Asia/Dubai' });
    expect(next.scoring).toBe(SETTINGS.scoring === next.scoring ? SETTINGS.scoring : next.scoring);
    expect(next.scoring).toEqual(SETTINGS.scoring);
    expect(applySettingsPatch(SETTINGS, { revealAssessorIdentity: true }).revealAssessorIdentity).toBe(true);
    expect(applySettingsPatch(SETTINGS, {}).revealAssessorIdentity).toBe(false);
  });
});

describe('useUpdateSettings', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let qc: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    qc.setQueryData(settingsKeys.all, SETTINGS);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates the cache optimistically and keeps the server document on success', async () => {
    let resolve: (r: Response) => void = () => undefined;
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)));
    const { result } = renderHook(() => useUpdateSettings(), { wrapper });
    act(() => {
      result.current.mutate({ scoring: { minResponses: 5 } });
    });
    await waitFor(() => expect(qc.getQueryData<Settings>(settingsKeys.all)?.scoring.minResponses).toBe(5));
    resolve(jsonResponse(200, { data: { ...SETTINGS, scoring: { minResponses: 5, weightingMode: 'EQUAL' }, rbacVersion: 5 } }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(qc.getQueryData<Settings>(settingsKeys.all)?.rbacVersion).toBe(5);
    const [, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit];
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe('{"scoring":{"minResponses":5}}');
  });

  it('rolls the cache back when the PATCH fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { error: { code: 'INTERNAL', message: 'Mongo is down', requestId: 'req_9' } }));
    const { result } = renderHook(() => useUpdateSettings(), { wrapper });
    act(() => {
      result.current.mutate({ branding: { orgName: 'ACFI' } });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<Settings>(settingsKeys.all)?.branding.orgName).toBe('Air Cargo Forum India');
  });
});
