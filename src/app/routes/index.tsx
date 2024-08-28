import { RouteObject } from 'react-router-dom';
import UserTypeMasterRoutes from './UserTypeMasterRoutes';
import RegistrationRoute from './RegistrationRoute';
import AirportCargoMasterRoutes from './AirportCargoMasterRoutes';
import AirportDataMasterRoutes from './AirportDataMasterRoutes';
import Layout from '../pages/Layout';
import AssessmentQuestionsRoute from './AssessmentQuestionsRoute';
import CustomerSamplingRoutes from './CustomerSamplingRoutes';
import AssessmentFeedbackRoutes from './AssessmentFeedbackRoutes';
import HomePageRoutes from './HomePageRoutes';
import UnAuthorizedRoute from './UnAuthorizedRoute';
import SettingsRoutes from './SettingsRoutes';
import PageNotFoundRoutes from './PageNotFoundRoutes';
import { DashboardRoutes } from './DashboardRoutes';
import RoleMappingRoute from './RoleMappingRoute';
import CtoActivationRoutes from './CtoActivationRoutes';

const createRoutes = (sidebarOpen: boolean, handleDrawerOpen: () => void, handleDrawerClose: () => void): RouteObject[] => [
  {
    path: '/',
    element: <Layout sidebarOpen={sidebarOpen} handleDrawerOpen={handleDrawerOpen} handleDrawerClose={handleDrawerClose} />,
    children: [
      ...HomePageRoutes,
      ...UserTypeMasterRoutes,
      ...RegistrationRoute,
      ...AirportCargoMasterRoutes,
      ...AirportDataMasterRoutes,
      ...AssessmentQuestionsRoute,
      ...CustomerSamplingRoutes,
      ...AssessmentFeedbackRoutes,
      ...UnAuthorizedRoute,
      ...SettingsRoutes,
      ...PageNotFoundRoutes,
      ...DashboardRoutes,
      ...RoleMappingRoute,
      ...CtoActivationRoutes
    ],
  },
];

export default createRoutes;
