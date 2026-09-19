import { lazy } from 'react';
import { RouteObject } from "react-router-dom";
const ApprovalsPage = lazy(() => import("../features/approvals/ApprovalsPage"));

export const ApprovalsRoute: RouteObject[] = [
    {
        path: '/approvals',
        element: <ApprovalsPage />
    }
]
