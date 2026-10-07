import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { airportKeys } from './airports';
import { api } from './client';
import { type MarketShare, type MarketShareCycle, type MarketShareInput } from './marketshare.types';

/* market-share hooks (§6 organisations: GET/PUT /airports/:id/market-share). Keys: ['marketshare', ...]. */

export const marketShareKeys = {
  all: ['marketshare'] as const,
  airport: (airportId: string, cycleId: string | null) => ['marketshare', airportId, cycleId ?? 'current'] as const,
  cycles: ['marketshare', 'cycles'] as const,
};

function fetchMarketShare(airportId: string, cycleId: string | null, signal?: AbortSignal) {
  return api.get<MarketShare>(`/airports/${airportId}/market-share`, { query: { cycleId: cycleId ?? undefined }, signal });
}

/** The share set at an airport: the current default (`cycleId` null) or a cycle snapshot. */
export function useMarketShare(airportId: string | undefined, cycleId: string | null, enabled = true) {
  return useQuery({
    queryKey: marketShareKeys.airport(airportId ?? '', cycleId),
    queryFn: ({ signal }) => fetchMarketShare(airportId ?? '', cycleId, signal),
    enabled: enabled && Boolean(airportId),
  });
}

/** Whole-set save; the server validates total = 100 and refuses frozen cycles. */
export function useSaveMarketShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ airportId, ...input }: MarketShareInput & { airportId: string }) =>
      api.put<MarketShare>(`/airports/${airportId}/market-share`, { body: input }),
    onSuccess: (data) => {
      qc.setQueryData(marketShareKeys.airport(data.airportId, data.cycleId), data);
      void qc.invalidateQueries({ queryKey: marketShareKeys.all });
      void qc.invalidateQueries({ queryKey: airportKeys.detail(data.airportId) });
      void qc.invalidateQueries({ queryKey: ['operators'] });
    },
  });
}

/** Cycles for the cycle selector (GET /cycles [list]); the cycles feature owns the full hook. */
export function useMarketShareCycles(enabled = true) {
  return useQuery({
    queryKey: marketShareKeys.cycles,
    queryFn: ({ signal }) => api.list<MarketShareCycle>('/cycles', { pageSize: 100 }, { signal }),
    select: (page) => page.data,
    enabled,
  });
}

export type ShareHistoryRow = {
  cycle: MarketShareCycle;
  status: 'pending' | 'error' | 'success';
  /** The operator's share in that cycle's snapshot; null when the snapshot has no entry for it. */
  sharePct: number | null;
  total: number | null;
  frozen: boolean;
};

/** One operator's share per cycle snapshot (operator detail → Market share history). */
export function useOperatorShareHistory(airportId: string | undefined, acoId: string, cycles: MarketShareCycle[]) {
  return useQueries({
    queries: cycles.map((cycle) => ({
      queryKey: marketShareKeys.airport(airportId ?? '', cycle.id),
      queryFn: ({ signal }: { signal?: AbortSignal }) => fetchMarketShare(airportId ?? '', cycle.id, signal),
      enabled: Boolean(airportId),
    })),
    combine: (results): ShareHistoryRow[] =>
      results.map((r, i) => {
        const cycle = cycles[i] as MarketShareCycle;
        const entry = r.data?.entries.find((e) => e.acoId === acoId);
        return {
          cycle,
          status: r.isPending ? 'pending' : r.isError ? 'error' : 'success',
          sharePct: entry?.sharePct ?? null,
          total: r.data?.total ?? null,
          frozen: r.data?.frozen ?? false,
        };
      }),
  });
}
