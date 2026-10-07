import { type ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { type TaskCode } from '@/api/types';
import { Button } from '@/design/primitives/Button/Button';
import { EmptyState } from '@/design/primitives/EmptyState/EmptyState';
import { humanise } from '@/lib/format';

import { useSession } from './session';

export type RequireTaskProps = {
  task: TaskCode | TaskCode[];
  /** Defaults to <Outlet/> so it can wrap a route subtree. */
  children?: ReactNode;
};

/** Route guard: renders a calm "No access" page instead of crashing (§2). */
export function RequireTask({ task, children }: RequireTaskProps) {
  const session = useSession();
  if (!session.hasTask(task)) return <NoAccessPage />;
  return <>{children ?? <Outlet />}</>;
}

export function NoAccessPage() {
  const { role, org } = useSession();
  const navigate = useNavigate();
  return (
    <EmptyState
      icon="lock"
      size="lg"
      title="No access"
      description={`Your role (${humanise(role.code)}) at ${org.name} does not include this area. Ask an administrator if you need it.`}
      action={
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to your home page
        </Button>
      }
    />
  );
}
