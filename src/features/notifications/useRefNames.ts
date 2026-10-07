import { useMemo } from 'react';

import { useCycleOptions } from '@/api/notifications';
import { useOperators } from '@/api/organisations';
import { useSession } from '@/auth/session';
import { type SelectOption } from '@/design/primitives';

import { type RefNames } from './RefChips';

/* Resolves the ids a notification refers to (cycle, operator) into names, and
   provides the same lists as filter options. Operators come from `GET /operators`
   when the role may view them, otherwise from the user's own memberships. */

export type RefLookups = {
  names: RefNames;
  cycleOptions: SelectOption[];
  operatorOptions: SelectOption[];
  /** True when the role may filter by operator (platform scope). */
  canFilterOperators: boolean;
};

export function useRefNames(): RefLookups {
  const { hasTask, memberships } = useSession();
  const canFilterOperators = hasTask('operators.view');
  const cycles = useCycleOptions(hasTask('cycles.view'));
  const operators = useOperators({ pageSize: 200 }, canFilterOperators);

  return useMemo(() => {
    const cycleNames = new Map((cycles.data ?? []).map((c) => [c.id, c.name]));
    const operatorNames = new Map<string, string>();
    memberships.forEach((m) => operatorNames.set(m.orgId, m.orgName));
    operators.data?.data.forEach((o) => operatorNames.set(o.id, o.name));

    const cycleOptions = (cycles.data ?? []).map((c) => ({ value: c.id, label: `${c.name} · ${c.code}` }));
    const operatorOptions = (operators.data?.data ?? []).map((o) => ({ value: o.id, label: `${o.name} · ${o.airport.iata}` })).sort((a, b) => a.label.localeCompare(b.label));

    return {
      names: { cycle: (id) => cycleNames.get(id), operator: (id) => operatorNames.get(id) },
      cycleOptions,
      operatorOptions,
      canFilterOperators,
    };
  }, [cycles.data, operators.data, memberships, canFilterOperators]);
}
