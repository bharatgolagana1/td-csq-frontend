import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useKeycloak } from '@react-keycloak/web';
import { useUserInfo } from '../../context/UserInfoContext';

interface AppbarProps {
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
  open: boolean;
}

const Appbar: React.FC<AppbarProps> = ({ handleDrawerOpen, open, handleDrawerClose }) => {
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'blue',
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
                Welcome {userInfo?.userName || 'User'}
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
