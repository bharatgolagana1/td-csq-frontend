import { type ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { type TaskCode } from '@/api/types';
import { NoAccessPage, RequireTask } from '@/auth/RequireTask';

import { AppLayout } from './AppLayout';
import { IndexRedirect, ReportsIndexRedirect } from './IndexRedirect';
import NotFoundPage from './NotFoundPage';
import { RouteError } from './RouteError';

/* Route tree (ARCHITECTURE §2/§4). Public routes live outside auth; every
   feature route is lazy and guarded by the task its nav item declares. */

type PageModule = { default: ComponentType };
const page = (load: () => Promise<PageModule>) => async () => {
  const m = await load();
  return { Component: m.default };
};

function guarded(task: TaskCode | TaskCode[], children: RouteObject[]): RouteObject {
  return { element: <RequireTask task={task} />, children };
}

/** The authenticated routes; reused by the dev gallery's mocked shell. */
export const appChildren: RouteObject[] = [
  { index: true, element: <IndexRedirect /> },

  guarded('monitoring.view', [{ path: 'overview', lazy: page(() => import('@/features/overview/OverviewPage')) }]),

  guarded('cycles.view', [
    { path: 'cycles', lazy: page(() => import('@/features/cycles/CyclesPage')) },
    { path: 'cycles/new', ...guarded('cycles.manage', [{ index: true, lazy: page(() => import('@/features/cycles/CycleBuilderPage')) }]) },
    { path: 'cycles/:id', lazy: page(() => import('@/features/cycles/CycleDetailPage')) },
  ]),

  guarded('operators.view', [
    { path: 'operators', lazy: page(() => import('@/features/operators/OperatorsPage')) },
    { path: 'operators/:id', lazy: page(() => import('@/features/operators/OperatorDetailPage')) },
  ]),

  guarded('airports.view', [
    { path: 'airports', lazy: page(() => import('@/features/airports/AirportsPage')) },
    { path: 'airports/:id', lazy: page(() => import('@/features/airports/AirportDetailPage')) },
  ]),

  guarded('onboarding.review', [{ path: 'onboarding', lazy: page(() => import('@/features/onboarding/OnboardingPage')) }]),

  guarded('surveys.view', [
    { path: 'surveys', lazy: page(() => import('@/features/surveys/SurveysPage')) },
    { path: 'surveys/:id', lazy: page(() => import('@/features/surveys/SurveyEditorPage')) },
  ]),

  guarded('marketshare.view', [{ path: 'market-share', lazy: page(() => import('@/features/marketshare/MarketSharePage')) }]),

  {
    path: 'reports',
    element: <RequireTask task={['reports.national', 'reports.airport', 'reports.operator']} />,
    children: [
      { index: true, element: <ReportsIndexRedirect /> },
      { path: 'airport', ...guarded('reports.airport', [{ index: true, lazy: page(() => import('@/features/reports/AirportReportPage')) }]) },
      { path: 'national', ...guarded('reports.national', [{ index: true, lazy: page(() => import('@/features/reports/NationalReportPage')) }]) },
      { path: 'comparison', ...guarded('reports.operator', [{ index: true, lazy: page(() => import('@/features/reports/ComparisonPage')) }]) },
      { path: 'exports', lazy: page(() => import('@/features/reports/ExportsPage')) },
    ],
  },

  guarded('customers.view', [
    { path: 'customers', lazy: page(() => import('@/features/customers/CustomersPage')) },
    { path: 'customers/import', ...guarded('customers.manage', [{ index: true, lazy: page(() => import('@/features/customers/CustomerImportPage')) }]) },
  ]),

  guarded('sampling.view', [{ path: 'sampling', lazy: page(() => import('@/features/sampling/SamplingPage')) }]),
  guarded('assessments.self', [{ path: 'self-assessment', lazy: page(() => import('@/features/selfAssessment/SelfAssessmentPage')) }]),
  guarded('reports.operator', [{ path: 'dashboard', lazy: page(() => import('@/features/dashboard/DashboardPage')) }]),

  guarded('assessments.view', [
    { path: 'history', lazy: page(() => import('@/features/history/HistoryPage')) },
    { path: 'history/:id', lazy: page(() => import('@/features/history/AssessmentPage')) },
  ]),

  {
    path: 'users',
    element: <RequireTask task="users.view" />,
    children: [
      { index: true, lazy: page(() => import('@/features/users/UsersPage')) },
      { path: 'roles', ...guarded('roles.view', [{ index: true, lazy: page(() => import('@/features/users/RoleMatrixPage')) }]) },
    ],
  },

  guarded('notifications.view', [{ path: 'notifications', lazy: page(() => import('@/features/notifications/NotificationsPage')) }]),
  guarded('audit.view', [{ path: 'audit', lazy: page(() => import('@/features/audit/AuditPage')) }]),
  guarded('settings.view', [{ path: 'settings', lazy: page(() => import('@/features/settings/SettingsPage')) }]),

  { path: 'no-access', element: <NoAccessPage /> },
  { path: '*', element: <NotFoundPage /> },
];

/** Dev-only: the design gallery and the mocked shell. Dropped from production by the DEV guard. */
function devRoutes(): RouteObject[] {
  if (!import.meta.env.DEV) return [];
  return [
    {
      path: '/dev/design',
      lazy: async () => {
        const m = await import('@/dev/DesignGallery');
        return { Component: m.DesignGalleryLayout };
      },
      errorElement: <RouteError />,
      children: [
        {
          index: true,
          lazy: async () => {
            const m = await import('@/dev/DesignGallery');
            return { Component: m.DesignGallery };
          },
        },
        {
          path: 'shell',
          lazy: async () => {
            const m = await import('@/dev/DevShell');
            return { Component: m.DevShell };
          },
          children: appChildren,
        },
      ],
    },
  ];
}

export function createRoutes(): RouteObject[] {
  return [
    { path: '/register/:token', lazy: page(() => import('@/public/register/RegisterPage')), errorElement: <RouteError /> },
    { path: '/assess/:token', lazy: page(() => import('@/public/assess/AssessPage')), errorElement: <RouteError /> },
    ...devRoutes(),
    { path: '/', element: <AppLayout />, errorElement: <RouteError />, children: appChildren },
  ];
}

export function createAppRouter() {
  return createBrowserRouter(createRoutes(), { future: { v7_relativeSplatPath: true } });
}
