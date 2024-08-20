import {RouteObject } from 'react-router-dom';
import UnAuthorizedPage from '../pages/UnAuthorizedPage';

const UnAuthorizedRoute: RouteObject[] = [
  {
    path: "/unauthorized",
    element: <UnAuthorizedPage />,
  },
];

export default UnAuthorizedRoute;
