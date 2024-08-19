import SettingsPage from '../pages/SettingPages/SettingsPage';
import AssessmentCyclePage from '../pages/SettingPages/AssessmentCyclePage';

const SettingsRoutes = [
  {
    path: "/settings",
    element : <SettingsPage />
  },
  {
    path: "/settings/cycle",
    element: <AssessmentCyclePage />
  }
];

export default SettingsRoutes;
