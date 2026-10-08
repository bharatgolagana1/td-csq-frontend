import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, isApiError } from './client';
import { type Customer, type CustomerSurveyType } from './customers.types';
import {
  type CurrentCycle,
  type CycleType,
  type EligibleEntry,
  type LockReason,
  type SamplingAuditEntry,
  type SelectionChange,
  type SelectionInput,
  type SelectionItem,
  type SelectionRow,
  type SelectionState,
  type SurveyType,
} from './sampling.types';
import { type ListQuery } from './types';

/* sampling module hooks (§6 sampling, §7 "Sampling"). The selection mutation is
   optimistic (ARCHITECTURE §5); everything else invalidates precisely. */

export const samplingKeys = {
  all: ['sampling'] as const,
  current: (acoId: string) => ['cycles', 'current', acoId] as const,
  state: (cycleId: string, acoId: string) => ['sampling', 'cycles', cycleId, acoId] as const,
  audit: (cycleId: string, acoId: string, query: ListQuery) => ['sampling', 'cycles', cycleId, 'audit', acoId, query] as const,
  /** Under the customers root so customer mutations invalidate the eligible table too. */
  eligible: (acoId: string, cycleId: string) => ['customers', 'eligible', acoId, cycleId] as const,
};

/** `GET /cycles/current` is specified as "the cycle(s)"; one object or a list both become a list. */
export function normaliseCurrent(raw: unknown): CurrentCycle[] {
  if (Array.isArray(raw)) return raw as CurrentCycle[];
  if (raw && typeof raw === 'object' && 'cycle' in raw) return [raw as CurrentCycle];
  return [];
}

export function useCurrentCycles(acoId: string, enabled = true) {
  return useQuery({
    queryKey: samplingKeys.current(acoId),
    queryFn: async ({ signal }) => {
      try {
        return await api.get<unknown>('/cycles/current', { signal, query: { acoId: acoId || undefined } });
      } catch (e) {
        if (isApiError(e, 'NOT_FOUND')) return null; // no cycle to act on
        throw e;
      }
    },
    select: normaliseCurrent,
    enabled,
  });
}

export function useSamplingState(cycleId: string, acoId: string, enabled = true) {
  return useQuery({
    queryKey: samplingKeys.state(cycleId, acoId),
    queryFn: ({ signal }) => api.get<SelectionState>(`/sampling/cycles/${cycleId}`, { signal, query: { acoId: acoId || undefined } }),
    enabled: enabled && cycleId !== '',
  });
}

export function useSamplingAudit(cycleId: string, acoId: string, query: ListQuery, enabled = true) {
  return useQuery({
    queryKey: samplingKeys.audit(cycleId, acoId, query),
    queryFn: ({ signal }) => api.list<SamplingAuditEntry>(`/sampling/cycles/${cycleId}/audit`, { ...query, acoId: acoId || undefined }, { signal }),
    placeholderData: keepPreviousData,
    enabled: enabled && cycleId !== '',
  });
}

// --- eligible customers ---------------------------------------------------------
// `GET /customers/eligible?cycleId=` expands the operator's ACTIVE directory into
// (customer, surveyType) entries with the backend's own rule and paginates them;
// the page reads every page so the table can filter and sort locally.

const ELIGIBLE_PAGE_SIZE = 200;
const ELIGIBLE_MAX_PAGES = 50; // 10 000 entries: 5 000 customers (the CSV import ceiling) × up to two survey types

async function fetchEligibleEntries(cycleId: string, acoId: string, signal?: AbortSignal): Promise<EligibleEntry[]> {
  const rows: EligibleEntry[] = [];
  for (let page = 1; page <= ELIGIBLE_MAX_PAGES; page += 1) {
    const res = await api.list<EligibleEntry>('/customers/eligible', { cycleId, page, pageSize: ELIGIBLE_PAGE_SIZE, acoId: acoId || undefined }, { signal });
    rows.push(...res.data);
    if (res.data.length === 0 || rows.length >= res.meta.total) break;
  }
  return rows;
}

