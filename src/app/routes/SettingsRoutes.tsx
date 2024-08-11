import SettingsPage from '../pages/SettingPages/SettingsPage';
import AssessmentCyclePage from '../pages/SettingPages/AssessmentCyclePage';
import ProtectedRoute from './ProtectedRoutes'; // Adjust the path as necessary
import RoleMappingPage from '../pages/SettingPages/RoleMappingPage';

const SettingsRoutes = [
  {
    path: "/settings",
    element: <ProtectedRoute element={<SettingsPage />} requiredRole="Super Admin" />
  },
  {
    path: "/settings/cycle",
    element: <ProtectedRoute element={<AssessmentCyclePage />} requiredRole="Super Admin" />
  },
  {
    path:'/settings/role-mapping',
    element : <RoleMappingPage/>
  }
];

export default SettingsRoutes;
