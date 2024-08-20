import { RouteObject } from 'react-router-dom';
import AirportDataMasterPage from '../pages/AirportDataMasterPage';
import AddAirportDataPage from '../pages/AddAirportDataPage';

const AirportDataMasterRoutes: RouteObject[] = [
  {
    path: "/airportMaster",
    element: <AirportDataMasterPage />,
  },
  {
    path: '/airportMaster/add-airport',
    element : <AddAirportDataPage/>,
  },
  {
    path : '/airportMaster/add-airport/:id',
    element : <AddAirportDataPage/>,
  }
];

export default AirportDataMasterRoutes;
