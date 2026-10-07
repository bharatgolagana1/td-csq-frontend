import { type TabItem } from '@/design/primitives/Tabs/Tabs';

/* Overview (/dashboard) and Questions (/reports/operator/:acoId/questions)
   share the selection through the search params; `href` is the shell's base
   path resolver so the tabs work under /dev/design/shell too. */

export function dashboardTabs(href: (to: string) => string, acoId: string, search: string): TabItem[] {
  const qs = search ? `?${search}` : '';
  return [
    { id: 'overview', label: 'Overview', to: `${href('/dashboard')}${qs}`, end: true },
    { id: 'questions', label: 'Questions', to: `${href(`/reports/operator/${acoId}/questions`)}${qs}`, end: true, disabled: !acoId },
  ];
}
