import { RouteObject } from "react-router-dom";
import AssessmentPage from "../pages/AssessmentPage";

export const AssessmentRoute: RouteObject[] = [
    {
        path : '/assessment',
        element : <AssessmentPage/>
    }
]