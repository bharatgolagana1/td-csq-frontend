import React from 'react';
import Appbar from '../../Components/Appbar/Appbar';
import Sidebar from '../../Components/Sidebar/Sidebar';

interface NavbarMainProps {
  sidebarOpen: boolean;
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
}

const MainAppBar: React.FC<NavbarMainProps> = ({ sidebarOpen, handleDrawerOpen, handleDrawerClose }) => {
  return (
    <div>
      <Appbar handleDrawerOpen={handleDrawerOpen} open={sidebarOpen} handleDrawerClose={handleDrawerClose} />
      <Sidebar open={sidebarOpen} />
    </div>
  );
};

export default MainAppBar;
