import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { type SurveyType } from '@/api/assessments.types';
import { useCurrentCycles } from '@/api/sampling';
import { type CurrentCycle, type CurrentCycleParticipant, type CurrentCycleSummary, type CycleStatus } from '@/api/sampling.types';
import { useSession } from '@/auth/session';

/* Which self-assessment the page shows: the operator's cycle chosen in
   `?cycleId=` (else the current one; one cache entry with the operator strip,
   api/sampling) and the survey type chosen in `?type=` (backend §6
   assessments: one SELF return per cycle and survey type; the service opens it
   from SAMPLING_OPEN to ASSESSMENT_OPEN). An operator in two open cycles picks
   which one to answer. */

export const SELF_OPEN_STATUSES: readonly CycleStatus[] = ['SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN'];
const BEFORE_OPEN: readonly CycleStatus[] = ['DRAFT', 'PUBLISHED'];

/** The cycles to choose between, when more than one is open for self-assessment (`cycles` holds the shown one too). */
export type SelfCycleChoice = { cycles: CurrentCycleSummary[]; cycleId: string; setCycle: (id: string) => void };

export type SelfTarget =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown; retry: () => void }
  | { kind: 'none' }
  | { kind: 'not-open'; cycle: CurrentCycleSummary; participant: CurrentCycleParticipant; phase: 'before' | 'after'; choice: SelfCycleChoice | null }
  | {
      kind: 'open';
      cycle: CurrentCycleSummary;
      participant: CurrentCycleParticipant;
      surveyTypes: SurveyType[];
      surveyType: SurveyType;
      setSurveyType: (type: SurveyType) => void;
      choice: SelfCycleChoice | null;
    };

const isOpen = (entry: CurrentCycle) => SELF_OPEN_STATUSES.includes(entry.cycle.status);

function surveyTypesOf(cycle: CurrentCycleSummary, participant: CurrentCycleParticipant): SurveyType[] {
  if (participant.surveyTypes.length > 0) return participant.surveyTypes;
  return cycle.type === 'BOTH' ? ['DOMESTIC', 'INTERNATIONAL'] : [cycle.type];
}

/** The cycle to act on: the one asked for (`?cycleId=`) when the operator is in it, else the current one — the first open in the API's order (oldest sampling start), else the first listed. */
export function pickCurrent(list: readonly CurrentCycle[], requestedId?: string | null): CurrentCycle | undefined {
  const requested = requestedId ? list.find((c) => c.cycle.id === requestedId) : undefined;
  return requested ?? list.find(isOpen) ?? list[0];
}

/** The open cycles (and the picked one, open or not) when there is more than one open to choose from; else null. */
export function cycleChoices(list: readonly CurrentCycle[], picked: CurrentCycle): CurrentCycleSummary[] | null {
  const open = list.filter(isOpen);
  if (open.length < 2) return null;
  return list.filter((c) => c === picked || isOpen(c)).map((c) => c.cycle);
}

export function useSelfAssessmentTarget(): SelfTarget {
  const { org } = useSession();
  const current = useCurrentCycles(org.id);
  const [params, setParams] = useSearchParams();

  const setCycle = useCallback(
    (id: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('cycleId', id);
          // The other cycle may run other survey types: start from its first.
          next.delete('type');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setSurveyType = useCallback(
    (type: SurveyType) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('type', type);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  if (current.isPending) return { kind: 'loading' };
  if (current.isError) return { kind: 'error', error: current.error, retry: () => void current.refetch() };
  const list = current.data ?? [];
  const picked = pickCurrent(list, params.get('cycleId'));
  if (!picked) return { kind: 'none' };

  const { cycle, participant } = picked;
  const cycles = cycleChoices(list, picked);
  const choice = cycles ? { cycles, cycleId: cycle.id, setCycle } : null;
  if (!SELF_OPEN_STATUSES.includes(cycle.status)) {
    return { kind: 'not-open', cycle, participant, phase: BEFORE_OPEN.includes(cycle.status) ? 'before' : 'after', choice };
  }
  const surveyTypes = surveyTypesOf(cycle, participant);
  const requested = params.get('type');
  const surveyType = surveyTypes.find((t) => t === requested) ?? surveyTypes[0] ?? 'DOMESTIC';
  return { kind: 'open', cycle, participant, surveyTypes, surveyType, setSurveyType, choice };
}
