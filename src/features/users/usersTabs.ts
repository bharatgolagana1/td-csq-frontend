import { type TabItem } from '@/design/primitives/Tabs/Tabs';

/* Route-relative tab links: the feature never needs to know where the shell is
   mounted (the dev gallery mounts it under /dev/design/shell). Routes are nested
   `users` → index (Users) and `roles` (matrix). */

export function usersTabs(current: 'users' | 'roles', canSeeRoles: boolean): TabItem[] {
  const tabs: TabItem[] = [{ id: 'users', label: 'Users', to: current === 'users' ? '.' : '..', end: true }];
  if (canSeeRoles) tabs.push({ id: 'roles', label: 'Role → Task matrix', to: current === 'roles' ? '.' : 'roles', end: true });
  return tabs;
}
