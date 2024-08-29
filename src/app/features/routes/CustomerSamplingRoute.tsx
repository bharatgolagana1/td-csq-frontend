import { RouteObject } from "react-router-dom";
import CustomerSamplingPage from "../pages/CustomerSamplingPage";

export const CustomerSamplingRoute: RouteObject[] = [
    {
        path : '/customer-sampling',
        element : <CustomerSamplingPage/>
    }
]