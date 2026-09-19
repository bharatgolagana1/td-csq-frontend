import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
const AssessmentHistoryFeaturePage = lazy(() => import('../features/assessmentHistory/AssessmentHistoryFeaturePage'));

export const AssessmentHistoryFeatureRoute: RouteObject[] = [
  {
    path: '/history',
    element: <AssessmentHistoryFeaturePage />,
  },
];
