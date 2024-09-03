import { RouteObject } from "react-router-dom";
import CustomerSamplingPage from "../pages/CustomerSampling/CustomerSamplingPage";
import AddCustomerSamplingPage from "../pages/CustomerSampling/AddCustomerSamplingPage";
import BulkUploadPage from "../pages/CustomerSampling/BulkUploadPage";

export const CustomerSamplingRoute: RouteObject[] = [
    {
        path : '/customer-sampling',
        element : <CustomerSamplingPage/>
    },
    {
        path : 'customer-sampling/add-customer',
        element : <AddCustomerSamplingPage/>
    },
    {
        path : 'customer-sampling/add-customer/bulk-upload',
        element : <BulkUploadPage/>
    }
]