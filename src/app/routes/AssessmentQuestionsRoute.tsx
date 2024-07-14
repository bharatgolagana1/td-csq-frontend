import {RouteObject } from 'react-router-dom';
import { AssessementQuestion } from '../features/assessment-questions';

const AirportDataMasterRoutes: RouteObject[] = [
  {
    path: "/assessment",
    element: <AssessementQuestion/>,
  },
];

export default AirportDataMasterRoutes;
