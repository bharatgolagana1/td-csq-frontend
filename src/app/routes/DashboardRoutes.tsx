import { RouteObject } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";

export const DashboardRoutes: RouteObject[] = [
    {
        path : '/dashboard',
        element : <DashboardPage/>
    }
]