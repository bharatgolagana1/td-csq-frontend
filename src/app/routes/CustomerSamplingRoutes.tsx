import {RouteObject } from 'react-router-dom';
import CustomerSamplingPage from '../pages/CustomerSamplingPage';
import AddCustomerSampling from '../pages/AddCustomerSampling';

const CustomerSamplingRoutes: RouteObject[] = [
  {
    path: "/sampling",
    element: <CustomerSamplingPage/>,
  },
  {
    path : '/sampling/add-customer',
    element : <AddCustomerSampling/>
  }
];

export default CustomerSamplingRoutes;
