import { Outlet } from 'react-router-dom';
import Appbar from '../features/appbar/AppBar';
import Sidebar from '../features/sidebar/SideBar';
import { useUserInfo } from '../context/UserInfoContext';

interface NavbarMainProps {
  sidebarOpen: boolean;
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
}

const Layout: React.FC<NavbarMainProps> = ({ sidebarOpen, handleDrawerOpen, handleDrawerClose }) => {
  const { userInfo } = useUserInfo();

  return (
    <div>
      <Appbar handleDrawerOpen={handleDrawerOpen} open={sidebarOpen} handleDrawerClose={handleDrawerClose} />
      <Sidebar open={sidebarOpen} role={userInfo.role} /> {/* Dynamically set role */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Outlet /> {/* This is where child routes will be rendered */}
      </div>
    </div>
  );
};

export default Layout;
