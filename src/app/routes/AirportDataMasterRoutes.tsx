import {RouteObject } from 'react-router-dom';
import AirportDataMasterPage from '../pages/AirportDataMasterPage';

const AirportDataMasterRoutes: RouteObject[] = [
  {
    path: "/airportMaster",
    element: <AirportDataMasterPage/>,
  },
];

export default AirportDataMasterRoutes;
