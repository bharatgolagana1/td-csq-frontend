import React, { useEffect, useState, useCallback } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useKeycloak } from '@react-keycloak/web';
import axios from 'axios';

interface AppbarProps {
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
  open: boolean;
}

const Appbar: React.FC<AppbarProps> = ({ handleDrawerOpen, open, handleDrawerClose }) => {
  const { keycloak } = useKeycloak();
  const [userData, setUserData] = useState<any>(null);

  const fetchUserData = useCallback(async () => {
    if (keycloak.authenticated) {
      try {
        const response = await axios.get('https://auth.tinydata.in/realms/csq/protocol/openid-connect/userinfo', {
          headers: {
            Authorization: `Bearer ${keycloak.token}`
          }
        });
        
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  }, [keycloak.authenticated, keycloak.token]);

  useEffect(() => {
    keycloak.onAuthSuccess = fetchUserData;
    fetchUserData();

    return () => {
      keycloak.onAuthSuccess = undefined;
    };
  }, [fetchUserData, keycloak]);

  const handleLogin = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    keycloak.login();
  };

  const handleLogout = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    keycloak.logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'blue'
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={!open ? handleDrawerOpen : handleDrawerClose}
          >
            <MenuIcon />
          </IconButton>
          <img src="https://res.cloudinary.com/dau1qydx2/image/upload/v1718550397/CSQ-icon_ajtcnz.png" alt="CSQ logo" width="60px" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CSQ
          </Typography>
          {keycloak.authenticated ? (
            <>
              <Typography variant="body1" component="div" sx={{ marginRight: 2 }}>
                {userData ? `Welcome, ${userData.name}` : 'Loading...'}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Button color="inherit" onClick={handleLogin}>Login</Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Appbar;
