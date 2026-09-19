import { Suspense } from 'react';
import type { ReactElement } from 'react';
import { RouteObject } from 'react-router-dom';
import MainLayoutPage from "../pages/MainLayoutPage";
import Orbis from '../shared/orbis/Orbis';

import { AssessmentHistoryRoute } from "./AssessmentHistoryRoute";
import { AssessmentRoute } from "./AssessmentRoute";
import { CustomerSamplingRoute } from "./CustomerSamplingRoute";
import { DashboardRoute } from "./DashboardRoute";
import RoleMappingRoute from "./RoleMappingRoute";
import { AssessmentCycleRoute } from "./AssessmentCycleRoute";
import { AirportRoute } from "./AirportRoute";

import { SamplingRoute } from "./SamplingRoute";
import { CycleBuilderRoute } from "./CycleBuilderRoute";
import { ApprovalsRoute } from "./ApprovalsRoute";
import { AssessmentHistoryFeatureRoute } from "./AssessmentHistoryFeatureRoute";
import { AdminMasterRoute } from "./AdminMasterRoute";
import { AssessmentFormRoute } from "./AssessmentFormRoute";

/**
 * Feature pages are lazily loaded, so each route is its own chunk. Without this
 * a sampled forwarder opening a WhatsApp link on mobile data downloads the admin
 * console, the approval queue and the cycle builder before seeing question one.
 */
const withSuspense = (routes: RouteObject[], label: string, fullScreen = false): RouteObject[] =>
  routes.map((r) => ({
    ...r,
    element: (
      <Suspense fallback={<Orbis fullScreen={fullScreen} label={label} />}>
        {r.element as ReactElement}
      </Suspense>
    ),
  }));

/**
 * Routes reachable without an account. Mounted by App outside KeycloakProvider,
 * because a sampled forwarder's signed link is their only credential.
 */
export const createPublicRoutes = (): RouteObject[] =>
  withSuspense(AssessmentFormRoute, 'Loading your assessment', true);

const createRoutes = (): RouteObject[] => [
  {
    path: '/',
    element: <MainLayoutPage children={undefined} />,
    children: [
      ...DashboardRoute,
      ...withSuspense(SamplingRoute, 'Loading'),
      ...CustomerSamplingRoute,
      ...withSuspense(CycleBuilderRoute, 'Loading'),
      ...AssessmentCycleRoute,
      ...withSuspense(ApprovalsRoute, 'Loading'),
      ...withSuspense(AssessmentHistoryFeatureRoute, 'Loading'),
      ...AssessmentHistoryRoute,
      ...AssessmentRoute,
      ...withSuspense(AdminMasterRoute, 'Loading'),
      ...AirportRoute,
      ...RoleMappingRoute,
    ],
  },
];

export default createRoutes;
