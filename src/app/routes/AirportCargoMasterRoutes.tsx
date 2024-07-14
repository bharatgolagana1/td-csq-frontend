import {RouteObject } from 'react-router-dom';
import AirportCargoMasterPage from '../pages/AirportCargoMasterPage';

const AirportCargoMasterRoutes: RouteObject[] = [
  {
    path: "/airportCargo",
    element: <AirportCargoMasterPage/>,
  },
];

export default AirportCargoMasterRoutes;
