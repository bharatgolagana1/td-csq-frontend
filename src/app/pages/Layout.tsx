import React from 'react';
import Appbar from '../features/appbar/AppBar';
import Sidebar from '../features/sidebar/SideBar';

interface NavbarMainProps {
  sidebarOpen: boolean;
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
}

const Layout: React.FC<NavbarMainProps> = ({ sidebarOpen, handleDrawerOpen, handleDrawerClose }) => {
  return (
    <div>
      <Appbar handleDrawerOpen={handleDrawerOpen} open={sidebarOpen} handleDrawerClose={handleDrawerClose} />
      <Sidebar open={sidebarOpen} />
    </div>
  );
};

export default Layout;
