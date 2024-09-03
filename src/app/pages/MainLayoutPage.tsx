import React, { ReactNode } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Toolbar from '../features/toolbar/Toolbar';
import Sidebar from '../features/sidebar/Sidebar';
import { Outlet } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayoutPage: React.FC<MainLayoutProps> = ({ }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      <Toolbar />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayoutPage;
