import {RouteObject } from 'react-router-dom';
import AirportCargoMasterPage from '../pages/AirportCargoMasterPage';
import AddCargoDataPage from '../pages/AddCargoDataPage';

const AirportCargoMasterRoutes: RouteObject[] = [
  {
    path: "/airportCargo",
    element: <AirportCargoMasterPage/>,
  },
  {
    path : '/airportCargo/add-cargo',
    element : <AddCargoDataPage/>,
  },
  {
    path : '/airportCargo/add-cargo/:id',
    element : <AddCargoDataPage/>,
  }
];

export default AirportCargoMasterRoutes;
