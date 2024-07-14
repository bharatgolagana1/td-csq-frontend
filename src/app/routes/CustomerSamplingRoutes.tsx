import {RouteObject } from 'react-router-dom';
import CustomerSamplingPage from '../pages/CustomerSamplingPage';

const CustomerSamplingRoutes: RouteObject[] = [
  {
    path: "/sampling",
    element: <CustomerSamplingPage/>,
  },
];

export default CustomerSamplingRoutes;
