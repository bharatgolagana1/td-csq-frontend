import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
const AssessmentFormPage = lazy(() => import('../features/assessmentForm/AssessmentFormPage'));

/**
 * Mount this at the top level of createRoutes, not inside MainLayoutPage.
 * The assessor is an external freight forwarder or customs broker arriving from
 * a WhatsApp link on a phone: they have no account, no sidebar and no toolbar,
 * and the link token is their whole session.
 */
export const AssessmentFormRoute: RouteObject[] = [
  {
    path: '/assess',
    element: <AssessmentFormPage />,
  },
];
