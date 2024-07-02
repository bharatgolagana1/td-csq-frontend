import React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AirportIcon from '@mui/icons-material/FlightTakeoff';
import CargoIcon from '@mui/icons-material/LocalShipping';
import UserTypeIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();

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
            <ListItemButton onClick={() => navigate('/dashboard')}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/userType')}>
                <ListItemIcon>
                  <UserTypeIcon />
                </ListItemIcon>
                <ListItemText primary="User Type" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/airportMaster')}>
                <ListItemIcon>
                  <AirportIcon />
                </ListItemIcon>
                <ListItemText primary="Airport Master Data" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/airportCargo')}>
                <ListItemIcon>
                  <CargoIcon />
                </ListItemIcon>
                <ListItemText primary="Airport Cargo Data" />
              </ListItemButton>
            </ListItem>
          </List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/users')}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/assessment')}>
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Assessment Questions" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/feedback')}>
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Assessment Feedbacks" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/sampling')}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Customer Sampling" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
