import { useCycleSelection, useOperatorScope } from '@/api/reports';

/**
 * One data concern: which operator, cycle and survey type the dashboard and
 * its question table show. The operator comes from the session (ACO) or the
 * route / URL (platform and airport users); the cycle from the shared selection.
 */
export function useDashboardSelection(routeAcoId?: string) {
  const scope = useOperatorScope(routeAcoId);
  const cycle = useCycleSelection();
  return {
    scope,
    acoId: scope.acoId,
    cycles: cycle.cycles,
    cyclesLoading: cycle.cyclesLoading,
    selection: cycle.selection,
    query: cycle.query,
    enabled: Boolean(scope.acoId) && cycle.ready,
    noCycles: cycle.noCycles,
    search: cycle.search,
    setCycle: cycle.setCycle,
    setSurveyType: cycle.setSurveyType,
  };
}

export type DashboardSelection = ReturnType<typeof useDashboardSelection>;
