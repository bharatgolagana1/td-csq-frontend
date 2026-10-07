import { type Scope, type TaskCode } from '@/api/types';
import { type IconName } from '@/design/icons';

/* Sidebar configuration (ARCHITECTURE §4). An item is shown when the active
   role holds its task (any of them, when several are listed); a section is
   shown when at least one of its items is. */

export type NavItem = {
  label: string;
  to: string;
  icon: IconName;
  task: TaskCode | TaskCode[];
  /** Match nested routes too (default true). */
  end?: boolean;
};

export type NavSection = {
  id: string;
  label?: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    id: 'platform',
    items: [
      { label: 'Overview', to: '/overview', icon: 'dashboard', task: 'monitoring.view' },
      { label: 'Cycles', to: '/cycles', icon: 'cycles', task: 'cycles.view' },
      { label: 'Operators', to: '/operators', icon: 'building', task: 'operators.view' },
      { label: 'Airports', to: '/airports', icon: 'plane', task: 'airports.view' },
      { label: 'Onboarding', to: '/onboarding', icon: 'link', task: 'onboarding.review' },
      { label: 'Surveys', to: '/surveys', icon: 'list-check', task: 'surveys.view' },
      { label: 'Market share', to: '/market-share', icon: 'pie', task: 'marketshare.view' },
      { label: 'Reports', to: '/reports', icon: 'chart', task: ['reports.national', 'reports.airport'] },
    ],
  },
  {
    id: 'operator',
    label: 'Operator',
    items: [
      { label: 'Customers', to: '/customers', icon: 'users', task: 'customers.view' },
      { label: 'Sampling', to: '/sampling', icon: 'select', task: 'sampling.view' },
      { label: 'Self-assessment', to: '/self-assessment', icon: 'clipboard', task: 'assessments.self' },
      { label: 'Dashboard', to: '/dashboard', icon: 'dashboard', task: 'reports.operator' },
      { label: 'History', to: '/history', icon: 'clock', task: 'assessments.view' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { label: 'Users & roles', to: '/users', icon: 'user', task: 'users.view' },
      { label: 'Notifications', to: '/notifications', icon: 'bell', task: 'notifications.view' },
      { label: 'Audit', to: '/audit', icon: 'shield', task: 'audit.view' },
      { label: 'Settings', to: '/settings', icon: 'cog', task: 'settings.view' },
    ],
  },
];

export function holdsTask(tasks: ReadonlySet<string>, task: TaskCode | TaskCode[]): boolean {
  return Array.isArray(task) ? task.some((t) => tasks.has(t)) : tasks.has(task);
}

export function visibleSections(tasks: ReadonlySet<string>): NavSection[] {
  return NAV.map((s) => ({ ...s, items: s.items.filter((i) => holdsTask(tasks, i.task)) })).filter((s) => s.items.length > 0);
}

/** Default route after sign-in (§4): platform → /overview, operator → /dashboard, airport → /reports/airport. */
export function defaultRoute(scope: Scope, tasks: ReadonlySet<string>): string {
  const preferred = scope.kind === 'PLATFORM' ? '/overview' : scope.kind === 'ACO' ? '/dashboard' : '/reports/airport';
  const preferredTask: TaskCode = scope.kind === 'PLATFORM' ? 'monitoring.view' : scope.kind === 'ACO' ? 'reports.operator' : 'reports.airport';
  if (tasks.has(preferredTask)) return preferred;
  const first = visibleSections(tasks)[0]?.items[0];
  return first?.to ?? '/no-access';
}
