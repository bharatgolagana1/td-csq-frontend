import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
const SamplingPage = lazy(() => import('../features/sampling/SamplingPage'));

export const SamplingRoute: RouteObject[] = [
  {
    path: '/sampling',
    element: <SamplingPage />,
  },
];