/** Every eligible (customer, surveyType) entry of the operator for the cycle (all pages), for the eligible table. */
export function useEligibleCustomers(acoId: string, cycleId: string, enabled = true) {
  return useQuery({
    queryKey: samplingKeys.eligible(acoId, cycleId),
    queryFn: ({ signal }) => fetchEligibleEntries(cycleId, acoId, signal),
    enabled: enabled && cycleId !== '',
  });
}

// --- pure rules (mirrors of the backend's sampling/domain, for the optimistic update and fixtures) ---

export const selectionKey = (item: SelectionItem): string => `${item.customerId}:${item.surveyType}`;

export function cycleSurveyTypes(type: CycleType | CustomerSurveyType): SurveyType[] {
  if (type === 'BOTH') return ['DOMESTIC', 'INTERNATIONAL'];
  return [type];
}

/**
 * The survey types a customer is eligible for in a cycle, narrowed to the
 * participant's own survey types. DOMESTIC always precedes INTERNATIONAL.
 */
export function eligibleSurveyTypes(customerSurveyType: CustomerSurveyType, cycleType: CycleType, participantSurveyTypes?: readonly SurveyType[]): SurveyType[] {
  const customerTypes = cycleSurveyTypes(customerSurveyType);
  return cycleSurveyTypes(cycleType).filter((s) => customerTypes.includes(s) && (participantSurveyTypes === undefined || participantSurveyTypes.includes(s)));
}

/** Every (customer, surveyType) entry the operator may select; inactive customers never appear. */
export function eligibleEntries(customers: readonly Customer[], cycleType: CycleType, participantSurveyTypes?: readonly SurveyType[]): EligibleEntry[] {
  const entries: EligibleEntry[] = [];
  customers.forEach((customer) => {
    if (customer.status !== 'ACTIVE') return;
    eligibleSurveyTypes(customer.surveyType, cycleType, participantSurveyTypes).forEach((surveyType) => {
      entries.push({ key: selectionKey({ customerId: customer.id, surveyType }), customer, surveyType });
    });
  });
  return entries;
}

export type LockEvaluation = {
  lockable: boolean;
  reason: LockReason | null;
  shortfallRule: 'SELECT_ALL' | null;
  remaining: number;
  target: number;
  progress: string;
  progressPct: number;
};

/**
 * Rules, in order (backend `lockGate.evaluateLock`): nothing selected → never;
 * selected ≥ required → yes; eligible < required → only when everything
 * eligible is selected; otherwise below minimum.
 */
export function evaluateLock({ required, selectedCount, eligibleCount }: { required: number; selectedCount: number; eligibleCount: number }): LockEvaluation {
  const shortfallRule = eligibleCount < required ? 'SELECT_ALL' : null;
  const target = shortfallRule ? eligibleCount : required;
  let reason: LockReason | null = null;
  if (selectedCount === 0) reason = 'NOTHING_SELECTED';
  else if (selectedCount >= required) reason = null;
  else if (shortfallRule) reason = selectedCount >= eligibleCount ? null : 'SELECT_ALL_REQUIRED';
  else reason = 'BELOW_MINIMUM';
  return {
    lockable: reason === null,
    reason,
    shortfallRule,
    remaining: Math.max(0, target - selectedCount),
    target,
    progress: `${selectedCount} / ${required}`,
    progressPct: target <= 0 ? 100 : Math.min(100, Math.round((selectedCount / target) * 100)),
  };
}

