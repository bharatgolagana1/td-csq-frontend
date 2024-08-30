import { RouteObject } from "react-router-dom";
import AssessmentHistoryPage from "../pages/AssessmentHistoryPage";

export const AssessmentHistoryRoute: RouteObject[] = [
    {
        path : '/assessment-history',
        element : <AssessmentHistoryPage/>
    }
]