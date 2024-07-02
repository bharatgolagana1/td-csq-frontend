import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainAppBar from './Features/MainAppBar/MainAppBar';
import { useState } from 'react';
import AirportCargoMaster from './Features/AirportCargoMaster/AirportCargoMaster';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleDrawerOpen = () => {
    setSidebarOpen(true);
  };

  const handleDrawerClose = () => {
    setSidebarOpen(false);
  };
  const drawerWidth = 240;
  return(
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
      <MainAppBar  sidebarOpen={sidebarOpen}
          handleDrawerOpen={handleDrawerOpen}
          handleDrawerClose={handleDrawerClose}/>
            <main
          style={{
            flexGrow: 10,
            padding: '16px',
            marginLeft: sidebarOpen ? `${drawerWidth}px` : '0px',  // Adjusted margin
            transition: 'margin 0.3s',
            marginTop: '50px', // Adjusted to make space for the AppBar
            backgroundColor: 'white',
            border: '2px solid white',
          }}
        >
      <Routes>
          <Route path='airportCargo' element={<AirportCargoMaster/>}/>
      </Routes>
      </main>
      </div>
    </Router>
  )
}

export default App
