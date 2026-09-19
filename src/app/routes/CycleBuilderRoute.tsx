import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
const CycleBuilderPage = lazy(() => import('../features/cycleBuilder/CycleBuilderPage'));

/* The builder serves a new cycle and an existing one from the same screen: a
   cycle's state decides what it still allows, and that logic has to be the same
   in both places or the locks are decorative. */
export const CycleBuilderRoute: RouteObject[] = [
  {
    path: '/cycles/new',
    element: <CycleBuilderPage />,
  },
  {
    path: '/cycles/:cycleId',
    element: <CycleBuilderPage />,
  },
];

export default CycleBuilderRoute;
