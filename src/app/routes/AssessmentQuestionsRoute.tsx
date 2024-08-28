import {RouteObject } from 'react-router-dom';
import { AssessementQuestion } from '../features/assessment-questions';
import AddAssessmentParameterPage from '../pages/AddAssessmentParameterPage';

const AirportQuestionsRoutes: RouteObject[] = [
  {
    path: "/assessment",
    element: <AssessementQuestion/>,
  },
  {
    path : "/assessment/parameter-form",
    element : <AddAssessmentParameterPage/>
  }
];

export default AirportQuestionsRoutes;
