import { useMemo } from 'react';

import { useOperators } from '@/api/organisations';
import { useSession } from '@/auth/session';
import { type SelectOption } from '@/design/primitives';

/* Organisation ids → names for the audit table and the CSV, plus the options of
   the organisation filter. Platform roles see every operator (and their own
   organisations); others only the organisations they belong to. */

export type OrgLookups = {
  name: (id: string | null) => string | undefined;
  options: SelectOption[];
  /** Platform scope: the API accepts `orgId`; other scopes are pinned to their own organisation. */
  canFilter: boolean;
};

export function useOrgNames(): OrgLookups {
  const { hasTask, memberships, scope } = useSession();
  const canFilter = scope.kind === 'PLATFORM';
  const operators = useOperators({ pageSize: 200 }, hasTask('operators.view'));

  return useMemo(() => {
    const names = new Map<string, string>();
    memberships.forEach((m) => names.set(m.orgId, m.orgName));
    operators.data?.data.forEach((o) => names.set(o.id, o.name));
    const options = Array.from(names.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return { name: (id) => (id ? names.get(id) : undefined), options, canFilter };
  }, [memberships, operators.data, canFilter]);
}
