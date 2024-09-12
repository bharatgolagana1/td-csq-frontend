import { RouteObject } from "react-router-dom";
import AirportPage from "../pages/Airport/AirportPage";
import AddAirportPage from "../pages/Airport/AddAirportPage";

export const AirportRoute: RouteObject[] = [
    {
        path:'/airport',
        element:<AirportPage/>
    },
    {
        path : '/airport/add-airport',
        element: <AddAirportPage/>
    }
]