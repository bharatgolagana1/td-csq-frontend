import { RouteObject } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";

export const DashboardRoute: RouteObject[] = [
    {
        path : '/dashboard',
        element : <DashboardPage/>
    }
]