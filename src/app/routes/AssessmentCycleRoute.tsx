import { RouteObject } from "react-router-dom";
import AssessmentCyclePage from "../pages/AssessmentCycle/AssessmentCyclePage";
import AddAssessmentCyclePage from "../pages/AssessmentCycle/AddAssessmentCyclePage";

export const AssessmentCycleRoute : RouteObject[] = [
 {
    path : '/assessment-cycle',
    element : <AssessmentCyclePage/>
 },
 {
    path : '/assessment-cycle/add-cycle',
    element : <AddAssessmentCyclePage/>
 }
]