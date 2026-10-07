import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { api } from '@/api/client';
import { cycleKeys, useCycles } from '@/api/cycles';
import { type CycleDetail, type CycleParticipant, type CycleSummary } from '@/api/cycles.types';
import { useRegistrations } from '@/api/onboarding';
import { type Registration } from '@/api/onboarding.types';
import { useOperators } from '@/api/organisations';
import { type Operator } from '@/api/operators.types';
import { useSession } from '@/auth/session';

/* Everything the overview shows, derived from the module hooks: active cycles,
   operators still unlocked in open sampling windows, airports whose current
   market shares do not total 100, registrations waiting for review. */

const ACTIVE = new Set(['PUBLISHED', 'SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN', 'ASSESSMENT_CLOSED']);
export const SHARE_TOLERANCE = 0.01;
/** "Closing soon" = within this many days. */
export const SOON_DAYS = 3;

export type UnlockedOperator = { cycle: CycleSummary; participant: CycleParticipant; closesAt: string; soon: boolean };
export type ShareProblem = { airport: Operator['airport']; total: number; operators: number };

/** Pure: operators not LOCKED in SAMPLING_OPEN cycles, soonest closing first. */
export function unlockedOperators(cycles: CycleSummary[], details: (CycleDetail | undefined)[], now = new Date()): UnlockedOperator[] {
  const out: UnlockedOperator[] = [];
  cycles.forEach((cycle, i) => {
    const detail = details[i];
    if (!detail || cycle.status !== 'SAMPLING_OPEN') return;
    const closesAt = cycle.sampling.end.utc;
    const soon = new Date(closesAt).getTime() - now.getTime() <= SOON_DAYS * 86_400_000;
    detail.participantList
      .filter((p) => p.sampling.status !== 'LOCKED')
      .forEach((participant) => out.push({ cycle, participant, closesAt, soon }));
  });
  return out.sort((a, b) => a.closesAt.localeCompare(b.closesAt) || a.participant.operator.name.localeCompare(b.participant.operator.name));
}

/** Pure: airports whose active operators' current shares do not total 100 (what publish refuses). */
export function shareProblems(operators: Operator[]): ShareProblem[] {
  const byAirport = new Map<string, { airport: Operator['airport']; total: number; operators: number }>();
  operators.forEach((o) => {
    const entry = byAirport.get(o.airport.id) ?? { airport: o.airport, total: 0, operators: 0 };
    entry.total += o.currentShare ?? 0;
    entry.operators += 1;
    byAirport.set(o.airport.id, entry);
  });
  return Array.from(byAirport.values())
    .map((e) => ({ ...e, total: Math.round(e.total * 100) / 100 }))
    .filter((e) => Math.abs(e.total - 100) > SHARE_TOLERANCE)
    .sort((a, b) => a.airport.iata.localeCompare(b.airport.iata));
}

export function useOverviewData() {
  const { hasTask } = useSession();
  const cycles = useCycles({ pageSize: 50, sort: '-sampling.start.utc' });
  const active = useMemo(() => (cycles.data?.data ?? []).filter((c) => ACTIVE.has(c.status)), [cycles.data]);
  const samplingOpen = useMemo(() => active.filter((c) => c.status === 'SAMPLING_OPEN'), [active]);

  const details = useQueries({
    queries: samplingOpen.map((c) => ({
      queryKey: cycleKeys.detail(c.id),
      queryFn: ({ signal }: { signal?: AbortSignal }) => api.get<CycleDetail>(`/cycles/${c.id}`, { signal }),
    })),
  });
  const detailData = details.map((d) => d.data);
  const detailsLoading = details.some((d) => d.isPending);

  const canSeeOperators = hasTask('operators.view');
  const canReview = hasTask('onboarding.review');
  const operators = useOperators({ status: 'ACTIVE', pageSize: 200 }, canSeeOperators);
  const registrations = useRegistrations({ status: 'SUBMITTED', pageSize: 5, sort: 'createdAt' }, canReview);

  const unlocked = useMemo(() => unlockedOperators(samplingOpen, detailData), [samplingOpen, detailData]);
  const shares = useMemo(() => shareProblems(operators.data?.data ?? []), [operators.data]);
  const pending: Registration[] = registrations.data?.data ?? [];
  const pendingTotal = registrations.data?.meta.total ?? 0;

  return {
    cycles,
    active,
    unlocked,
    unlockedLoading: detailsLoading,
    shares,
    sharesEnabled: canSeeOperators,
    sharesLoading: canSeeOperators && operators.isPending,
    pending,
    pendingTotal,
    pendingEnabled: canReview,
    pendingLoading: canReview && registrations.isPending,
  };
}
