import { Navigate } from 'react-router-dom';

import { useSession } from '@/auth/session';
import { useShell } from '@/shell/ShellContext';

import { defaultRoute } from './nav';

/** `/` → platform /overview · operator /dashboard · airport /reports/airport (§4). */
export function IndexRedirect() {
  const { scope, tasks } = useSession();
  const { href } = useShell();
  return <Navigate to={href(defaultRoute(scope, tasks))} replace />;
}

/** `/reports` → national when held, else the airport report. */
export function ReportsIndexRedirect() {
  const { hasTask } = useSession();
  return <Navigate to={hasTask('reports.national') ? 'national' : 'airport'} replace />;
}
