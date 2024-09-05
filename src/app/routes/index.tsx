import MainLayoutPage from "../pages/MainLayoutPage";
import { AssessmentHistoryRoute } from "./AssessmentHistoryRoute";
import { AssessmentRoute } from "./AssessmentRoute";
import { CustomerSamplingRoute } from "./CustomerSamplingRoute";
import { DashboardRoute } from "./DashboardRoute";
import { RouteObject } from 'react-router-dom';
import RoleMappingRoute from "./RoleMappingRoute";
import { AssessmentCycleRoute } from "./AssessmentCycleRoute";
import { AirportRoute } from "./AirportRoute";

const createRoutes = (): RouteObject[] => [
  {
    path: '/',
    element: <MainLayoutPage children={undefined} />,
    children: [
      ...CustomerSamplingRoute,
      ...AssessmentHistoryRoute,
      ...AssessmentRoute,
      ...DashboardRoute,
      ...RoleMappingRoute,
      ...AssessmentCycleRoute,
      ...AirportRoute,
    ],
  },
];

export default createRoutes;
