import { RouteObject } from "react-router-dom";
import AirportsPage from "../features/airports/AirportsPage";

export const AirportRoute: RouteObject[] = [
    {
        path: '/airports',
        element: <AirportsPage />
    }
]
