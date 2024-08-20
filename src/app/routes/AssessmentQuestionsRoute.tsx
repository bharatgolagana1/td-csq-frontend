import {RouteObject } from 'react-router-dom';
import { AssessementQuestion } from '../features/assessment-questions';

const AirportQuestionsRoutes: RouteObject[] = [
  {
    path: "/assessment",
    element: <AssessementQuestion/>,
  }
];

export default AirportQuestionsRoutes;
