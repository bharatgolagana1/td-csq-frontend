import React from 'react';
import { AppBar, Toolbar as MuiToolbar, Typography, IconButton, Box } from '@mui/material';
import './Toolbar.css';

// Import your PNG images
import help from '../../../assert/help.png';
import logout from '../../../assert/logout.png'

const Toolbar: React.FC = () => {
  return (
    <div className="header">
      <AppBar position="fixed" className="toolbar">
        <MuiToolbar className="toolbar__content">
          <Box className="toolbar__title">
            <img src="/src/assert/Icon.svg" alt="Logo" className="toolbar__logo" />
            <Typography variant="h6" noWrap component="div" className="title_card">
              Cargo Service Quality
            </Typography>
          </Box>
          <Box className="toolbar__buttons">
            <IconButton className="toolbar__icon-button">
              <img src={help} alt="Support" style={{ width: 24, height: 24 }} />
            </IconButton>
            <IconButton className="toolbar__icon-button">
              <img src={logout} alt="Logout" style={{ width: 24, height: 24 }} />
            </IconButton>
          </Box>
        </MuiToolbar>
      </AppBar>
    </div>
  );
};

export default Toolbar;
