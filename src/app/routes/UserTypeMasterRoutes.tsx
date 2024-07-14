import {RouteObject } from 'react-router-dom';
import UserTypeMasterPage from '../pages/UserTypeMasterPage';

const UserTypeMasterRoutes: RouteObject[] = [
  {
    path: "/userType",
    element: <UserTypeMasterPage />,
  },
];

export default UserTypeMasterRoutes;
