import {RouteObject } from 'react-router-dom';
import RegistraionPage from '../pages/RegistraionPage';

const RegistrationRoute: RouteObject[] = [
  {
    path: "/register",
    element: <RegistraionPage/>,
  },
];

export default RegistrationRoute;
