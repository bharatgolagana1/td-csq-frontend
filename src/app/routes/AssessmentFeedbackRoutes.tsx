import {RouteObject } from 'react-router-dom';
import AssessmentFeedbackPage from '../pages/AssessmentFeedbackPage';

const AssessmentFeedbackRoutes: RouteObject[] = [
  {
    path: "/feedback",
    element: <AssessmentFeedbackPage/>,
  }
];

export default AssessmentFeedbackRoutes;
