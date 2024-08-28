import SettingsPage from '../pages/SettingPages/SettingsPage';
import AssessmentCyclePage from '../pages/SettingPages/AssessmentCyclePage';
import AddAssessmentCycleForm from '../features/settings/AssessmentCycle/components/assessmentCycleForm/AssessmentCycleForm';

const SettingsRoutes = [
  {
    path: "/settings",
    element : <SettingsPage />
  },
  {
    path: "/settings/cycle",
    element: <AssessmentCyclePage />
  },
  {
    path : "/settings/cycle/addCycle",
    element : <AddAssessmentCycleForm/>
  }
];

export default SettingsRoutes;
