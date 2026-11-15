import { useCycleSelection, useOperatorScope } from '@/api/reports';
import { useStripCycle } from '@/shell/stripCycle';

/**
 * One data concern: which operator, cycle, survey type and direction the dashboard and
 * its question table show. The operator comes from the session (ACO) or the
 * route / URL (platform and airport users); the cycle from the shared selection.
 */
export function useDashboardSelection(routeAcoId?: string) {
  const scope = useOperatorScope(routeAcoId);
  const cycle = useCycleSelection();
  // The operator strip follows the cycle the dashboard (or its question table) shows.
  useStripCycle(cycle.selection.cycle);
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
    direction: cycle.direction,
    setDirection: cycle.setDirection,
  };
}

export type DashboardSelection = ReturnType<typeof useDashboardSelection>;