/** Pure: apply `{ add, remove }` to a cached state (used for the optimistic update). */
export function applySelectionChange(state: SelectionState, input: Pick<SelectionInput, 'add' | 'remove'>, now = new Date().toISOString()): SelectionState {
  const removeKeys = new Set(input.remove.map(selectionKey));
  const kept = state.selection.filter((row) => row.state === 'SELECTED' && !removeKeys.has(selectionKey(row)));
  const present = new Set(kept.map(selectionKey));
  const added: SelectionRow[] = input.add
    .filter((item) => !present.has(selectionKey(item)))
    .map((item) => ({ id: `optimistic:${selectionKey(item)}`, customerId: item.customerId, customer: null, surveyType: item.surveyType, state: 'SELECTED', addedAt: now, addedBy: null }));
  const selection = [...kept, ...added];
  const gate = evaluateLock({ required: state.required, selectedCount: selection.length, eligibleCount: state.eligibleCount });
  // Window reasons (ALREADY_LOCKED, SAMPLING_CLOSED) survive; the count rules are re-evaluated.
  const windowBlocked = state.reason === 'ALREADY_LOCKED' || state.reason === 'SAMPLING_CLOSED';
  return {
    ...state,
    selection,
    selectedCount: selection.length,
    ...gate,
    lockable: windowBlocked ? false : gate.lockable,
    reason: windowBlocked ? state.reason : gate.reason,
    participant: { ...state.participant, sampling: { ...state.participant.sampling, selectedCount: selection.length } },
  };
}

// --- mutations ----------------------------------------------------------------

type SelectionVars = { cycleId: string; acoId: string; add: SelectionItem[]; remove: SelectionItem[] };

/** PUT /sampling/cycles/:cycleId/selection with an optimistic update and rollback on error. */
export function useUpdateSelection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, acoId, add, remove }: SelectionVars) =>
      api.put<SelectionChange>(`/sampling/cycles/${cycleId}/selection`, { body: { add, remove, ...(acoId ? { acoId } : {}) } }),
    onMutate: async (vars) => {
      const key = samplingKeys.state(vars.cycleId, vars.acoId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SelectionState>(key);
      if (previous) qc.setQueryData(key, applySelectionChange(previous, vars));
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSuccess: (change, vars) => {
      if (change?.state) qc.setQueryData(samplingKeys.state(vars.cycleId, vars.acoId), change.state);
    },
    onSettled: (_data, _error, vars) => {
      void qc.invalidateQueries({ queryKey: samplingKeys.state(vars.cycleId, vars.acoId) });
      void qc.invalidateQueries({ queryKey: samplingKeys.current(vars.acoId) });
      void qc.invalidateQueries({ queryKey: ['sampling', 'cycles', vars.cycleId, 'audit'] });
    },
  });
}

/** The response of select-all / lock / unlock: a change envelope or the state itself. */
function stateOf(data: SelectionChange | SelectionState | undefined): SelectionState | undefined {
  if (!data) return undefined;
  return 'state' in data && data.state ? data.state : 'selection' in data ? (data as SelectionState) : undefined;
}

function useSamplingAction(path: 'select-all' | 'lock' | 'unlock') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, acoId, reason }: { cycleId: string; acoId: string; reason?: string }) =>
      api.post<SelectionChange | SelectionState>(`/sampling/cycles/${cycleId}/${path}`, {
        body: { ...(acoId ? { acoId } : {}), ...(reason !== undefined ? { reason } : {}) },
      }),
    onSuccess: (data, vars) => {
      const state = stateOf(data);
      if (state) qc.setQueryData(samplingKeys.state(vars.cycleId, vars.acoId), state);
    },
    onSettled: (_data, _error, vars) => {
      void qc.invalidateQueries({ queryKey: samplingKeys.state(vars.cycleId, vars.acoId) });
      void qc.invalidateQueries({ queryKey: samplingKeys.current(vars.acoId) });
      void qc.invalidateQueries({ queryKey: ['sampling', 'cycles', vars.cycleId, 'audit'] });
      void qc.invalidateQueries({ queryKey: ['invitations'] });
      void qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

/** POST …/select-all (`sampling.manage`): allowed only when eligible < required. */
export function useSelectAll() {
  return useSamplingAction('select-all');
}

/** POST …/lock (`sampling.lock`): the transaction that creates the PENDING invitations. */
export function useLockSample() {
  return useSamplingAction('lock');
}

/** POST …/unlock (`sampling.unlock`, PLATFORM only): `{ acoId, reason }`; PENDING invitations are revoked. */
export function useUnlockSample() {
  return useSamplingAction('unlock');
}
