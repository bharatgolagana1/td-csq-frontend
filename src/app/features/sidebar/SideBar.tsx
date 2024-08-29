import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Link } from 'react-router-dom';
import './Sidebar.css';

import dashboard from '../../../assert/dashboard.png'
import customerSampling from '../../../assert/customerSampling.png'
import assessment from '../../../assert/assessment.png'
import history from '../../../assert/history.png'
import assessmentHistory from '../../../assert/assessmentHistory.png'

const Sidebar: React.FC = () => {
  const [activeItem, setActiveItem] = useState<string>('Assessment');
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);

  const handleListItemClick = (item: string) => {
    setActiveItem(item);
    if (item === 'History') {
      setHistoryExpanded(!historyExpanded); // Toggle expanded state
    }
  };

  return (
    <div className="sidebar_main">
      <Drawer
        variant="permanent"
        className="drawer"
        classes={{ paper: 'drawer-paper' }}
      >
        <Box className="sidebar_box">
          <List className="list-items">
            <ListItem
              className={`list-item ${activeItem === 'Dashboard' ? 'active' : ''}`}
              component={Link} // Use Link to enable navigation
              to="/dashboard" // Set the route path here
              onClick={() => handleListItemClick('Dashboard')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={dashboard} alt="Dashboard" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Assessment' ? 'active' : ''}`}
              component={Link} // Use Link to enable navigation
              to="/assessment" // Set the route path here
              onClick={() => handleListItemClick('Assessment')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={assessment} alt="Assessment" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Assessment" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Customer Sampling' ? 'active' : ''}`}
              component={Link} // Use Link to enable navigation
              to="/customer-sampling" // Set the route path here
              onClick={() => handleListItemClick('Customer Sampling')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={customerSampling} alt="Customer Sampling" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Customer Sampling" style={{width:'137px'}}/>
            </ListItem>
            <ListItemButton
              className={`list-item ${activeItem === 'History' ? 'active' : ''}`}
              onClick={() => handleListItemClick('History')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={history} alt="History" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="History" />
              {historyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={historyExpanded}>
              <List component="div" disablePadding>
                <ListItemButton
                  className={`list-item ${activeItem === 'Assessment History' ? 'active' : ''}`}
                  component={Link} // Use Link to enable navigation
                  to="/assessment-history" // Set the route path here
                  onClick={() => handleListItemClick('Assessment History')}
                >
                  <ListItemIcon className="list-item-icon">
                    <img src={assessmentHistory} alt="Assessment History" style={{ width: 24, height: 24 }} />
                  </ListItemIcon>
                  <ListItemText primary="Assessment" />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </Box>
      </Drawer>
    </div>
  );
};

export default Sidebar;
