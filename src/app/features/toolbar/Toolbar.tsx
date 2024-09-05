import React from 'react';
import { AppBar, Toolbar as MuiToolbar, Typography, IconButton, Box, Button } from '@mui/material';
import './Toolbar.css';
import { useKeycloak } from '@react-keycloak/web';
import { useUserInfo } from '../../context/UserInfoContext';
// Import your PNG images
import help from '../../../assets/help.png';
import logout from '../../../assets/logout.png'


const Toolbar: React.FC = () => {
  const { keycloak } = useKeycloak();
  const { userInfo } = useUserInfo(); // Destructure userInfo

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    keycloak.login();
  };

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    keycloak.logout();
  };


  return (
    <div className="header">
      <AppBar position="fixed" className="toolbar">
        <MuiToolbar className="toolbar__content">
          <Box className="toolbar__title">
            <img src="/src/assets/Icon.svg" alt="Logo" className="toolbar__logo" />
            <Typography variant="h6" noWrap component="div" className="title_card">
              Cargo Service Quality
            </Typography>
          </Box>
          <Box className="toolbar__buttons">
            <IconButton className="toolbar__icon-button">
              <img src={help} alt="Support" style={{ width: 24, height: 24 }} />
            </IconButton>
            {keycloak.authenticated ? (
            <>
              <Typography variant="body1" sx={{ color :'black'}}>
                Welcome {userInfo?.userName || 'User'}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                 <img src={logout} alt="Logout" style={{ width: 24, height: 24 }} />
              </Button>
              </>
             ) : (
            <Button color="inherit" onClick={handleLogin}>Login</Button>
             )}
          </Box>
        </MuiToolbar>
      </AppBar>
    </div>
  );
};

export default Toolbar;
