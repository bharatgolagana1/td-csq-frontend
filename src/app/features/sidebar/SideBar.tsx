import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AirportIcon from '@mui/icons-material/FlightTakeoff';
import CargoIcon from '@mui/icons-material/LocalShipping';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import UserTypeIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const [masterDataOpen, setMasterDataOpen] = useState(false);

  const handleMasterDataClick = () => {
    setMasterDataOpen(!masterDataOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', padding: '16px', justifyContent: 'center' }}>
          <Typography variant="h6">CSQ</Typography>
        </Box>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/dashboard">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleMasterDataClick}>
              <ListItemIcon>
                <UserTypeIcon />
              </ListItemIcon>
              <ListItemText primary="Master Data" />
              {masterDataOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={masterDataOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/userType">
                  <ListItemIcon>
                    <SupervisorAccountIcon />
                  </ListItemIcon>
                  <ListItemText primary="User Type Master" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/airportMaster">
                  <ListItemIcon>
                    <AirportIcon />
                  </ListItemIcon>
                  <ListItemText primary="Airport Master Data" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/airportCargo">
                  <ListItemIcon>
                    <CargoIcon />
                  </ListItemIcon>
                  <ListItemText primary="Airport Cargo Data" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/assessment">
                  <ListItemIcon>
                    <AssessmentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Assessment Questions" />
                </ListItemButton>
              </ListItem>
            </List>
          </Collapse>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/users">
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Selected Users" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/feedback">
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Assessment Feedbacks" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/sampling">
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Customer Sampling" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/settings">
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
