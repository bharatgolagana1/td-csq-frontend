import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './app/pages/Layout';
import { useState } from 'react';
import UserTypeMasterPage from './app/pages/UserTypeMasterPage';
import AirportCargoMasterPage from './app/pages/AirportCargoMasterPage';
import AirportDataMasterPage from './app/pages/AirportDataMasterPage';
import AssessmentQuestionsPage from './app/pages/AssessmentQuestionsPage';
import CustomerSamplingPage from './app/pages/CustomerSamplingPage';
import SettingsPage from './app/pages/SettingPages/SettingsPage';
import AssessmentCyclePage from './app/pages/SettingPages/AssessmentCyclePage';
import AssessmentFeedbackPage from './app/pages/AssessmentFeedbackPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDrawerOpen = () => {
    setSidebarOpen(true);
  };

  const handleDrawerClose = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <BrowserRouter>
        <Layout
          sidebarOpen={sidebarOpen}
          handleDrawerOpen={handleDrawerOpen}
          handleDrawerClose={handleDrawerClose}
        />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <Routes>
            <Route path='userType' element={<UserTypeMasterPage />} />
            <Route path='/airportCargo' element={<AirportCargoMasterPage/>}/>
            <Route path='/airportMaster' element={<AirportDataMasterPage/>}/>
            <Route path='/assessment' element={<AssessmentQuestionsPage/>}/>
            <Route path='/sampling' element={<CustomerSamplingPage/>}/>
            <Route path='/settings' element={<SettingsPage/>}/>
            <Route path='/settings/cycle' element={<AssessmentCyclePage/>}/>
            <Route path='/feedback' element={<AssessmentFeedbackPage/>}/>
          </Routes>
        </main>
      </BrowserRouter>
    </>
  );
}

export default App;
