import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
const AdminMasterPage = lazy(() => import('../features/adminMaster/AdminMasterPage'));

export const AdminMasterRoute: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminMasterPage />,
  },
];

export default AdminMasterRoute;
