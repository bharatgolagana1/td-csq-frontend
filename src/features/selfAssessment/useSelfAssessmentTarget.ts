import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { type SurveyType } from '@/api/assessments.types';
import { useCurrentCycles } from '@/api/sampling';
import { type CurrentCycle, type CurrentCycleParticipant, type CurrentCycleSummary, type CycleStatus } from '@/api/sampling.types';
import { useSession } from '@/auth/session';

/* Which self-assessment the page shows: the operator's current cycle (one
   cache entry with the operator strip, api/sampling) and the survey type chosen
   in `?type=` (backend §6 assessments: one SELF return per cycle and survey
   type; the service opens it from SAMPLING_OPEN to ASSESSMENT_OPEN). */

export const SELF_OPEN_STATUSES: readonly CycleStatus[] = ['SAMPLING_OPEN', 'SAMPLING_CLOSED', 'ASSESSMENT_OPEN'];
const BEFORE_OPEN: readonly CycleStatus[] = ['DRAFT', 'PUBLISHED'];

export type SelfTarget =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown; retry: () => void }
  | { kind: 'none' }
  | { kind: 'not-open'; cycle: CurrentCycleSummary; participant: CurrentCycleParticipant; phase: 'before' | 'after' }
  | {
      kind: 'open';
      cycle: CurrentCycleSummary;
      participant: CurrentCycleParticipant;
      surveyTypes: SurveyType[];
      surveyType: SurveyType;
      setSurveyType: (type: SurveyType) => void;
    };

function surveyTypesOf(cycle: CurrentCycleSummary, participant: CurrentCycleParticipant): SurveyType[] {
  if (participant.surveyTypes.length > 0) return participant.surveyTypes;
  return cycle.type === 'BOTH' ? ['DOMESTIC', 'INTERNATIONAL'] : [cycle.type];
}

/** The cycle to act on: an open one first, else the first the API lists. */
export function pickCurrent(list: readonly CurrentCycle[]): CurrentCycle | undefined {
  return list.find((c) => SELF_OPEN_STATUSES.includes(c.cycle.status)) ?? list[0];
}

export function useSelfAssessmentTarget(): SelfTarget {
  const { org } = useSession();
  const current = useCurrentCycles(org.id);
  const [params, setParams] = useSearchParams();

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
  const picked = pickCurrent(current.data ?? []);
  if (!picked) return { kind: 'none' };

  const { cycle, participant } = picked;
  if (!SELF_OPEN_STATUSES.includes(cycle.status)) {
    return { kind: 'not-open', cycle, participant, phase: BEFORE_OPEN.includes(cycle.status) ? 'before' : 'after' };
  }
  const surveyTypes = surveyTypesOf(cycle, participant);
  const requested = params.get('type');
  const surveyType = surveyTypes.find((t) => t === requested) ?? surveyTypes[0] ?? 'DOMESTIC';
  return { kind: 'open', cycle, participant, surveyTypes, surveyType, setSurveyType };
}
